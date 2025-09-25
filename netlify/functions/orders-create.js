const { json, parseBody, requireAuth } = require('./_utils');
const Order = require('../../models/Order');
const Product = require('../../models/Product');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        const user = await requireAuth(event);
        const { items, customerType, hostel, deliveryAddress, contactInfo, payment, deliveryDate, deliveryTime, notes } = parseBody(event);

        if (!Array.isArray(items) || items.length === 0) {
            return json({ success: false, message: 'At least one item is required' }, 400);
        }

        // Fetch products for accurate pricing
        const productIds = items.map(i => i.product);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const orderItems = items.map(i => {
            const prod = productMap.get(i.product);
            const price = prod ? prod.price : i.price;
            const quantity = Number(i.quantity);
            return {
                product: i.product,
                name: prod ? prod.name : i.name,
                quantity,
                price,
                total: price * quantity
            };
        });

        const subtotal = orderItems.reduce((s, it) => s + it.total, 0);
        const deliveryFee = subtotal >= 100 ? 0 : 30;
        const total = subtotal + deliveryFee;

        const order = new Order({
            user: user._id,
            items: orderItems,
            customerType,
            hostel: customerType === 'college' ? hostel : undefined,
            deliveryAddress,
            contactInfo,
            pricing: { subtotal, deliveryFee, total },
            payment: { method: payment.method, status: 'pending' },
            deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
            deliveryTime: deliveryTime || 'morning',
            notes
        });
        await order.save();

        return json({ success: true, message: 'Order created successfully', data: { order } }, 201);
    } catch (e) {
        return json({ success: false, message: 'Server error while creating order' }, 500);
    }
};


