import { Resend } from 'resend';

let _resend;
function client() {
  if (_resend) return _resend;
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) throw new Error('RESEND_API_KEY not set');
  _resend = new Resend(key);
  return _resend;
}

const FROM = (process.env.FROM_EMAIL || 'Label Aarfa <onboarding@resend.dev>').trim();

// Always escape any string we put into an email HTML body. Even fields we think come
// from our own DB can be user-controlled — names, product names entered by an attacker
// via the order API, etc. Belt and braces.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Resend's shared sender `onboarding@resend.dev` can only deliver to the email
// address that registered the Resend account. Detect this so we can return a
// clearer error rather than silently failing.
const IS_SHARED_SENDER = /onboarding@resend\.dev/i.test(FROM);

async function sendOrLog(payload, label) {
  try {
    const { data, error } = await client().emails.send(payload);
    if (error) {
      console.error(`[email] ${label} rejected by Resend`, { to: payload.to, error });
      return { ok: false, error: error.message || error.name || 'Resend rejected the message', shared: IS_SHARED_SENDER };
    }
    console.log(`[email] ${label} sent`, { to: payload.to, id: data?.id, shared: IS_SHARED_SENDER });
    return { ok: true, id: data?.id, shared: IS_SHARED_SENDER };
  } catch (err) {
    console.error(`[email] ${label} threw`, { to: payload.to, message: err?.message });
    return { ok: false, error: err?.message || 'Email send failed', shared: IS_SHARED_SENDER };
  }
}

export async function sendOrderConfirmation({ to, order, items }) {
  const fmt = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const rows = items.map((i) =>
    `<tr><td style="padding:8px 0">${esc(i.product_name)} <span style="color:#A89888">(Size ${esc(i.size)}, qty ${Number(i.quantity) || 0})</span></td><td style="padding:8px 0;text-align:right">${fmt(i.line_total_paise)}</td></tr>`
  ).join('');

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#1F1A14;background:#FBF8F3;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:24px;letter-spacing:0.18em;font-weight:500">LABEL AARFA</div>
      <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#7B1E28;margin-top:4px">Fashion Redefined · Est. 2019</div>
    </div>
    <h1 style="font-weight:400;font-size:24px;margin:0 0 8px">Thank you for your order</h1>
    <p style="color:#6B5F4F;margin:0 0 24px">Order <strong>#${order.id.slice(0, 8)}</strong> is confirmed. We will dispatch it within 2 business days.</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8DDC9;border-bottom:1px solid #E8DDC9">
      ${rows}
    </table>
    <table style="width:100%;margin-top:16px;font-size:14px">
      <tr><td>Subtotal</td><td style="text-align:right">${fmt(order.subtotal_paise)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right">${order.shipping_paise === 0 ? 'Free' : fmt(order.shipping_paise)}</td></tr>
      ${order.discount_paise > 0 ? `<tr><td style="color:#7B1E28">Discount${order.promo_code ? ` (${order.promo_code})` : ''}</td><td style="text-align:right;color:#7B1E28">−${fmt(order.discount_paise)}</td></tr>` : ''}
      <tr><td style="padding-top:8px;border-top:1px solid #E8DDC9;font-weight:600">Total</td><td style="padding-top:8px;border-top:1px solid #E8DDC9;text-align:right;font-weight:600">${fmt(order.total_paise)}</td></tr>
    </table>
    <p style="color:#6B5F4F;font-size:13px;margin-top:32px">Questions? Reply to this email or write to care@labelaarfa.com.</p>
  </div>`;

  return sendOrLog({
    from: FROM, to,
    subject: `Order confirmed — Label Aarfa #${order.id.slice(0, 8)}`,
    html,
  }, 'order-confirmation');
}

