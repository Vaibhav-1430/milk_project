const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

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
            items,
            customerType,
            hostel,
            deliveryAddress,
            contactInfo,
            payment,
            deliveryDate,
            deliveryTime = 'morning',
            notes
        } = req.body;

        // Validate delivery date (should be today or future)
        const deliveryDateObj = new Date(deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deliveryDateObj < today) {
            return res.status(400).json({
                success: false,
                message: 'Delivery date must be today or in the future'
            });
        }

        // Validate and calculate order items
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.product} not found`
                });
            }

            if (!product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${product.name} is not available`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                total: itemTotal
            });
        }

        // Calculate delivery fee (free for orders above ₹100)
        const deliveryFee = subtotal >= 100 ? 0 : 30;
        const total = subtotal + deliveryFee;

        // Create order
        const order = new Order({
            user: req.user.userId,
            items: orderItems,
            customerType,
            hostel: customerType === 'college' ? hostel : undefined,
            deliveryAddress,
            contactInfo,
            pricing: {
                subtotal,
                deliveryFee,
                total
            },
            payment: {
                method: payment.method,
                status: 'pending'
            },
            deliveryDate: deliveryDateObj,
            deliveryTime,
            notes
        });

        await order.save();

        // Update product stock
        for (const item of items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating order'
        });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, [
    query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
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

        const { status, page = 1, limit = 10 } = req.query;

        const filter = { user: req.user.userId };
        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('items.product', 'name image quantity')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalOrders: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId
        }).populate('items.product', 'name image quantity');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching order'
        });
    }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', auth, [
    body('reason').optional().isString().isLength({ max: 200 })
], async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or cannot be cancelled'
            });
        }

        // Check if order can be cancelled (within 2 hours of creation)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        if (order.createdAt < twoHoursAgo) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled after 2 hours'
            });
        }

        // Update order status
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;

        // Refund payment if online payment was made
        if (order.payment.method === 'online' && order.payment.status === 'paid') {
            order.payment.status = 'refunded';
        }

        await order.save();

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling order'
        });
    }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private (Admin)
router.get('/admin/all', adminAuth, [
    query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
    query('date').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
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

        const { status, date, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.deliveryDate = { $gte: startDate, $lt: endDate };
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('user', 'name email phone')
            .populate('items.product', 'name image quantity')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalOrders: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// @route   PUT /api/orders/admin/:id/status
// @desc    Update order status (Admin only)
// @access  Private (Admin)
router.put('/admin/:id/status', adminAuth, [
    body('status').isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']).withMessage('Invalid status'),
    body('notes').optional().isString().isLength({ max: 200 })
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

        const { status, notes } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        if (notes) order.notes = notes;
        if (status === 'delivered') order.deliveredAt = new Date();

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating order status'
        });
    }
});

module.exports = router;
