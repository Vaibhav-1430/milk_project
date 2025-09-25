const { MongoClient } = require("mongodb");
const { sendNewOrderEmail } = require('../../utils/mailer');

const uri = process.env.MONGODB_URI;
let client = null;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
  }
  return client.db("garamdoodh"); // you can replace with your DB name
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return response(405, { success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { items, customerType, hostel, address, contactInfo, payment, notes } = body;

    if (!Array.isArray(items) || items.length === 0)
      return response(400, { success: false, message: 'At least one item is required' });
    if (!['college', 'outsider'].includes(customerType || ''))
      return response(400, { success: false, message: 'Customer type must be college or outsider' });
    if (!address || typeof address !== 'string')
      return response(400, { success: false, message: 'Address is required' });
    if (!contactInfo || !contactInfo.name || !contactInfo.phone || !contactInfo.email)
      return response(400, { success: false, message: 'Valid contact info is required' });
    if (!payment || !['cod', 'online'].includes(payment.method || ''))
      return response(400, { success: false, message: 'Payment method must be cod or online' });

    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    const deliveryFee = subtotal >= 100 ? 0 : 30;
    const total = subtotal + deliveryFee;

    const now = Date.now();
    const order = {
      orderNumber: `GD${String(now).slice(-6)}`,
      status: 'pending',
      items: items.map(i => ({
        name: i.name,
        quantity: Number(i.quantity),
        price: Number(i.price),
        total: Number(i.price) * Number(i.quantity)
      })),
      customerType,
      hostel: customerType === 'college' ? hostel : undefined,
      deliveryAddress: { street: address, city: '', state: '', pincode: '' },
      contactInfo,
      pricing: { subtotal, deliveryFee, total },
      payment: { method: payment.method, status: 'pending' },
      deliveryDate: new Date(),
      deliveryTime: 'morning',
      notes
    };

    // ✅ Save order in MongoDB
    const db = await connectDB();
    await db.collection("orders").insertOne(order);

    // Fire-and-forget email
    setTimeout(() => {
      Promise.resolve(sendNewOrderEmail(order)).catch(() => {});
    }, 10);

    return response(201, {
      success: true,
      message: 'Order received & saved to DB ✅',
      data: { orderNumber: order.orderNumber, pricing: order.pricing }
    });
  } catch (err) {
    console.error("Order error:", err);
    return response(500, { success: false, message: 'Server error while creating guest order' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'false'
    },
    body: JSON.stringify(body)
  };
}
