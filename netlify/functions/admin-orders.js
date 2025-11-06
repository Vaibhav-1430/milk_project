const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const Order = require('../../models/Order');
const User = require('../../models/User');
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
        
        console.log('🔍 Admin orders request from:', decoded.userId);
        await connectToDatabase();
        
        if (event.httpMethod === 'GET') {
            return await handleGetOrders(event);
        } else if (event.httpMethod === 'PUT') {
            return await handleUpdateOrder(event);
        } else if (event.httpMethod === 'POST') {
            return await handleBulkUpdate(event);
        } else {
            return json({ success: false, message: 'Method Not Allowed' }, 405);
        }
        
    } catch (error) {
        console.error('💥 Admin orders error:', error);
        return json({
            success: false,
            message: error.message === 'No token provided' || error.message === 'Invalid token' 
                ? 'Unauthorized' 
                : 'Failed to process request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500);
    }
};

async function handleGetOrders(event) {
    const params = new URLSearchParams(event.queryStringParameters || '');
    
    // Parse query parameters
    const page = parseInt(params.get('page')) || 1;
    const limit = Math.min(parseInt(params.get('limit')) || 20, 100);
    const status = params.get('status');
    const customerType = params.get('customerType');
    const paymentMethod = params.get('paymentMethod');
    const paymentStatus = params.get('paymentStatus');
    const search = params.get('search');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    const sortBy = params.get('sortBy') || 'createdAt';
    const sortOrder = params.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Build filter query
    const filter = {};
    
    if (status) filter.status = status;
    if (customerType) filter.customerType = customerType;
    if (paymentMethod) filter['payment.method'] = paymentMethod;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    
    // Date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Search filter
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
            { orderNumber: searchRegex },
            { 'contactInfo.name': searchRegex },
            { 'contactInfo.phone': searchRegex },
            { 'contactInfo.email': searchRegex }
        ];
    }
    
    try {
        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);
        
        // Get orders with pagination
        const orders = await Order.find(filter)
            .populate('user', 'name email phone customerType')
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        
        // Format orders for frontend
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            customer: {
                name: order.user?.name || order.contactInfo?.name || 'Guest',
                email: order.user?.email || order.contactInfo?.email || '',
                phone: order.user?.phone || order.contactInfo?.phone || '',
                type: order.customerType
            },
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            pricing: {
                subtotal: order.pricing.subtotal,
                deliveryFee: order.pricing.deliveryFee,
                total: order.pricing.total
            },
            payment: {
                method: order.payment.method,
                status: order.payment.status,
                razorpayOrderId: order.payment.razorpayOrderId,
                razorpayPaymentId: order.payment.razorpayPaymentId
            },
            delivery: {
                address: order.deliveryAddress,
                date: order.deliveryDate,
                time: order.deliveryTime,
                hostel: order.hostel
            },
            status: order.status,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            cancellationReason: order.cancellationReason
        }));
        
        return json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    limit,
                    hasNext: page < Math.ceil(totalOrders / limit),
                    hasPrev: page > 1
                },
                filters: {
                    status,
                    customerType,
                    paymentMethod,
                    paymentStatus,
                    search,
                    startDate,
                    endDate
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

async function handleUpdateOrder(event) {
    const pathParts = event.path.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    if (!orderId) {
        return json({ success: false, message: 'Order ID is required' }, 400);
    }
    
    const { status, notes, cancellationReason } = parseBody(event);
    
    try {
        const order = await Order.findById(orderId);
        
        if (!order) {
            return json({ success: false, message: 'Order not found' }, 404);
        }
        
        // Update order status
        if (status) {
            order.status = status;
            
            // Set delivered timestamp
            if (status === 'delivered' && !order.deliveredAt) {
                order.deliveredAt = new Date();
            }
            
            // Set cancelled timestamp and reason
            if (status === 'cancelled') {
                order.cancelledAt = new Date();
                if (cancellationReason) {
                    order.cancellationReason = cancellationReason;
                }
            }
        }
        
        // Update notes
        if (notes !== undefined) {
            order.notes = notes;
        }
        
        await order.save();
        
        // Populate user data for response
        await order.populate('user', 'name email phone');
        
        return json({
            success: true,
            message: 'Order updated successfully',
            data: {
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    notes: order.notes,
                    updatedAt: order.updatedAt,
                    deliveredAt: order.deliveredAt,
                    cancelledAt: order.cancelledAt,
                    cancellationReason: order.cancellationReason
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
}

async function handleBulkUpdate(event) {
    const { orderIds, updates } = parseBody(event);
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return json({ success: false, message: 'Order IDs array is required' }, 400);
    }
    
    if (!updates || typeof updates !== 'object') {
        return json({ success: false, message: 'Updates object is required' }, 400);
    }
    
    try {
        const updateData = {};
        
        if (updates.status) {
            updateData.status = updates.status;
            
            if (updates.status === 'delivered') {
                updateData.deliveredAt = new Date();
            }
            
            if (updates.status === 'cancelled') {
                updateData.cancelledAt = new Date();
                if (updates.cancellationReason) {
                    updateData.cancellationReason = updates.cancellationReason;
                }
            }
        }
        
        if (updates.notes !== undefined) {
            updateData.notes = updates.notes;
        }
        
        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: updateData }
        );
        
        return json({
            success: true,
            message: `${result.modifiedCount} orders updated successfully`,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            }
        });
        
    } catch (error) {
        console.error('Error bulk updating orders:', error);
        throw error;
    }
}