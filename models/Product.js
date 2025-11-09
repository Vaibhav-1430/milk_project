const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    quantity: {
        type: String,
        required: [true, 'Product quantity is required'],
        enum: ['100 ml', '250 ml', '500 ml', '1 L', '2 L', '5 L', 'Per Piece', '6 Pieces', '12 Pieces']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    image: {
        type: String,
        required: [true, 'Product image is required']
    },
    category: {
        type: String,
        default: 'milk',
        enum: ['milk', 'dairy', 'eggs']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: 100,
        min: [0, 'Stock cannot be negative']
    },
    featured: {
        type: Boolean,
        default: false
    },
    nutritionalInfo: {
        calories: Number,
        protein: Number,
        fat: Number,
        carbohydrates: Number
    }
}, {
    timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);
