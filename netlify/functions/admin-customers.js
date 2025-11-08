const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const Order = require('../../models/Order');
const jwt = require('jsonwebtoken');

// Verify admin token
async function verifyAdminToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user exists and is admin
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== 'admin') {
            throw new Error('Access denied - Admin role required');
        }
        
        return { userId: decoded.userId, role: user.role, user };
    } catch (error) {
        throw new Error('Invalid token or insufficient permissions');
    }
}

exports.handler = async (event) => {
    try {
        console.log('🔍 Admin customers request - Method:', event.httpMethod);
        
        // Verify admin authentication
        const authHeader = event.headers.authorization || event.headers.Authorization;
        console.log('Auth header present:', !!authHeader);
        
        const decoded = await verifyAdminToken(authHeader);
        console.log('✅ Admin verified:', decoded.userId);
        
        console.log('Connecting to database...');
        await connectToDatabase();
        console.log('✅ Database connected');
        
        if (event.httpMethod === 'GET') {
            return await handleGetCustomers(event);
        } else if (event.httpMethod === 'PUT') {
            return await handleUpdateCustomer(event);
        } else {
            return json({ success: false, message: 'Method Not Allowed' }, 405);
        }
        
    } catch (error) {
        console.error('💥 Admin customers error:', error);
        console.error('Error stack:', error.stack);
        return json({
            success: false,
            message: error.message || 'Failed to process request',
            error: error.message,
            stack: error.stack
        }, error.message === 'No token provided' || error.message.includes('Invalid token') ? 401 : 500);
    }
};

async function handleGetCustomers(event) {
    try {
        console.log('📋 Fetching customers...');
        
        const params = new URLSearchParams(event.queryStringParameters || '');
        
        // Parse query parameters
        const page = parseInt(params.get('page')) || 1;
        const limit = Math.min(parseInt(params.get('limit')) || 20, 100);
        const customerId = params.get('customerId');
        
        // If requesting specific customer details
        if (customerId) {
            return await handleGetCustomerDetails(customerId);
        }
        
        // Build filter query (exclude admin users)
        const filter = { role: { $ne: 'admin' } };
        
        // Get total count for pagination
        const totalCustomers = await User.countDocuments(filter);
        console.log(`Found ${totalCustomers} customers`);
        
        // Get customers with pagination
        const customers = await User.find(filter)
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        
        console.log(`Returning ${customers.length} customers`);
        
        // Get order count for each customer (simplified)
        const customersWithStats = await Promise.all(customers.map(async (customer) => {
            try {
                const orderCount = await Order.countDocuments({ user: customer._id });
                return {
                    ...customer,
                    orderCount,
                    status: customer.isActive ? 'active' : 'inactive'
                };
            } catch (err) {
                console.error('Error getting order count for customer:', customer._id, err);
                return {
                    ...customer,
                    orderCount: 0,
                    status: customer.isActive ? 'active' : 'inactive'
                };
            }
        }));
        
        return json({
            success: true,
            data: {
                customers: customersWithStats,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCustomers / limit),
                    totalCustomers,
                    limit,
                    hasNext: page < Math.ceil(totalCustomers / limit),
                    hasPrev: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('💥 Error fetching customers:', error);
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