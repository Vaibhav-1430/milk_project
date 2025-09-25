const fetch = require("node-fetch");

const {
  ADMIN_EMAIL,
  NODE_ENV,
  EMAIL_WORKER_URL,
  EMAIL_WORKER_SECRET,
} = process.env;

// 🔑 Fire-and-forget worker
function fireAndForgetWorker({ to, subject, html, text }) {
    if (!EMAIL_WORKER_URL || !EMAIL_WORKER_SECRET) {
      console.warn("⚠️ Worker URL or secret missing, skipping email");
      return;
    }
  
    // normalize casing if user set EMAIL_WORKER_URL=/sendEmail
    const workerUrl = EMAIL_WORKER_URL.replace(/sendEmail$/i, "send-email");
  
    fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": EMAIL_WORKER_SECRET,  // ✅ ONLY from env
      },
      body: JSON.stringify({ to, subject, html, text }),
    })
      .then((r) => r.text())
      .then((t) => console.log("📨 Worker responded:", t))
      .catch((e) => console.error("❌ Worker error:", e));
  }
  

async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error("Missing recipient");

  // ✅ Always send via worker in fire-and-forget mode
  if (EMAIL_WORKER_URL) {
    fireAndForgetWorker({ to, subject, html, text });
    return { accepted: [to], provider: "email-worker", async: true };
  }

  // ❌ Disable SMTP / Resend fallbacks to avoid Railway timeout
  console.warn("⚠️ No EMAIL_WORKER_URL set, skipping email send.");
  return { accepted: [], skipped: true, provider: "none" };
}

// === HTML builders ===
function formatOrderHtml(order) {
  const itemsRows = order.items
    .map(
      (i) => `
    <tr>
      <td>${i.name}</td>
      <td style="text-align:center;">${i.quantity}</td>
      <td style="text-align:right;">₹${i.price.toFixed(2)}</td>
      <td style="text-align:right;">₹${i.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;">
      <h2>New Order ${order.orderNumber || ""}</h2>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Customer:</strong> ${order.contactInfo?.name} | ${
    order.contactInfo?.phone
  } | ${order.contactInfo?.email}</p>
      <p><strong>Type:</strong> ${order.customerType}${
    order.hostel ? ` | Hostel: ${order.hostel}` : ""
  }</p>
      <p><strong>Address:</strong> ${order.deliveryAddress?.street}, ${
    order.deliveryAddress?.city
  }, ${order.deliveryAddress?.state} - ${
    order.deliveryAddress?.pincode
  }</p>
      <table style="width:100%; border-collapse:collapse;" border="1" cellpadding="8">
        <thead>
          <tr>
            <th align="left">Item</th>
            <th>Qty</th>
            <th align="right">Price</th>
            <th align="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="3" align="right"><strong>Subtotal</strong></td>
            <td align="right">₹${order.pricing.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" align="right"><strong>Delivery Fee</strong></td>
            <td align="right">₹${order.pricing.deliveryFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" align="right"><strong>Total</strong></td>
            <td align="right"><strong>₹${order.pricing.total.toFixed(
              2
            )}</strong></td>
          </tr>
        </tbody>
      </table>
      <p><strong>Payment:</strong> ${order.payment.method} (${order.payment.status})</p>
      <p><strong>Delivery:</strong> ${new Date(
        order.deliveryDate
      ).toDateString()} | ${order.deliveryTime}</p>
      ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
      <p style="color:#888;">Environment: ${NODE_ENV}</p>
    </div>
  `;
}

function formatCustomerHtml(order) {
  return `
    <div style="font-family:Arial,sans-serif;">
      <h2>Thank you for your order, ${order.contactInfo?.name}!</h2>
      <p>Your order <strong>${order.orderNumber}</strong> has been received.</p>
      <p><strong>Total:</strong> ₹${order.pricing.total}</p>
      <p>We’ll notify you once it’s on the way 🚚</p>
      <p style="color:#888;">- Team GaramDoodh</p>
    </div>
  `;
}

// === Email senders ===
async function sendNewOrderEmail(order) {
  const adminSubject = `New Order ${order.orderNumber || ""} - ${
    order.contactInfo?.name || ""
  }`.trim();
  const adminHtml = formatOrderHtml(order);
  const adminText = `New order ${order.orderNumber || ""} from ${
    order.contactInfo?.name
  }. Total: ₹${order.pricing.total}`;

  // Send to admin
  sendMail({
    to: ADMIN_EMAIL,
    subject: adminSubject,
    html: adminHtml,
    text: adminText,
  });

  // Send confirmation to customer
  if (order.contactInfo?.email) {
    const customerSubject = `Your GaramDoodh Order Confirmation (${
      order.orderNumber || ""
    })`;
    const customerHtml = formatCustomerHtml(order);
    const customerText = `Hi ${order.contactInfo?.name}, thanks for your order! Total: ₹${order.pricing.total}.`;

    sendMail({
      to: order.contactInfo.email,
      subject: customerSubject,
      html: customerHtml,
      text: customerText,
    });
  }
}

module.exports = {
  sendMail,
  sendNewOrderEmail,
};
