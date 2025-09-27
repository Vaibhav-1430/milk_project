const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

exports.handler = async (event) => {
    try {
        await connectToDatabase();
        
        if (event.httpMethod === 'GET') {
            // Get all users (for debugging)
            const users = await User.find({}).select('-password');
            return json({
                success: true,
                message: 'Users retrieved successfully',
                data: {
                    count: users.length,
                    users: users
                }
            });
        }
        
        if (event.httpMethod === 'POST') {
            // Check specific user
            const { email } = parseBody(event);
            
            if (!email) {
                return json({ success: false, message: 'Email is required' }, 400);
            }
            
            const user = await User.findOne({ email }).select('-password');
            
            if (user) {
                return json({
                    success: true,
                    message: 'User found',
                    data: {
                        user: user,
                        exists: true
                    }
                });
            } else {
                return json({
                    success: true,
                    message: 'User not found',
                    data: {
                        exists: false
                    }
                });
            }
        }
        
        return json({ success: false, message: 'Method not allowed' }, 405);
    } catch (error) {
        console.error('Debug user error:', error);
        return json({
            success: false,
            message: 'Server error',
            error: error.message
        }, 500);
    }
};
