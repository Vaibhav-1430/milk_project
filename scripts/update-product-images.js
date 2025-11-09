require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Image URLs for products
const productImages = {
    // Milk products
    'Fresh Boiled Milk': {
        '100 ml': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
        '250 ml': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500',
        '500 ml': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
        '1 L': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500',
        '2 L': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
        '5 L': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500'
    },
    // Egg products
    'Boiled Eggs': 'https://images.unsplash.com/photo-1582722872445-44dc1f3e3b84?w=500',
    'Normal Eggs': 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=500'
};

async function updateProductImages() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products`);

        let updatedCount = 0;

        for (const product of products) {
            let newImage = null;

            // Check if product has custom image mapping
            if (productImages[product.name]) {
                if (typeof productImages[product.name] === 'string') {
                    // Direct image URL
                    newImage = productImages[product.name];
                } else if (productImages[product.name][product.quantity]) {
                    // Image URL based on quantity
                    newImage = productImages[product.name][product.quantity];
                }
            }

            if (newImage && product.image !== newImage) {
                product.image = newImage;
                await product.save();
                console.log(`✅ Updated: ${product.name} (${product.quantity}) -> ${newImage}`);
                updatedCount++;
            } else {
                console.log(`ℹ️  Skipped: ${product.name} (${product.quantity}) - No change needed`);
            }
        }

        console.log(`\n✅ Updated ${updatedCount} product images`);
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error updating product images:', error);
        process.exit(1);
    }
}

// Instructions for manual image upload
console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  PRODUCT IMAGE UPDATE SCRIPT                   ║
╚════════════════════════════════════════════════════════════════╝

This script will update product images in your database.

📝 TO USE YOUR OWN IMAGES:
1. Upload your images to a hosting service (Imgur, Cloudinary, etc.)
2. Edit this file (scripts/update-product-images.js)
3. Replace the URLs in the 'productImages' object above
4. Run: node scripts/update-product-images.js

Example:
  'Boiled Eggs': 'https://your-image-host.com/boiled-eggs.jpg',
  'Normal Eggs': 'https://your-image-host.com/normal-eggs.jpg'

Press Ctrl+C to cancel, or wait 3 seconds to continue...
`);

setTimeout(() => {
    updateProductImages();
}, 3000);
