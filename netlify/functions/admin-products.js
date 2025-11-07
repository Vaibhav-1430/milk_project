const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const Product = require('../../models/Product');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Verify admin token
async function verifyAdminToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user exists and is admin
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== 'admin') {
            throw new Error('Access denied - Admin role required');
        }
        
        return { userId: decoded.userId, role: user.role, user };
    } catch (error) {
        throw new Error('Invalid token or insufficient permissions');
    }
}

exports.handler = async (event) => {
    try {
        // Verify admin authentication
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const decoded = await verifyAdminToken(authHeader);
        
        console.log('🔍 Admin products request from:', decoded.userId);
        await connectToDatabase();
        
        if (event.httpMethod === 'GET') {
            return await handleGetProducts(event);
        } else if (event.httpMethod === 'POST') {
            return await handleCreateProduct(event);
        } else if (event.httpMethod === 'PUT') {
            return await handleUpdateProduct(event);
        } else if (event.httpMethod === 'DELETE') {
            return await handleDeleteProduct(event);
        } else {
            return json({ success: false, message: 'Method Not Allowed' }, 405);
        }
        
    } catch (error) {
        console.error('💥 Admin products error:', error);
        return json({
            success: false,
            message: error.message === 'No token provided' || error.message === 'Invalid token' 
                ? 'Unauthorized' 
                : 'Failed to process request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500);
    }
};

async function handleGetProducts(event) {
    const params = new URLSearchParams(event.queryStringParameters || '');
    
    // Parse query parameters
    const page = parseInt(params.get('page')) || 1;
    const limit = Math.min(parseInt(params.get('limit')) || 20, 100);
    const category = params.get('category');
    const isAvailable = params.get('isAvailable');
    const featured = params.get('featured');
    const search = params.get('search');
    const sortBy = params.get('sortBy') || 'createdAt';
    const sortOrder = params.get('sortOrder') === 'asc' ? 1 : -1;
    const lowStock = params.get('lowStock') === 'true';
    
    // Build filter query
    const filter = {};
    
    if (category) filter.category = category;
    if (isAvailable !== null && isAvailable !== undefined) {
        filter.isAvailable = isAvailable === 'true';
    }
    if (featured !== null && featured !== undefined) {
        filter.featured = featured === 'true';
    }
    if (lowStock) {
        filter.stock = { $lte: 10 };
    }
    
    // Search filter
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
            { name: searchRegex },
            { description: searchRegex }
        ];
    }
    
    try {
        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        
        // Get products with pagination
        const products = await Product.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        
        // Calculate stock status for each product
        const productsWithStatus = products.map(product => ({
            ...product,
            stockStatus: product.stock <= 0 ? 'out_of_stock' : 
                        product.stock <= 10 ? 'low_stock' : 'in_stock',
            stockLevel: product.stock <= 0 ? 'critical' :
                       product.stock <= 10 ? 'warning' : 'good'
        }));
        
        return json({
            success: true,
            data: {
                products: productsWithStatus,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit,
                    hasNext: page < Math.ceil(totalProducts / limit),
                    hasPrev: page > 1
                },
                filters: {
                    category,
                    isAvailable,
                    featured,
                    search,
                    lowStock
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

async function handleCreateProduct(event) {
    const productData = parseBody(event);
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'quantity', 'price', 'image'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
        return json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
        }, 400);
    }
    
    try {
        // Create new product
        const product = new Product({
            name: productData.name,
            description: productData.description,
            quantity: productData.quantity,
            price: parseFloat(productData.price),
            image: productData.image,
            category: productData.category || 'milk',
            isAvailable: productData.isAvailable !== false,
            stock: parseInt(productData.stock) || 100,
            featured: productData.featured || false,
            nutritionalInfo: productData.nutritionalInfo || {}
        });
        
        await product.save();
        
        return json({
            success: true,
            message: 'Product created successfully',
            data: { product }
        });
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            return json({
                success: false,
                message: 'Validation error',
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            }, 400);
        }
        
        console.error('Error creating product:', error);
        throw error;
    }
}

async function handleUpdateProduct(event) {
    const pathParts = event.path.split('/');
    const productId = pathParts[pathParts.length - 1];
    
    if (!productId) {
        return json({ success: false, message: 'Product ID is required' }, 400);
    }
    
    const updates = parseBody(event);
    
    try {
        const product = await Product.findById(productId);
        
        if (!product) {
            return json({ success: false, message: 'Product not found' }, 404);
        }
        
        // Update allowed fields
        const allowedUpdates = [
            'name', 'description', 'quantity', 'price', 'image', 
            'category', 'isAvailable', 'stock', 'featured', 'nutritionalInfo'
        ];
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'price' || field === 'stock') {
                    product[field] = parseFloat(updates[field]);
                } else {
                    product[field] = updates[field];
                }
            }
        });
        
        await product.save();
        
        return json({
            success: true,
            message: 'Product updated successfully',
            data: { product }
        });
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            return json({
                success: false,
                message: 'Validation error',
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            }, 400);
        }
        
        console.error('Error updating product:', error);
        throw error;
    }
}

async function handleDeleteProduct(event) {
    const pathParts = event.path.split('/');
    const productId = pathParts[pathParts.length - 1];
    
    if (!productId) {
        return json({ success: false, message: 'Product ID is required' }, 400);
    }
    
    try {
        const product = await Product.findById(productId);
        
        if (!product) {
            return json({ success: false, message: 'Product not found' }, 404);
        }
        
        await Product.findByIdAndDelete(productId);
        
        return json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}