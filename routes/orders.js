const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNewOrderEmail } = require('../utils/mailer');

const router = express.Router();

/**
 * ==================================================
 *  GUEST ORDER (must be defined before private routes)
 * ==================================================
 */

// @route   POST /api/orders/guest
// @desc    Create a guest order (no login) and notify admin via email
// @access  Public
router.post('/guest', [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.name').isString().withMessage('Item name is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be provided'),
    body('customerType').isIn(['college', 'outsider']).withMessage('Customer type must be college or outsider'),
    body('hostel').optional().isString(),
    body('address').isString().withMessage('Address is required'),
    body('contactInfo').isObject().withMessage('Contact info is required'),
    body('contactInfo.name').notEmpty().withMessage('Contact name is required'),
    body('contactInfo.phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('contactInfo.email').isEmail().withMessage('Valid email is required'),
    body('payment.method').isIn(['cod', 'online']).withMessage('Payment method must be cod or online')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { items, customerType, hostel, address, contactInfo, payment, notes } = req.body;

        // Calculate pricing
        const subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        const deliveryFee = subtotal >= 100 ? 0 : 30;
        const total = subtotal + deliveryFee;

        // Build a lightweight order object for email (not persisted)
        const now = Date.now();
        const order = {
            orderNumber: `GD${String(now).slice(-6)}`,
            status: 'pending',
            items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, total: i.price * i.quantity })),
            customerType,
            hostel: customerType === 'college' ? hostel : undefined,
            deliveryAddress: { street: address, city: '', state: '', pincode: '' },
            contactInfo,
            pricing: { subtotal, deliveryFee, total },
            payment: { method: payment.method, status: 'pending' },
            deliveryDate: new Date(),
            deliveryTime: 'morning',
            notes
        };

        // Respond immediately, then attempt email in background (non-blocking)
        res.status(201).json({
            success: true,
            message: 'Order received',
            data: { orderNumber: order.orderNumber, pricing: order.pricing }
        });

        // Fire-and-forget email send. Errors are logged only.
        Promise.resolve()
            .then(() => sendNewOrderEmail(order))
            .catch((e) => console.error('Guest order email error (background):', e));
        
    } catch (error) {
        console.error('Guest order error:', error);
        return res.status(500).json({ success: false, message: 'Server error while creating guest order' });
    }
});


/**
 * ======================
 *  AUTHENTICATED ROUTES
 * ======================
 */

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('customerType').isIn(['college', 'outsider']).withMessage('Customer type must be college or outsider'),
    body('hostel').optional().notEmpty().withMessage('Hostel is required for college students'),
    body('deliveryAddress').isObject().withMessage('Delivery address is required'),
    body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
    body('deliveryAddress.city').notEmpty().withMessage('City is required'),
    body('deliveryAddress.state').notEmpty().withMessage('State is required'),
    body('deliveryAddress.pincode').notEmpty().withMessage('Pincode is required'),
    body('contactInfo').isObject().withMessage('Contact info is required'),
    body('contactInfo.name').notEmpty().withMessage('Contact name is required'),
    body('contactInfo.phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('contactInfo.email').isEmail().withMessage('Valid email is required'),
    body('payment.method').isIn(['cod', 'online']).withMessage('Payment method must be cod or online'),
    body('deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
    body('deliveryTime').optional().isIn(['morning', 'evening'])
], async (req, res) => {
    // ... your existing create order logic (unchanged)
});

/**
 * (Keep the rest of your GET /, GET /:id, PUT /:id/cancel, admin routes as is)
 */

module.exports = router;
