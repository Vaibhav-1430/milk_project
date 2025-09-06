const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const products = [
    {
        name: 'Fresh Boiled Milk',
        description: 'Pure and fresh boiled milk delivered to your doorstep. Boiled under strict hygienic standards to eliminate all bacteria while retaining nutrients.',
        quantity: '100 ml',
        price: 17,
        image: 'images/milk-100ml.svg',
        category: 'milk',
        stock: 100,
        featured: true,
        nutritionalInfo: {
            calories: 60,
            protein: 3.2,
            fat: 3.2,
            carbohydrates: 4.7
        }
    },
    {
        name: 'Fresh Boiled Milk',
        description: 'Pure and fresh boiled milk delivered to your doorstep. Boiled under strict hygienic standards to eliminate all bacteria while retaining nutrients.',
        quantity: '250 ml',
        price: 32,
        image: 'images/milk-250ml.svg',
        category: 'milk',
        stock: 100,
        featured: true,
        nutritionalInfo: {
            calories: 150,
            protein: 8.0,
            fat: 8.0,
            carbohydrates: 11.8
        }
    },
    {
        name: 'Fresh Boiled Milk',
        description: 'Pure and fresh boiled milk delivered to your doorstep. Boiled under strict hygienic standards to eliminate all bacteria while retaining nutrients.',
        quantity: '500 ml',
        price: 52,
        image: 'images/milk-500ml.svg',
        category: 'milk',
        stock: 100,
        featured: true,
        nutritionalInfo: {
            calories: 300,
            protein: 16.0,
            fat: 16.0,
            carbohydrates: 23.5
        }
    },
    {
        name: 'Fresh Boiled Milk',
        description: 'Pure and fresh boiled milk delivered to your doorstep. Boiled under strict hygienic standards to eliminate all bacteria while retaining nutrients.',
        quantity: '1 L',
        price: 92,
        image: 'images/milk-1l.svg',
        category: 'milk',
        stock: 100,
        featured: true,
        nutritionalInfo: {
            calories: 600,
            protein: 32.0,
            fat: 32.0,
            carbohydrates: 47.0
        }
    },
    {
        name: 'Fresh Boiled Milk',
        description: 'Pure and fresh boiled milk delivered to your doorstep. Boiled under strict hygienic standards to eliminate all bacteria while retaining nutrients.',
        quantity: '2 L',
        price: 172,
        image: 'images/milk-2l.svg',
        category: 'milk',
        stock: 100,
        featured: false,
        nutritionalInfo: {
            calories: 1200,
            protein: 64.0,
            fat: 64.0,
            carbohydrates: 94.0
        }
    },
    {
        name: 'Fresh Boiled Milk',
        description: 'Pure and fresh boiled milk delivered to your doorstep. Boiled under strict hygienic standards to eliminate all bacteria while retaining nutrients.',
        quantity: '5 L',
        price: 402,
        image: 'images/milk-5l.svg',
        category: 'milk',
        stock: 50,
        featured: false,
        nutritionalInfo: {
            calories: 3000,
            protein: 160.0,
            fat: 160.0,
            carbohydrates: 235.0
        }
    }
];

const seedProducts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/garamdoodh');
        console.log('✅ Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing products');

        // Insert new products
        await Product.insertMany(products);
        console.log('✅ Products seeded successfully');

        // Display seeded products
        const seededProducts = await Product.find();
        console.log(`📦 Seeded ${seededProducts.length} products:`);
        seededProducts.forEach(product => {
            console.log(`   - ${product.name} (${product.quantity}) - ₹${product.price}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedProducts();
}

module.exports = seedProducts;
