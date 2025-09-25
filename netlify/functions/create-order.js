// netlify/functions/create-order.js
const Razorpay = require("razorpay");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, currency = "INR" } = JSON.parse(event.body);

    // ✅ Calculate total from items (price × quantity)
    const totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

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
