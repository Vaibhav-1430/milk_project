const { MongoClient } = require("mongodb");
const { sendNewOrderEmail } = require('../../utils/mailer');

const uri = process.env.MONGODB_URI;
let client = null;

// Server-side coupon validation
async function validateCouponOnServer(couponCode, orderAmount) {
  const coupons = {
    'WELCOME10': {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      description: '10% off on your first order',
      minOrderAmount: 0,
      maxDiscount: 50,
      isActive: true
    },
    'SAVE20': {
      code: 'SAVE20',
      type: 'fixed',
      value: 20,
      description: '₹20 off on orders above ₹100',
      minOrderAmount: 100,
      maxDiscount: 20,
      isActive: true
    },
    'MILK15': {
      code: 'MILK15',
      type: 'percentage',
      value: 15,
      description: '15% off on milk orders',
      minOrderAmount: 0,
      maxDiscount: 100,
      isActive: true
    },
    'FIRST50': {
      code: 'FIRST50',
      type: 'fixed',
      value: 50,
      description: '₹50 off on orders above ₹200',
      minOrderAmount: 200,
      maxDiscount: 50,
      isActive: true
    },
    'LILY': {
      code: 'LILY',
      type: 'percentage',
      value: 100,
      description: 'Special 100% off',
      minOrderAmount: 0,
      maxDiscount: 1000000,
      isActive: true
    }
  };

  const coupon = coupons[couponCode.toUpperCase()];
  
  if (!coupon || !coupon.isActive) {
    return { valid: false, discountAmount: 0 };
  }

  if (orderAmount < coupon.minOrderAmount) {
    return { valid: false, discountAmount: 0 };
  }

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = orderAmount * (coupon.value / 100);
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed') {
    discountAmount = Math.min(coupon.value, coupon.maxDiscount);
  }

  discountAmount = Math.min(discountAmount, orderAmount);

  return { 
    valid: true, 
    discountAmount, 
    description: coupon.description 
  };
}

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
    const { items, customerType, hostel, address, contactInfo, payment, notes, coupon } = body;

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
    
    // Calculate coupon discount
    let couponDiscount = 0;
    let couponData = null;
    if (coupon && coupon.code) {
      // Validate coupon again on server side
      const couponValidation = await validateCouponOnServer(coupon.code, subtotal);
      if (couponValidation.valid) {
        couponDiscount = couponValidation.discountAmount;
        couponData = {
          code: coupon.code,
          type: coupon.type,
          discount: couponDiscount,
          description: couponValidation.description
        };
      }
    }
    
    const total = subtotal + deliveryFee - couponDiscount;

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
      pricing: { subtotal, deliveryFee, couponDiscount, total },
      payment: { method: payment.method, status: 'pending' },
      coupon: couponData,
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
