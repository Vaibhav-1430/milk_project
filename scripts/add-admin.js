#!/usr/bin/env node

/**
 * Add Admin User to MongoDB Atlas
 * Simple script to create admin credentials
 * 
 * Usage: node scripts/add-admin.js
 */

require('dotenv').config();
const { connectToDatabase } = require('../db');
const User = require('../models/User');

async function addAdminUser() {
    console.log('🚀 Adding admin user to MongoDB Atlas...');
    
    try {
        // Connect to database
        console.log('📡 Connecting to MongoDB Atlas...');
        await connectToDatabase();
        console.log('✅ Connected successfully');
        
        // Remove existing admin user if exists
        console.log('🗑️ Removing any existing admin user...');
        await User.deleteOne({ email: 'admin@garamdoodh.com' });
        
        // Create new admin user
        console.log('👤 Creating admin user...');
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@garamdoodh.com',
            phone: '9999999999',
            password: 'admin123', // Will be hashed automatically
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
        
        // Test password
        console.log('🔐 Testing password...');
        const passwordTest = await adminUser.comparePassword('admin123');
        
        if (passwordTest) {
            console.log('✅ Password test passed');
        } else {
            console.log('❌ Password test failed');
        }
        
        // Display success message
        console.log('\n🎉 SUCCESS! Admin credentials added to MongoDB Atlas');
        console.log('\n📋 Admin Details:');
        console.log(`   ID: ${adminUser._id}`);
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Active: ${adminUser.isActive}`);
        
        console.log('\n🔑 Login Credentials:');
        console.log('   📧 Email: admin@garamdoodh.com');
        console.log('   🔒 Password: admin123');
        
        console.log('\n🌐 Login URL:');
        console.log('   https://garamdoodh.netlify.app/login.html');
        
        console.log('\n✨ You can now login to your admin portal!');
        
    } catch (error) {
        console.error('\n💥 Error:', error.message);
        
        if (error.message.includes('MONGODB_URI')) {
            console.error('\n🔧 Fix: Add MONGODB_URI to your .env file');
        } else if (error.code === 11000) {
            console.error('\n🔧 Fix: Admin user already exists, try deleting first');
        } else {
            console.error('\n🔧 Troubleshooting:');
            console.error('   1. Check MongoDB Atlas connection');
            console.error('   2. Verify .env file has MONGODB_URI');
            console.error('   3. Ensure database permissions are correct');
        }
        
        process.exit(1);
    }
    
    process.exit(0);
}

// Run the script
addAdminUser();