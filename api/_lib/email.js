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
    `<tr><td style="padding:8px 0">${i.product_name} <span style="color:#A89888">(Size ${i.size}, qty ${i.quantity})</span></td><td style="padding:8px 0;text-align:right">${fmt(i.line_total_paise)}</td></tr>`
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

export async function sendContactMessage({ name, email, message }) {
  const admin = (process.env.ADMIN_EMAIL || '').trim() || 'care@labelaarfa.com';
  return sendOrLog({
    from: FROM, to: admin, replyTo: email,
    subject: `New contact-form message — ${name}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br>')}</p>`,
  }, 'contact-form');
}
