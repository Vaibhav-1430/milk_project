require('dotenv').config();
const mongoose = require('mongoose');

async function diagnoseDatabaseIssues() {
    try {
        console.log('🔍 Starting database diagnosis...\n');
        
        // Connect to database
        console.log('📡 Connecting to MongoDB...');
        console.log('URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        // Get database name
        const dbName = mongoose.connection.db.databaseName;
        console.log('📊 Database Name:', dbName);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections in database:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        // Check each collection
        console.log('\n📋 Collection Details:\n');
        
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}:`);
            console.log(`  Count: ${count}`);
            
            if (count > 0) {
                const sample = await mongoose.connection.db.collection(col.name).findOne();
                console.log(`  Sample document keys:`, Object.keys(sample));
                
                // Show first document for orders
                if (col.name === 'orders') {
                    console.log(`  First order:`, JSON.stringify(sample, null, 2));
                }
                
                // Show first document for users
                if (col.name === 'users') {
                    const adminUser = await mongoose.connection.db.collection(col.name).findOne({ role: 'admin' });
                    console.log(`  Admin user exists:`, !!adminUser);
                    if (adminUser) {
                        console.log(`  Admin email:`, adminUser.email);
                        console.log(`  Admin name:`, adminUser.name);
                    }
                }
                
                // Show first document for products
                if (col.name === 'products') {
                    console.log(`  First product:`, JSON.stringify(sample, null, 2));
                }
            }
            console.log('');
        }
        
        // Check for admin user specifically
        console.log('🔐 Admin User Check:');
        const User = require('./models/User');
        const adminUsers = await User.find({ role: 'admin' });
        console.log(`  Total admin users: ${adminUsers.length}`);
        adminUsers.forEach(admin => {
            console.log(`  - ${admin.email} (${admin.name})`);
        });
        
        // Check orders
        console.log('\n📦 Orders Check:');
        const Order = require('./models/Order');
        const totalOrders = await Order.countDocuments();
        console.log(`  Total orders: ${totalOrders}`);
        
        if (totalOrders > 0) {
            const ordersByStatus = await Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            console.log('  Orders by status:');
            ordersByStatus.forEach(status => {
                console.log(`    ${status._id}: ${status.count}`);
            });
            
            const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(3).lean();
            console.log('\n  Recent orders:');
            recentOrders.forEach(order => {
                console.log(`    - ${order.orderNumber || order._id}: ${order.status} (${order.pricing?.total || 0})`);
            });
        }
        
        // Check products
        console.log('\n📦 Products Check:');
        const Product = require('./models/Product');
        const totalProducts = await Product.countDocuments();
        console.log(`  Total products: ${totalProducts}`);
        
        if (totalProducts > 0) {
            const products = await Product.find().limit(5).lean();
            console.log('  Sample products:');
            products.forEach(product => {
                console.log(`    - ${product.name}: ₹${product.price} (Stock: ${product.stock})`);
            });
        }
        
        console.log('\n✅ Diagnosis complete!');
        
    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

diagnoseDatabaseIssues();
