const { json, parseBody, requireAuth } = require('./_utils');
const crypto = require('crypto');
const Order = require('../../models/Order');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        const user = await requireAuth(event);
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parseBody(event);
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return json({ success: false, message: 'Validation failed' }, 400);
        }
        const order = await Order.findOne({ _id: orderId, user: user._id, 'payment.razorpayOrderId': razorpay_order_id });
        if (!order) {
            return json({ success: false, message: 'Order not found' }, 404);
        }
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
        if (expectedSignature !== razorpay_signature) {
            return json({ success: false, message: 'Invalid payment signature' }, 400);
        }
        order.payment.status = 'paid';
        order.payment.razorpayPaymentId = razorpay_payment_id;
        order.payment.razorpaySignature = razorpay_signature;
        order.status = 'confirmed';
        await order.save();
        return json({ success: true, message: 'Payment verified successfully', data: { order, paymentId: razorpay_payment_id } });
    } catch (e) {
        return json({ success: false, message: 'Server error while verifying payment' }, 500);
    }
};


