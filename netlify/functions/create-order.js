// netlify/functions/create-order.js
const Razorpay = require("razorpay");

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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, currency = "INR", coupon } = JSON.parse(event.body);

    // ✅ Calculate total from items (price × quantity)
    let totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Apply coupon discount if provided
    if (coupon && coupon.code) {
      const couponValidation = await validateCouponOnServer(coupon.code, totalAmount);
      if (couponValidation.valid) {
        totalAmount -= couponValidation.discountAmount;
      }
    }

    if (totalAmount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Invalid order amount" }),
      };
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: totalAmount * 100, // convert ₹ → paise
      currency,
      payment_capture: 1, // auto capture
    };

    const order = await razorpay.orders.create(options);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, order }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
