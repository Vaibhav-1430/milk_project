const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with optional filtering
// @access  Public
router.get('/', [
    query('category').optional().isIn(['milk', 'dairy']),
    query('featured').optional().isBoolean(),
    query('available').optional().isBoolean(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            category,
            featured,
            available,
            search,
            page = 1,
            limit = 20
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (category) filter.category = category;
        if (featured !== undefined) filter.featured = featured === 'true';
        if (available !== undefined) filter.isAvailable = available === 'true';
        
        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const products = await Product.find(filter)
            .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalProducts: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching products'
        });
    }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ 
            featured: true, 
            isAvailable: true 
        }).sort({ createdAt: -1 }).limit(6);

        res.json({
            success: true,
            data: { products }
        });

    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching featured products'
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: { product }
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching product'
        });
    }
});

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private (Admin)
router.post('/', adminAuth, [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
    body('quantity').isIn(['100 ml', '250 ml', '500 ml', '1 L', '2 L', '5 L']).withMessage('Invalid quantity'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('image').isURL().withMessage('Image must be a valid URL'),
    body('category').optional().isIn(['milk', 'dairy']),
    body('stock').optional().isInt({ min: 0 }),
    body('featured').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const product = new Product(req.body);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product }
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating product'
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private (Admin)
router.put('/:id', adminAuth, [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ min: 10, max: 500 }),
    body('quantity').optional().isIn(['100 ml', '250 ml', '500 ml', '1 L', '2 L', '5 L']),
    body('price').optional().isFloat({ min: 0 }),
    body('image').optional().isURL(),
    body('category').optional().isIn(['milk', 'dairy']),
    body('stock').optional().isInt({ min: 0 }),
    body('featured').optional().isBoolean(),
    body('isAvailable').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product }
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating product'
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting product'
        });
    }
});

module.exports = router;
