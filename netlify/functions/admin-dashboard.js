const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const jwt = require('jsonwebtoken');

// Verify admin token
function verifyAdminToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // For demo tokens, allow them through
    if (token.startsWith('admin-token-') || token.startsWith('demo-admin-token-')) {
        return { userId: 'admin1', role: 'admin' };
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
}

// Get date range for filtering
function getDateRange(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
        case 'today':
            return {
                start: today,
                end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            };
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return {
                start: weekStart,
                end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            };
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            return {
                start: monthStart,
                end: monthEnd
            };
        default:
            return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        // Verify admin authentication
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const decoded = verifyAdminToken(authHeader);
        
        console.log('🔍 Admin dashboard request from:', decoded.userId);
        await connectToDatabase();
        
        // Get current date ranges
        const todayRange = getDateRange('today');
        const weekRange = getDateRange('week');
        const monthRange = getDateRange('month');
        
        // Get yesterday for comparison
        const yesterday = new Date(todayRange.start.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayRange = {
            start: yesterday,
            end: todayRange.start
        };
        
        // Parallel queries for better performance
        const [
            todayOrders,
            yesterdayOrders,
            weeklyOrders,
            monthlyOrders,
            totalCustomers,
            pendingOrders,
            recentOrders,
            lowStockProducts,
            failedPayments,
            todayRevenue,
            weeklyRevenue,
            monthlyRevenue
        ] = await Promise.all([
            // Today's orders
            Order.countDocuments({
                createdAt: { $gte: todayRange.start, $lt: todayRange.end }
            }),
            
            // Yesterday's orders for comparison
            Order.countDocuments({
                createdAt: { $gte: yesterdayRange.start, $lt: yesterdayRange.end }
            }),
            
            // Weekly orders
            Order.countDocuments({
                createdAt: { $gte: weekRange.start, $lt: weekRange.end }
            }),
            
            // Monthly orders
            Order.countDocuments({
                createdAt: { $gte: monthRange.start, $lt: monthRange.end }
            }),
            
            // Total customers
            User.countDocuments({ role: { $ne: 'admin' } }),
            
            // Pending orders
            Order.countDocuments({ status: 'pending' }),
            
            // Recent orders (last 10)
            Order.find()
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .select('orderNumber user items pricing status createdAt deliveryDate deliveryTime'),
            
            // Low stock products
            Product.countDocuments({ 
                stock: { $lte: 10 },
                isAvailable: true 
            }),
            
            // Failed payments today
            Order.countDocuments({
                'payment.status': 'failed',
                createdAt: { $gte: todayRange.start, $lt: todayRange.end }
            }),
            
            // Revenue calculations
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: todayRange.start, $lt: todayRange.end },
                        'payment.status': 'paid'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$pricing.total' }
                    }
                }
            ]),
            
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: weekRange.start, $lt: weekRange.end },
                        'payment.status': 'paid'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$pricing.total' }
                    }
                }
            ]),
            
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthRange.start, $lt: monthRange.end },
                        'payment.status': 'paid'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$pricing.total' }
                    }
                }
            ])
        ]);
        
        // Calculate percentage changes
        const ordersChange = yesterdayOrders > 0 
            ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1)
            : todayOrders > 0 ? 100 : 0;
        
        // Get yesterday's revenue for comparison
        const yesterdayRevenueResult = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: yesterdayRange.start, $lt: yesterdayRange.end },
                    'payment.status': 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$pricing.total' }
                }
            }
        ]);
        
        const todayRevenueAmount = todayRevenue[0]?.total || 0;
        const yesterdayRevenueAmount = yesterdayRevenueResult[0]?.total || 0;
        
        const revenueChange = yesterdayRevenueAmount > 0 
            ? ((todayRevenueAmount - yesterdayRevenueAmount) / yesterdayRevenueAmount * 100).toFixed(1)
            : todayRevenueAmount > 0 ? 100 : 0;
        
        // Format recent orders
        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.orderNumber || order._id,
            customer: order.user?.name || 'Guest',
            customerEmail: order.user?.email || '',
            amount: order.pricing?.total || 0,
            status: order.status,
            createdAt: order.createdAt,
            deliveryDate: order.deliveryDate,
            deliveryTime: order.deliveryTime,
            itemCount: order.items?.length || 0,
            items: order.items?.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })) || []
        }));
        
        // Build response
        const dashboardData = {
            metrics: {
                todayOrders,
                todayRevenue: todayRevenueAmount,
                totalCustomers,
                pendingOrders,
                weeklyRevenue: weeklyRevenue[0]?.total || 0,
                monthlyRevenue: monthlyRevenue[0]?.total || 0,
                lowStockCount: lowStockProducts,
                failedPayments,
                ordersChange: parseFloat(ordersChange),
                revenueChange: parseFloat(revenueChange),
                weeklyOrders,
                monthlyOrders
            },
            recentOrders: formattedRecentOrders,
            alerts: []
        };
        
        // Generate alerts
        if (lowStockProducts > 0) {
            dashboardData.alerts.push({
                type: 'warning',
                title: 'Low Stock Alert',
                message: `${lowStockProducts} product${lowStockProducts > 1 ? 's' : ''} running low on stock`,
                time: new Date()
            });
        }
        
        if (failedPayments > 0) {
            dashboardData.alerts.push({
                type: 'error',
                title: 'Payment Failures',
                message: `${failedPayments} payment${failedPayments > 1 ? 's' : ''} failed today`,
                time: new Date()
            });
        }
        
        if (pendingOrders > 5) {
            dashboardData.alerts.push({
                type: 'info',
                title: 'Pending Orders',
                message: `${pendingOrders} orders pending processing`,
                time: new Date()
            });
        }
        
        console.log('✅ Dashboard data compiled successfully');
        
        return json({
            success: true,
            data: dashboardData
        });
        
    } catch (error) {
        console.error('💥 Admin dashboard error:', error);
        return json({
            success: false,
            message: 'Failed to load dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};