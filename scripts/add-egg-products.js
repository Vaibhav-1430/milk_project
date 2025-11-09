require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function addEggProducts() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Check if products already exist
        const existingBoiled = await Product.findOne({ name: 'Boiled Eggs' });
        const existingNormal = await Product.findOne({ name: 'Normal Eggs' });

        const products = [];

        if (!existingBoiled) {
            products.push({
                name: 'Boiled Eggs',
                description: 'Fresh boiled eggs, perfectly cooked and ready to eat',
                quantity: 'Per Piece',
                price: 10,
                image: 'https://images.unsplash.com/photo-1582722872445-44dc1f3e3b84?w=500',
                category: 'eggs',
                isAvailable: true,
                stock: 100,
                featured: false,
                nutritionalInfo: {
                    protein: 6,
                    calories: 78,
                    fat: 5,
                    carbohydrates: 1
                }
            });
        }

        if (!existingNormal) {
            products.push({
                name: 'Normal Eggs',
                description: 'Fresh farm eggs, perfect for cooking',
                quantity: 'Per Piece',
                price: 8,
                image: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=500',
                category: 'eggs',
                isAvailable: true,
                stock: 150,
                featured: false,
                nutritionalInfo: {
                    protein: 6,
                    calories: 72,
                    fat: 5,
                    carbohydrates: 1
                }
            });
        }

        if (products.length === 0) {
            console.log('ℹ️ Egg products already exist in database');
        } else {
            const result = await Product.insertMany(products);
            console.log(`✅ Added ${result.length} egg products successfully!`);
            result.forEach(product => {
                console.log(`   - ${product.name}: ₹${product.price} per piece`);
            });
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error adding egg products:', error);
        process.exit(1);
    }
}

addEggProducts();
