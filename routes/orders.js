const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNewOrderEmail } = require('../utils/mailer');

const router = express.Router();

/**
 * ==================================================
 *  GUEST ORDER (Public route)
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
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.price * i.quantity
      })),
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

    // Send response immediately
    res.status(201).json({
      success: true,
      message: 'Order received',
      data: { orderNumber: order.orderNumber, pricing: order.pricing }
    });

    // Send email asynchronously
    Promise.resolve()
      .then(() => sendNewOrderEmail(order))
      .catch((e) => console.error('Guest order email error:', e));

  } catch (error) {
    console.error('Guest order error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating guest order' });
  }
});

/**
 * ==================================================
 *  AUTHENTICATED USER ORDER
 * ==================================================
 */

// @route   POST /api/orders
// @desc    Create new order for logged-in users
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
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const {
      items, customerType, hostel, deliveryAddress,
      contactInfo, payment, deliveryDate, deliveryTime, notes
    } = req.body;

    // Fetch products and calculate totals
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = products.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});

    const orderItems = items.map(i => ({
      product: i.product,
      name: productMap[i.product]?.name || 'Unknown',
      quantity: i.quantity,
      price: productMap[i.product]?.price || 0,
      total: (productMap[i.product]?.price || 0) * i.quantity
    }));

    const subtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
    const deliveryFee = subtotal >= 100 ? 0 : 30;
    const total = subtotal + deliveryFee;

    const order = new Order({
      user: req.user.id,
      orderNumber: `GD${String(Date.now()).slice(-6)}`,
      items: orderItems,
      customerType,
      hostel,
      deliveryAddress,
      contactInfo,
      pricing: { subtotal, deliveryFee, total },
      payment: { method: payment.method, status: 'pending' },
      deliveryDate,
      deliveryTime,
      notes
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating order' });
  }
});

/**
 * ==================================================
 *  ADMIN ORDER MANAGEMENT ROUTES
 * ==================================================
 */

// @route   GET /api/admin/orders
// @desc    Fetch all orders for admin dashboard
// @access  Private (Admin)
router.get('/admin/orders', adminAuth, async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching orders' });
  }
});

// @route   PUT /api/admin/orders/:id/placed
// @desc    Update "isPlaced" checkbox value
// @access  Private (Admin)
router.put('/admin/orders/:id/placed', adminAuth, async (req, res) => {
  try {
    const { placed } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.isPlaced = placed;
    await order.save();

    res.json({ success: true, message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Admin update order placed error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating order status' });
  }
});

module.exports = router;
