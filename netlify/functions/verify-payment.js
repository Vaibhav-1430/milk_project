const Razorpay = require("razorpay");
const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = JSON.parse(event.body);

    // Generate signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Payment verification failed" }),
      };
    }

    // ✅ Payment verified → now save order in DB
    const res = await fetch(`${process.env.API_URL}/api/orders-guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const savedOrder = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, order: savedOrder }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
