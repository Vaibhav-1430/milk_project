const { json } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

exports.handler = async (event) => {
    // Allow both GET and POST for easy access
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🚀 Setting up admin credentials in MongoDB Atlas...');
        await connectToDatabase();
        console.log('✅ Connected to MongoDB Atlas');
        
        // Check if admin already exists
        let adminUser = await User.findOne({ email: 'admin@garamdoodh.com' });
        
        if (adminUser) {
            console.log('👤 Admin user already exists, updating...');
            
            // Update existing user to ensure admin role and active status
            adminUser.role = 'admin';
            adminUser.isActive = true;
            adminUser.name = 'Admin User';
            
            // Update password to admin123 (will be hashed automatically)
            adminUser.password = 'admin123';
            
            await adminUser.save();
            console.log('✅ Existing admin user updated');
        } else {
            console.log('👤 Creating new admin user...');
            
            // Create new admin user
            adminUser = new User({
                name: 'Admin User',
                email: 'admin@garamdoodh.com',
                phone: '9999999999',
                password: 'admin123', // Will be hashed automatically by User model
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
            console.log('✅ New admin user created');
        }
        
        // Verify the password works
        const passwordTest = await adminUser.comparePassword('admin123');
        console.log('🔐 Password verification:', passwordTest);
        
        // Test login immediately
        console.log('🧪 Testing login...');
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        
        return json({
            success: true,
            message: 'Admin credentials successfully added to MongoDB Atlas!',
            data: {
                status: adminUser ? 'updated' : 'created',
                admin: {
                    id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: adminUser.role,
                    isActive: adminUser.isActive,
                    createdAt: adminUser.createdAt
                },
                credentials: {
                    email: 'admin@garamdoodh.com',
                    password: 'admin123'
                },
                verification: {
                    passwordWorks: passwordTest,
                    tokenGenerated: !!token,
                    databaseConnection: 'success'
                },
                nextSteps: [
                    'Go to https://garamdoodh.netlify.app/login.html',
                    'Use email: admin@garamdoodh.com',
                    'Use password: admin123',
                    'You will be redirected to the admin portal'
                ]
            }
        });
        
    } catch (error) {
        console.error('💥 Setup admin error:', error);
        return json({
            success: false,
            message: 'Failed to setup admin credentials',
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            troubleshooting: [
                'Check if MongoDB Atlas connection string is correct',
                'Verify database permissions',
                'Ensure User model is properly defined',
                'Check if bcrypt is working for password hashing'
            ]
        }, 500);
    }
};