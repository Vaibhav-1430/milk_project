const { json } = require('./_utils');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID === 'your-razorpay-key-id') {
        return json({ success: false, message: 'Payment service is not configured' }, 503);
    }
    return json({ success: true, data: { key: process.env.RAZORPAY_KEY_ID } });
};


