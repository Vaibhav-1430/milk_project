const { connectToDatabase } = require('../../db');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const { sendNewOrderEmail } = require('../../utils/mailer');

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

// Helper function to find or create user
async function findOrCreateUser(contactInfo, customerType, hostel) {
  let user = await User.findOne({ email: contactInfo.email });
  
  if (!user) {
    // Create new user with a temporary password for guest orders
    user = new User({
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      password: 'guest_temp_password_' + Date.now(), // Temporary password for guest users
      role: 'customer',
      customerType: customerType,
      hostel: customerType === 'college' ? hostel : undefined,
      isActive: true
    });
    await user.save();
    console.log('✅ New guest user created:', user.email);
  }
  
  return user;
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
    console.log('📋 Processing guest order...');
    await connectToDatabase();
    
    const body = JSON.parse(event.body || '{}');
    const { items, customerType, hostel, address, contactInfo, payment, notes, coupon, deliveryDate, deliveryTime } = body;

    // Validation
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

    // Find or create user
    const user = await findOrCreateUser(contactInfo, customerType, hostel);

    // Find products for the order items
    const orderItems = [];
    for (const item of items) {
      // Try to find product by name and quantity
      let product = await Product.findOne({ 
        name: { $regex: new RegExp(item.name, 'i') },
        isAvailable: true 
      });
      
      // If no product found, create a generic product reference
      if (!product) {
        console.log(`⚠️ Product not found for: ${item.name}, using generic product`);
        // Find any available product as fallback
        product = await Product.findOne({ isAvailable: true });
        
        if (!product) {
          throw new Error(`No products available in database`);
        }
      }
      
      orderItems.push({
        product: product._id,
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.price) * Number(item.quantity)
      });
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    const deliveryFee = subtotal >= 100 ? 0 : 30;
    
    // Calculate coupon discount
    let couponDiscount = 0;
    if (coupon && coupon.code) {
      const couponValidation = await validateCouponOnServer(coupon.code, subtotal);
      if (couponValidation.valid) {
        couponDiscount = couponValidation.discountAmount;
      }
    }
    
    const total = subtotal + deliveryFee - couponDiscount;

    // Create order using Mongoose model
    const order = new Order({
      user: user._id,
      items: orderItems,
      customerType,
      hostel: customerType === 'college' ? hostel : undefined,
      deliveryAddress: {
        street: address,
        city: 'Default City',
        state: 'Default State',
        pincode: '000000'
      },
      contactInfo,
      pricing: { 
        subtotal, 
        deliveryFee, 
        total 
      },
      payment: { 
        method: payment.method, 
        status: payment.method === 'cod' ? 'pending' : 'paid',
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpaySignature: payment.razorpaySignature
      },
      status: 'pending',
      deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      deliveryTime: deliveryTime || 'morning',
      notes
    });

    // Save order to database
    await order.save();
    console.log('✅ Order saved to database:', order.orderNumber);

    // Fire-and-forget email
    setTimeout(() => {
      Promise.resolve(sendNewOrderEmail(order)).catch((err) => {
        console.error('Email sending failed:', err);
      });
    }, 10);

    return response(201, {
      success: true,
      message: 'Order received & saved to DB ✅',
      data: { 
        orderNumber: order.orderNumber, 
        pricing: order.pricing,
        orderId: order._id
      }
    });
  } catch (err) {
    console.error("💥 Order creation error:", err);
    return response(500, { success: false, message: 'Server error while creating guest order', error: err.message });
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
