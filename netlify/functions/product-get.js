const { connectToDatabase } = require('../../db');
const Product = require('../../models/Product');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    try {
        await connectToDatabase();
        const id = event.path.split('/').pop();
        const product = await Product.findById(id);
        if (!product) {
            return json({ success: false, message: 'Product not found' }, 404);
        }
        return json({ success: true, data: { product } });
    } catch (e) {
        return json({ success: false, message: 'Server error while fetching product' }, 500);
    }
};

function json(body, statusCode = 200) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}


