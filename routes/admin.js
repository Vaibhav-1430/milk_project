const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/admin/init
 * @desc    Initialize admin user (run once)
 * @access  Public (initial setup)
 */
router.post('/init', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin user already exists' });
    }

    const admin = new User({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@garamdoodh.com',
      phone: '9999999999',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: { admin: { name: admin.name, email: admin.email, role: admin.role } }
    });
  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating admin user' });
  }
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      todayOrders,
      pendingOrders,
      revenue,
      todayRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' }
          }
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ])
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5);

    const lowStockProducts = await Product.find({ stock: { $lte: 10 }, isAvailable: true }).limit(5);

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalProducts,
          totalOrders,
          todayOrders,
          pendingOrders,
          revenue: revenue[0]?.total || 0,
          todayRevenue: todayRevenue[0]?.total || 0
        },
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching dashboard data' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (with pagination & search)
 * @access  Private (Admin)
 */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'customer' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin)
 */
router.put('/users/:id/status', adminAuth, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating user status' });
  }
});

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data (orders, revenue, top products)
 * @access  Private (Admin)
 */
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const endDate = new Date();
    let startDate;

    switch (period) {
      case '1d': startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const ordersByDate = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
      { $sort: { _id: 1 } }
    ]);

    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    const customerTypeDistribution = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$customerType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: { period, ordersByDate, ordersByStatus, topProducts, customerTypeDistribution }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching analytics' });
  }
});

module.exports = router;
