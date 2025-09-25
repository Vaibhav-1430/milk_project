const { json, parseBody, requireAuth } = require('./_utils');
const Razorpay = require('razorpay');
const Order = require('../../models/Order');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== 'your-razorpay-key-id') {
    razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        if (!razorpay) {
            return json({ success: false, message: 'Payment service is not configured. Please contact administrator.' }, 503);
        }
        const user = await requireAuth(event);
        const { amount, currency = 'INR', orderId } = parseBody(event);
        if (!amount || !orderId) {
            return json({ success: false, message: 'Validation failed' }, 400);
        }
        const order = await Order.findOne({ _id: orderId, user: user._id, 'payment.status': 'pending' });
        if (!order) {
            return json({ success: false, message: 'Order not found or already processed' }, 404);
        }
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency,
            receipt: order.orderNumber,
            notes: { orderId: order._id.toString(), userId: user._id.toString() }
        });
        order.payment.razorpayOrderId = razorpayOrder.id;
        await order.save();
        return json({ success: true, message: 'Payment order created successfully', data: { order: razorpayOrder, orderId: order._id } });
    } catch (e) {
        return json({ success: false, message: 'Server error while creating payment order' }, 500);
    }
};


