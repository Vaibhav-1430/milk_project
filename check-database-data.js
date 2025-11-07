#!/usr/bin/env node

/**
 * Check Database Data
 * This script checks what data exists in the database
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
require('dotenv').config();

async function checkDatabaseData() {
    console.log('🔍 Checking Database Data...\n');

    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB Atlas');

        // Check Users
        console.log('\n👥 USERS:');
        const users = await User.find().select('name email role customerType createdAt');
        console.log(`Total users: ${users.length}`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.customerType || 'N/A'} - ${user.createdAt.toLocaleDateString()}`);
        });

        // Check Products
        console.log('\n📦 PRODUCTS:');
        const products = await Product.find().select('name quantity price isAvailable stock');
        console.log(`Total products: ${products.length}`);
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} (${product.quantity}) - ₹${product.price} - Available: ${product.isAvailable} - Stock: ${product.stock}`);
        });

        // Check Orders
        console.log('\n📋 ORDERS:');
        const orders = await Order.find()
            .populate('user', 'name email')
            .select('orderNumber user items pricing status createdAt deliveryDate')
            .sort({ createdAt: -1 });
        console.log(`Total orders: ${orders.length}`);

        if (orders.length > 0) {
            orders.forEach((order, index) => {
                console.log(`${index + 1}. ${order.orderNumber} - ${order.user?.name || 'Unknown'} - ₹${order.pricing?.total || 0} - ${order.status} - ${order.createdAt.toLocaleDateString()}`);
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        console.log(`   - ${item.name} x${item.quantity} @ ₹${item.price}`);
                    });
                }
            });
        } else {
            console.log('No orders found in database');
        }

        // Check recent activity
        console.log('\n📅 RECENT ACTIVITY (Last 7 days):');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        const recentOrders = await Order.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        console.log(`New users in last 7 days: ${recentUsers}`);
        console.log(`New orders in last 7 days: ${recentOrders}`);

        // Check today's activity
        console.log('\n📅 TODAY\'S ACTIVITY:');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayUsers = await User.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        console.log(`New users today: ${todayUsers}`);
        console.log(`New orders today: ${todayOrders}`);

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Database error:', error.message);
        process.exit(1);
    }
}

// Run the check
if (require.main === module) {
    checkDatabaseData().catch(console.error);
}

module.exports = { checkDatabaseData };