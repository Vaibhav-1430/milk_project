const { json } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔍 Debug: Checking admin user status...');
        await connectToDatabase();
        console.log('✅ Database connected');
        
        // Check if admin user exists
        const adminUser = await User.findOne({ email: 'admin@garamdoodh.com' });
        
        if (!adminUser) {
            console.log('❌ Admin user not found');
            return json({
                success: false,
                message: 'Admin user does not exist',
                debug: {
                    adminExists: false,
                    email: 'admin@garamdoodh.com',
                    suggestion: 'Run the create-admin function first'
                }
            });
        }
        
        console.log('✅ Admin user found');
        
        // Test password
        const passwordTest = await adminUser.comparePassword('admin123');
        
        return json({
            success: true,
            message: 'Admin user debug info',
            debug: {
                adminExists: true,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                isActive: adminUser.isActive,
                passwordMatches: passwordTest,
                createdAt: adminUser.createdAt,
                lastLogin: adminUser.lastLogin
            }
        });
        
    } catch (error) {
        console.error('💥 Debug error:', error);
        return json({
            success: false,
            message: 'Debug failed',
            error: error.message
        }, 500);
    }
};