const { json, parseBody, requireAuth } = require('./_utils');
const Order = require('../../models/Order');

exports.handler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        const user = await requireAuth(event);
        const id = event.path.split('/').pop();
        const { reason = '' } = parseBody(event);
        const order = await Order.findOne({ _id: id, user: user._id, status: { $in: ['pending', 'confirmed', 'preparing'] } });
        if (!order) {
            return json({ success: false, message: 'Order not found or cannot be cancelled' }, 404);
        }
        order.status = 'cancelled';
        order.cancellationReason = reason;
        order.cancelledAt = new Date();
        await order.save();
        return json({ success: true, message: 'Order cancelled successfully', data: { order } });
    } catch (e) {
        return json({ success: false, message: 'Server error while cancelling order' }, 500);
    }
};


