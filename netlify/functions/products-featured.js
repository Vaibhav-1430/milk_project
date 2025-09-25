const { connectToDatabase } = require('../../db');
const Product = require('../../models/Product');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        await connectToDatabase();

        const products = await Product.find({ featured: true, isAvailable: true })
            .sort({ createdAt: -1 })
            .limit(6);

        return json({ success: true, data: { products } });
    } catch (e) {
        return json({ success: false, message: 'Server error while fetching featured products' }, 500);
    }
};

function json(body, statusCode = 200) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}


