const { json } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔍 Validating admin session...');
        await connectToDatabase();
        
        // Get token from Authorization header
        const authHeader = event.headers.authorization || event.headers.Authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ success: false, message: 'No token provided' }, 401);
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            console.log('❌ Invalid JWT token:', error.message);
            return json({ success: false, message: 'Invalid token' }, 401);
        }
        
        // Find user and verify admin role
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            console.log('❌ User not found for token');
            return json({ success: false, message: 'User not found' }, 401);
        }
        
        if (user.role !== 'admin') {
            console.log('❌ User is not admin:', user.role);
            return json({ success: false, message: 'Access denied - Admin role required' }, 403);
        }
        
        if (!user.isActive) {
            console.log('❌ Admin account is inactive');
            return json({ success: false, message: 'Account is inactive' }, 401);
        }
        
        console.log('✅ Admin session validated for:', user.email);
        
        return json({
            success: true,
            message: 'Session valid',
            admin: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: [
                    'view_dashboard',
                    'manage_orders', 
                    'manage_products',
                    'manage_customers',
                    'view_analytics',
                    'manage_settings'
                ]
            }
        });
        
    } catch (error) {
        console.error('💥 Admin validation error:', error);
        return json({
            success: false,
            message: 'Server error during validation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};