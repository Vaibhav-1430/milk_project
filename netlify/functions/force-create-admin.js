const { json } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔍 Force creating admin user...');
        await connectToDatabase();
        console.log('✅ Database connected');
        
        // Delete existing admin user if exists
        await User.deleteOne({ email: 'admin@garamdoodh.com' });
        console.log('🗑️ Removed any existing admin user');
        
        // Create fresh admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@garamdoodh.com',
            phone: '9999999999',
            password: 'admin123', // This will be hashed automatically
            role: 'admin',
            customerType: 'outsider',
            address: {
                street: 'Admin Office',
                city: 'Admin City',
                state: 'Admin State',
                pincode: '123456'
            },
            isActive: true
        });
        
        await adminUser.save();
        console.log('✅ Fresh admin user created');
        
        // Test the password immediately
        const passwordTest = await adminUser.comparePassword('admin123');
        console.log('🔐 Password test result:', passwordTest);
        
        return json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                isActive: adminUser.isActive,
                passwordTest: passwordTest,
                instructions: 'You can now login with admin@garamdoodh.com / admin123'
            }
        });
        
    } catch (error) {
        console.error('💥 Force create admin error:', error);
        return json({
            success: false,
            message: 'Failed to create admin user',
            error: error.message
        }, 500);
    }
};