const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay (only if credentials are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    process.env.RAZORPAY_KEY_ID !== 'your-razorpay-key-id') {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for payment
// @access  Private
router.post('/create-order', auth, [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('currency').optional().isIn(['INR']).withMessage('Currency must be INR'),
    body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
    try {
        // Check if Razorpay is configured
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is not configured. Please contact administrator.'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { amount, currency = 'INR', orderId } = req.body;

        // Verify order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            user: req.user.userId,
            'payment.status': 'pending'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or already processed'
            });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: order.orderNumber,
            notes: {
                orderId: order._id.toString(),
                userId: req.user.userId.toString()
            }
        });

        // Update order with Razorpay order ID
        order.payment.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
            success: true,
            message: 'Payment order created successfully',
            data: {
                order: razorpayOrder,
                orderId: order._id
            }
        });

    } catch (error) {
        console.error('Create payment order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating payment order'
        });
    }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', auth, [
    body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
    body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            user: req.user.userId,
            'payment.razorpayOrderId': razorpay_order_id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Update order payment status
        order.payment.status = 'paid';
        order.payment.razorpayPaymentId = razorpay_payment_id;
        order.payment.razorpaySignature = razorpay_signature;
        order.status = 'confirmed';
        await order.save();

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                order: order,
                paymentId: razorpay_payment_id
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while verifying payment'
        });
    }
});

// @route   POST /api/payments/cod-confirm
// @desc    Confirm Cash on Delivery order
// @access  Private
router.post('/cod-confirm', auth, [
    body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { orderId } = req.body;

        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            user: req.user.userId,
            'payment.method': 'cod',
            'payment.status': 'pending'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'COD order not found or already processed'
            });
        }

        // Update order status
        order.payment.status = 'paid';
        order.status = 'confirmed';
        await order.save();

        res.json({
            success: true,
            message: 'COD order confirmed successfully',
            data: { order }
        });

    } catch (error) {
        console.error('COD confirm error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while confirming COD order'
        });
    }
});

// @route   GET /api/payments/razorpay-key
// @desc    Get Razorpay key for frontend
// @access  Public
router.get('/razorpay-key', (req, res) => {
    if (!razorpay) {
        return res.status(503).json({
            success: false,
            message: 'Payment service is not configured'
        });
    }
    
    res.json({
        success: true,
        data: {
            key: process.env.RAZORPAY_KEY_ID
        }
    });
});

module.exports = router;
