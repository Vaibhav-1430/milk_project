const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  try {
    // ✅ Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, x-worker-secret",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: "OK"
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Method not allowed" })
      };
    }

    // ✅ Normalize headers
    const headers = Object.keys(event.headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = event.headers[key];
      return acc;
    }, {});

    const secret = headers["x-worker-secret"];
    if (secret !== process.env.EMAIL_WORKER_SECRET) {
      console.error("❌ Forbidden: Invalid secret", { got: secret });
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Forbidden: Invalid secret" })
      };
    }

    // ✅ Parse body
    const body = JSON.parse(event.body || "{}");
    const order = body.order;
    if (!order) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing order in request body" })
      };
    }

    // ✅ Check env vars
    const required = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS", "ADMIN_EMAIL"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error("❌ Missing env vars:", missing);
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing required fields", missing })
      };
    }

    // ✅ Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // === ADMIN EMAIL (always sent) ===
    const adminMail = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order ${order.orderNumber || ""}`,
      text: `Order from ${order.contactInfo?.name} - Total ₹${order.pricing.total}`,
      html: `<h2>New Order ${order.orderNumber || ""}</h2>
             <p><strong>Name:</strong> ${order.contactInfo?.name}</p>
             <p><strong>Email:</strong> ${order.contactInfo?.email}</p>
             <p><strong>Total:</strong> ₹${order.pricing.total}</p>`
    };

    await transporter.sendMail(adminMail);
    console.log("📧 Admin email sent:", process.env.ADMIN_EMAIL);

    // === CUSTOMER EMAIL (optional) ===
    if (order.contactInfo?.email) {
      try {
        const customerMail = {
          from: process.env.EMAIL_USER,
          to: order.contactInfo.email,
          subject: `Your GaramDoodh Order Confirmation (${order.orderNumber || ""})`,
          text: `Hi ${order.contactInfo?.name}, thanks for your order! Your total is ₹${order.pricing.total}.`,
          html: `<h2>Thank you for your order!</h2>
                 <p>Hi ${order.contactInfo?.name},</p>
                 <p>We’ve received your order <strong>${order.orderNumber}</strong> with total <strong>₹${order.pricing.total}</strong>.</p>
                 <p>We’ll notify you once it’s on the way 🚚</p>
                 <p style="color:#888;">- Team GaramDoodh</p>`
        };

        await transporter.sendMail(customerMail);
        console.log("📧 Customer email sent:", order.contactInfo.email);
      } catch (err) {
        console.error("⚠️ Customer email failed:", err.message);
      }
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Admin email sent, customer optional" })
    };
  } catch (err) {
    console.error("❌ Send email error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Email send failed", error: err.message })
    };
  }
};
