const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const Order = require('../../models/Order');
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

exports.handler = async (event) => {
    try {
        // Verify admin authentication
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const decoded = verifyAdminToken(authHeader);
        
        console.log('🔍 Admin customers request from:', decoded.userId);
        await connectToDatabase();
        
        if (event.httpMethod === 'GET') {
            return await handleGetCustomers(event);
        } else if (event.httpMethod === 'PUT') {
            return await handleUpdateCustomer(event);
        } else {
            return json({ success: false, message: 'Method Not Allowed' }, 405);
        }
        
    } catch (error) {
        console.error('💥 Admin customers error:', error);
        return json({
            success: false,
            message: error.message === 'No token provided' || error.message === 'Invalid token' 
                ? 'Unauthorized' 
                : 'Failed to process request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500);
    }
};

async function handleGetCustomers(event) {
    const params = new URLSearchParams(event.queryStringParameters || '');
    
    // Parse query parameters
    const page = parseInt(params.get('page')) || 1;
    const limit = Math.min(parseInt(params.get('limit')) || 20, 100);
    const customerType = params.get('customerType');
    const isActive = params.get('isActive');
    const search = params.get('search');
    const sortBy = params.get('sortBy') || 'createdAt';
    const sortOrder = params.get('sortOrder') === 'asc' ? 1 : -1;
    const customerId = params.get('customerId');
    
    // If requesting specific customer details
    if (customerId) {
        return await handleGetCustomerDetails(customerId);
    }
    
    // Build filter query (exclude admin users)
    const filter = { role: { $ne: 'admin' } };
    
    if (customerType) filter.customerType = customerType;
    if (isActive !== null && isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }
    
    // Search filter
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex }
        ];
    }
    
    try {
        // Get total count for pagination
        const totalCustomers = await User.countDocuments(filter);
        
        // Get customers with pagination
        const customers = await User.find(filter)
            .select('-password') // Exclude password field
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        
        // Get order statistics for each customer
        const customerIds = customers.map(customer => customer._id);
        
        const orderStats = await Order.aggregate([
            {
                $match: { user: { $in: customerIds } }
            },
            {
                $group: {
                    _id: '$user',
                    totalOrders: { $sum: 1 },
                    totalSpent: { 
                        $sum: { 
                            $cond: [
                                { $eq: ['$payment.status', 'paid'] },
                                '$pricing.total',
                                0
                            ]
                        }
                    },
                    lastOrderDate: { $max: '$createdAt' },
                    avgOrderValue: { 
                        $avg: { 
                            $cond: [
                                { $eq: ['$payment.status', 'paid'] },
                                '$pricing.total',
                                null
                            ]
                        }
                    }
                }
            }
        ]);
        
        // Create a map for quick lookup
        const statsMap = {};
        orderStats.forEach(stat => {
            statsMap[stat._id.toString()] = stat;
        });
        
        // Enhance customers with order statistics
        const enhancedCustomers = customers.map(customer => {
            const stats = statsMap[customer._id.toString()] || {
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null,
                avgOrderValue: 0
            };
            
            return {
                ...customer,
                orderStats: {
                    totalOrders: stats.totalOrders,
                    totalSpent: stats.totalSpent,
                    lastOrderDate: stats.lastOrderDate,
                    avgOrderValue: stats.avgOrderValue || 0
                },
                customerValue: calculateCustomerValue(stats),
                status: customer.isActive ? 'active' : 'inactive'
            };
        });
        
        return json({
            success: true,
            data: {
                customers: enhancedCustomers,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCustomers / limit),
                    totalCustomers,
                    limit,
                    hasNext: page < Math.ceil(totalCustomers / limit),
                    hasPrev: page > 1
                },
                filters: {
                    customerType,
                    isActive,
                    search
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}

async function handleGetCustomerDetails(customerId) {
    try {
        // Get customer details
        const customer = await User.findById(customerId)
            .select('-password')
            .lean();
        
        if (!customer) {
            return json({ success: false, message: 'Customer not found' }, 404);
        }
        
        // Get customer's order history
        const orders = await Order.find({ user: customerId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        
        // Calculate detailed statistics
        const orderStats = await Order.aggregate([
            {
                $match: { user: customer._id }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { 
                        $sum: { 
                            $cond: [
                                { $eq: ['$payment.status', 'paid'] },
                                '$pricing.total',
                                0
                            ]
                        }
                    },
                    avgOrderValue: { 
                        $avg: { 
                            $cond: [
                                { $eq: ['$payment.status', 'paid'] },
                                '$pricing.total',
                                null
                            ]
                        }
                    },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            }
        ]);
        
        // Get order status breakdown
        const statusBreakdown = await Order.aggregate([
            {
                $match: { user: customer._id }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const stats = orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0,
            firstOrderDate: null,
            lastOrderDate: null
        };
        
        const statusMap = {};
        statusBreakdown.forEach(item => {
            statusMap[item._id] = item.count;
        });
        
        return json({
            success: true,
            data: {
                customer: {
                    ...customer,
                    orderStats: {
                        ...stats,
                        statusBreakdown: statusMap
                    },
                    customerValue: calculateCustomerValue(stats),
                    recentOrders: orders.slice(0, 10)
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching customer details:', error);
        throw error;
    }
}

async function handleUpdateCustomer(event) {
    const pathParts = event.path.split('/');
    const customerId = pathParts[pathParts.length - 1];
    
    if (!customerId) {
        return json({ success: false, message: 'Customer ID is required' }, 400);
    }
    
    const updates = parseBody(event);
    
    try {
        const customer = await User.findById(customerId);
        
        if (!customer) {
            return json({ success: false, message: 'Customer not found' }, 404);
        }
        
        // Update allowed fields
        const allowedUpdates = ['isActive', 'customerType', 'address', 'phone'];
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                customer[field] = updates[field];
            }
        });
        
        await customer.save();
        
        // Remove password from response
        const customerResponse = customer.toObject();
        delete customerResponse.password;
        
        return json({
            success: true,
            message: 'Customer updated successfully',
            data: { customer: customerResponse }
        });
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            return json({
                success: false,
                message: 'Validation error',
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            }, 400);
        }
        
        console.error('Error updating customer:', error);
        throw error;
    }
}

// Helper function to calculate customer value
function calculateCustomerValue(stats) {
    const { totalOrders, totalSpent, avgOrderValue } = stats;
    
    if (totalOrders === 0) return 'new';
    
    if (totalSpent > 5000 || totalOrders > 20) return 'high';
    if (totalSpent > 2000 || totalOrders > 10) return 'medium';
    return 'low';
}