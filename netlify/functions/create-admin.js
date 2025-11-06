const { json } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔗 Connecting to database...');
        await connectToDatabase();
        console.log('✅ Database connected');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@garamdoodh.com' });
        
        if (existingAdmin) {
            console.log('👤 Admin user already exists');
            
            // Update existing user to admin role if not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin role');
            }
            
            return json({
                success: true,
                message: 'Admin user already exists',
                data: {
                    email: existingAdmin.email,
                    name: existingAdmin.name,
                    role: existingAdmin.role
                }
            });
        }

        // Create new admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@garamdoodh.com',
            phone: '9999999999',
            password: 'admin123', // This will be hashed automatically by the User model
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
        console.log('✅ Admin user created successfully');

        return json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                credentials: {
                    email: 'admin@garamdoodh.com',
                    password: 'admin123'
                }
            }
        });
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        return json({
            success: false,
            message: 'Failed to create admin user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};