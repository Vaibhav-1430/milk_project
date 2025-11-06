#!/usr/bin/env node

/**
 * Create Admin User Script
 * Run this script to add admin credentials to MongoDB Atlas
 * 
 * Usage: node scripts/create-admin-user.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    phone: {
        type: String,
        match: /^[6-9]\d{9}$/
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    customerType: {
        type: String,
        enum: ['college', 'outsider'],
        default: 'outsider'
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        console.log('🚀 Starting admin user creation...');
        console.log('📡 Connecting to MongoDB Atlas...');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB Atlas successfully');
        
        // Check if admin user already exists
        console.log('🔍 Checking if admin user already exists...');
        let adminUser = await User.findOne({ email: 'admin@garamdoodh.com' });
        
        if (adminUser) {
            console.log('👤 Admin user already exists, updating...');
            
            // Update existing user
            adminUser.role = 'admin';
            adminUser.isActive = true;
            adminUser.name = 'Admin User';
            adminUser.password = 'admin123'; // Will be hashed by pre-save hook
            
            await adminUser.save();
            console.log('✅ Existing admin user updated successfully');
        } else {
            console.log('👤 Creating new admin user...');
            
            // Create new admin user
            adminUser = new User({
                name: 'Admin User',
                email: 'admin@garamdoodh.com',
                phone: '9999999999',
                password: 'admin123', // Will be hashed by pre-save hook
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
            console.log('✅ New admin user created successfully');
        }
        
        // Verify password works
        console.log('🔐 Testing password...');
        const passwordTest = await adminUser.comparePassword('admin123');
        
        if (passwordTest) {
            console.log('✅ Password verification successful');
        } else {
            console.log('❌ Password verification failed');
        }
        
        // Display results
        console.log('\n🎉 Admin user setup completed!');
        console.log('📋 Admin User Details:');
        console.log(`   ID: ${adminUser._id}`);
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Active: ${adminUser.isActive}`);
        console.log(`   Created: ${adminUser.createdAt}`);
        
        console.log('\n🔑 Login Credentials:');
        console.log('   Email: admin@garamdoodh.com');
        console.log('   Password: admin123');
        
        console.log('\n🌐 Next Steps:');
        console.log('   1. Go to: https://garamdoodh.netlify.app/login.html');
        console.log('   2. Use the credentials above to login');
        console.log('   3. You will be redirected to the admin portal');
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n💥 Error creating admin user:', error.message);
        
        if (error.code === 11000) {
            console.error('   This usually means the email already exists in the database');
        }
        
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check your MONGODB_URI in .env file');
        console.error('   2. Ensure MongoDB Atlas allows connections from your IP');
        console.error('   3. Verify database user has write permissions');
        console.error('   4. Check if the database and collection exist');
        
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createAdminUser();
}

module.exports = { createAdminUser };