// Notifies the shop owner that a new order needs fulfilment. Sent for COD orders
// the moment they're placed, and for Razorpay orders the moment payment is verified
// (via /api/orders/verify or the webhook — whichever flips status to paid first).
export async function sendOrderAdminNotification({ order, items, address }) {
  const admin = (process.env.ADMIN_EMAIL || '').trim() || 'label.arfa@gmail.com';
  const fmt = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const orderShort = String(order.id || '').slice(0, 8).toUpperCase();
  const placed = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const addr = address || order.shipping_address || {};

  const rows = (items || []).map((i) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #E8DDC9">${esc(i.product_name)}<br><span style="color:#A89888;font-size:12px">Size ${esc(i.size)} · Qty ${Number(i.quantity) || 0}${i.color ? ' · ' + esc(i.color) : ''}</span></td><td style="padding:8px 12px;border-bottom:1px solid #E8DDC9;text-align:right;white-space:nowrap">${fmt(i.line_total_paise)}</td></tr>`
  ).join('');

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;color:#1F1A14;background:#FBF8F3;padding:28px">
    <div style="margin-bottom:24px;border-bottom:2px solid #7B1E28;padding-bottom:14px">
      <div style="font-size:20px;letter-spacing:0.18em;font-weight:500">LABEL AARFA</div>
      <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#7B1E28;margin-top:4px">New Order — Ship Required</div>
    </div>

    <h2 style="font-weight:400;font-size:22px;margin:0 0 8px">Order #${esc(orderShort)}</h2>
    <div style="font-size:12px;color:#6B5F4F;margin-bottom:20px">Placed ${esc(placed)} IST · Payment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'} · Status: <strong>${esc(order.status)}</strong></div>

    <h3 style="font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#7B1E28;margin:0 0 8px">Customer</h3>
    <table style="width:100%;font-size:13px;margin-bottom:22px;border-collapse:collapse">
      <tr><td style="padding:3px 0;color:#6B5F4F;width:120px">Name</td><td style="padding:3px 0"><strong>${esc(addr.name)}</strong></td></tr>
      <tr><td style="padding:3px 0;color:#6B5F4F">Phone</td><td style="padding:3px 0"><a href="tel:${esc(addr.phone)}" style="color:#1F1A14;text-decoration:none">${esc(addr.phone)}</a></td></tr>
      <tr><td style="padding:3px 0;color:#6B5F4F">Email</td><td style="padding:3px 0"><a href="mailto:${esc(addr.email || order.guest_email || '')}" style="color:#1F1A14;text-decoration:none">${esc(addr.email || order.guest_email || '')}</a></td></tr>
      <tr><td style="padding:3px 0;color:#6B5F4F">Account</td><td style="padding:3px 0">${order.user_id ? 'Registered' : 'Guest checkout'}</td></tr>
    </table>

    <h3 style="font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#7B1E28;margin:0 0 8px">Ship To</h3>
    <div style="font-size:14px;line-height:1.6;margin-bottom:22px;padding:14px 16px;background:#FFFFFF;border:1px solid #E8DDC9;border-radius:8px">
      <strong>${esc(addr.name)}</strong><br>
      ${esc(addr.line1)}<br>
      ${addr.line2 ? esc(addr.line2) + '<br>' : ''}
      ${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.pincode)}<br>
      ${esc(addr.country || 'IN')}<br>
      <span style="color:#6B5F4F;font-size:12px">Phone: ${esc(addr.phone)}</span>
    </div>

    <h3 style="font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:#7B1E28;margin:0 0 8px">Items</h3>
    <table style="width:100%;font-size:13px;border-collapse:collapse;border-top:1px solid #E8DDC9;margin-bottom:14px">
      ${rows}
    </table>

    <table style="width:100%;font-size:13px;border-collapse:collapse">
      <tr><td style="padding:3px 12px;color:#6B5F4F">Subtotal</td><td style="padding:3px 12px;text-align:right">${fmt(order.subtotal_paise)}</td></tr>
      <tr><td style="padding:3px 12px;color:#6B5F4F">Shipping / fees</td><td style="padding:3px 12px;text-align:right">${order.shipping_paise === 0 ? 'Free' : fmt(order.shipping_paise)}</td></tr>
      ${order.discount_paise > 0 ? `<tr><td style="padding:3px 12px;color:#7B1E28">Discount${order.promo_code ? ` (${esc(order.promo_code)})` : ''}</td><td style="padding:3px 12px;text-align:right;color:#7B1E28">−${fmt(order.discount_paise)}</td></tr>` : ''}
      <tr><td style="padding:10px 12px 4px;border-top:1px solid #E8DDC9;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;font-size:12px">Total</td><td style="padding:10px 12px 4px;border-top:1px solid #E8DDC9;text-align:right;font-weight:600;font-size:16px">${fmt(order.total_paise)}</td></tr>
    </table>

    ${order.razorpay_payment_id ? `<div style="margin-top:18px;padding:10px 12px;background:#F6F0E5;border-radius:6px;font-size:12px;color:#6B5F4F">Razorpay payment id: <span style="font-family:monospace;color:#1F1A14">${esc(order.razorpay_payment_id)}</span></div>` : ''}
    ${order.notes ? `<div style="margin-top:14px;padding:12px;background:#F6F0E5;border-radius:6px;font-size:13px"><strong>Customer notes:</strong> ${esc(order.notes)}</div>` : ''}

    <p style="color:#6B5F4F;font-size:11px;margin-top:28px;text-align:center">Full order id: ${esc(order.id)}</p>
  </div>`;

  return sendOrLog({
    from: FROM, to: admin,
    subject: `New order #${orderShort} — ${addr.name || 'Customer'} (${order.payment_method === 'cod' ? 'COD' : 'Paid'})`,
    html,
  }, 'order-admin-notification');
}

export async function sendContactMessage({ name, email, message }) {
  const admin = (process.env.ADMIN_EMAIL || '').trim() || 'label.arfa@gmail.com';
  // Subject and replyTo can't include CRLF (header injection); body fields must be escaped
  // so a malicious submitter can't inject HTML or scripts into the admin's inbox.
  const safeName = String(name || '').replace(/[\r\n]+/g, ' ').slice(0, 120);
  const safeEmail = String(email || '').replace(/[\r\n]+/g, ' ').slice(0, 254);
  return sendOrLog({
    from: FROM, to: admin, replyTo: safeEmail,
    subject: `New contact-form message — ${safeName}`,
    html: `<p><strong>From:</strong> ${esc(safeName)} &lt;${esc(safeEmail)}&gt;</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
  }, 'contact-form');
}
