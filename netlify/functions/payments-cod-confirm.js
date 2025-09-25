const { json, parseBody, requireAuth } = require('./_utils');
const Order = require('../../models/Order');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        const user = await requireAuth(event);
        const { orderId } = parseBody(event);
        if (!orderId) {
            return json({ success: false, message: 'Validation failed' }, 400);
        }
        const order = await Order.findOne({ _id: orderId, user: user._id, 'payment.method': 'cod', 'payment.status': 'pending' });
        if (!order) {
            return json({ success: false, message: 'COD order not found or already processed' }, 404);
        }
        order.payment.status = 'paid';
        order.status = 'confirmed';
        await order.save();
        return json({ success: true, message: 'COD order confirmed successfully', data: { order } });
    } catch (e) {
        return json({ success: false, message: 'Server error while confirming COD order' }, 500);
    }
};


