const { connectToDatabase } = require('../../db');
const Product = require('../../models/Product');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        await connectToDatabase();

        const params = new URLSearchParams(event.queryStringParameters || {});
        const category = params.get('category');
        const featured = params.get('featured');
        const available = params.get('available');
        const search = params.get('search');
        const page = parseInt(params.get('page') || '1');
        const limit = parseInt(params.get('limit') || '20');

        const filter = {};
        if (category) filter.category = category;
        if (featured !== null && featured !== undefined) filter.featured = featured === 'true';
        if (available !== null && available !== undefined) filter.isAvailable = available === 'true';
        if (search) filter.$text = { $search: search };

        const skip = (page - 1) * limit;
        const products = await Product.find(filter)
            .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Product.countDocuments(filter);

        return json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalProducts: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });
    } catch (e) {
        return json({ success: false, message: 'Server error while fetching products' }, 500);
    }
};

function json(body, statusCode = 200) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}


