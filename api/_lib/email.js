import { Resend } from 'resend';
import { productImageUrl } from './products.js';

let _resend;
function client() {
  if (_resend) return _resend;
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) throw new Error('RESEND_API_KEY not set');
  _resend = new Resend(key);
  return _resend;
}

const FROM = (process.env.FROM_EMAIL || 'Label Aarfa <onboarding@resend.dev>').trim();

// Absolute URL of any static file under public/. Used for the logo + product
// thumbnails in transactional emails so they render in the recipient's inbox.
const SITE_URL = (process.env.SITE_URL || 'https://www.labelaarfa.com').replace(/\/$/, '');
const LOGO_URL = `${SITE_URL}/logo-mark-email.png`;

// Reusable branded header for every email. Centered logo + tagline. Keeps the
// inbox preview consistent and gives the templates a single source of truth
// for our "above the headline" branding.
function brandHeader() {
  return `
    <div style="text-align:center;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #E8DDC9">
      <img src="${LOGO_URL}" alt="Label Aarfa" width="56" height="56" style="display:inline-block;width:56px;height:56px;border:0;margin-bottom:10px" />
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.22em;font-weight:500;color:#1F1A14">LABEL AARFA</div>
      <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#7B1E28;margin-top:6px">Fashion Redefined · Est. 2019</div>
    </div>`;
}

// Always escape any string we put into an email HTML body. Even fields we think come
// from our own DB can be user-controlled — names, product names entered by an attacker
// via the order API, etc. Belt and braces.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Customer-facing order reference. MUST match formatOrderRef() in src/App.jsx
// so the success page, OrdersPage, customer email, and admin email all show
// the SAME string ("LA-A1B2C3D4"). Don't sprinkle ad-hoc slices elsewhere.
const formatOrderRef = (uuid) => `LA-${String(uuid || '').slice(0, 8).toUpperCase()}`;

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
  // Each line gets a 72×90 thumbnail of the product. Falls back to a soft cream
  // tile if the image URL can't be resolved (e.g. legacy product missing from
  // the lookup) — better than a broken image icon in the inbox.
  //
  // Colour is shown only when present (multi-colour SKU). For one-colour
  // products we leave it out so the line doesn't read "Size M · · Qty 1".
  const rows = items.map((i) => {
    const img = productImageUrl(Number(i.product_id));
    const thumb = img
      ? `<img src="${img}" alt="" width="72" height="90" style="display:block;width:72px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #E8DDC9" />`
      : `<div style="width:72px;height:90px;background:#F6F0E5;border-radius:6px;border:1px solid #E8DDC9"></div>`;
    const colourPart = i.color ? ` · <span style="color:#7B1E28;font-weight:500">${esc(i.color)}</span>` : '';
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #E8DDC9;width:84px;vertical-align:top">${thumb}</td>
        <td style="padding:12px 0 12px 12px;border-bottom:1px solid #E8DDC9;vertical-align:top">
          <div style="font-size:14px;color:#1F1A14;line-height:1.35">${esc(i.product_name)}</div>
          <div style="font-size:12px;color:#A89888;margin-top:4px">Size ${esc(i.size)}${colourPart} · Qty ${Number(i.quantity) || 0}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #E8DDC9;text-align:right;vertical-align:top;white-space:nowrap;font-size:14px;color:#1F1A14;font-weight:500">${fmt(i.line_total_paise)}</td>
      </tr>`;
  }).join('');

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:580px;margin:0 auto;color:#1F1A14;background:#FBF8F3;padding:32px">
    ${brandHeader()}
    <h1 style="font-weight:400;font-size:26px;margin:0 0 8px;text-align:center">Thank you for your order</h1>
    <p style="color:#6B5F4F;margin:0 0 24px;text-align:center">Order <strong style="color:#1F1A14">${esc(formatOrderRef(order.id))}</strong> is confirmed. We will dispatch it within 2 business days.</p>

    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8DDC9">
      ${rows}
    </table>

    <table style="width:100%;margin-top:20px;font-size:14px">
      <tr><td style="padding:4px 0;color:#6B5F4F">Subtotal</td><td style="padding:4px 0;text-align:right">${fmt(order.subtotal_paise)}</td></tr>
      <tr><td style="padding:4px 0;color:#6B5F4F">Shipping</td><td style="padding:4px 0;text-align:right">${order.shipping_paise === 0 ? 'Free' : fmt(order.shipping_paise)}</td></tr>
      ${order.discount_paise > 0 ? `<tr><td style="padding:4px 0;color:#7B1E28">Discount${order.promo_code ? ` (${esc(order.promo_code)})` : ''}</td><td style="padding:4px 0;text-align:right;color:#7B1E28">−${fmt(order.discount_paise)}</td></tr>` : ''}
      <tr><td style="padding:10px 0 4px;border-top:1px solid #E8DDC9;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;font-size:12px">Total</td><td style="padding:10px 0 4px;border-top:1px solid #E8DDC9;text-align:right;font-weight:600;font-size:16px">${fmt(order.total_paise)}</td></tr>
    </table>

    <p style="color:#6B5F4F;font-size:13px;margin-top:32px;text-align:center">Questions? Reply to this email or write to care@labelaarfa.com.</p>
    <p style="color:#A89888;font-size:11px;margin-top:18px;text-align:center;letter-spacing:0.18em">LABEL AARFA · NEW DELHI · INDIA</p>
  </div>`;

  return sendOrLog({
    from: FROM, to,
    subject: `Order confirmed — Label Aarfa ${formatOrderRef(order.id)}`,
    html,
  }, 'order-confirmation');
}

// Notifies the shop owner that a new order needs fulfilment. Sent for COD orders
// the moment they're placed, and for Razorpay orders the moment payment is verified
// (via /api/orders/verify or the webhook — whichever flips status to paid first).
export async function sendOrderAdminNotification({ order, items, address }) {
  const admin = (process.env.ADMIN_EMAIL || '').trim() || 'label.arfa@gmail.com';
  const fmt = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const orderRef = formatOrderRef(order.id);
  const placed = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const addr = address || order.shipping_address || {};

  // Admin row — colour shown on its OWN line (wine background pill) so it
  // jumps out for the person pulling the SKU off the shelf. Skipped silently
  // for one-colour products.
  const rows = (items || []).map((i) => {
    const img = productImageUrl(Number(i.product_id));
    const thumb = img
      ? `<img src="${img}" alt="" width="56" height="70" style="display:block;width:56px;height:70px;object-fit:cover;border-radius:4px;border:1px solid #E8DDC9" />`
      : `<div style="width:56px;height:70px;background:#F6F0E5;border-radius:4px;border:1px solid #E8DDC9"></div>`;
    const colourPill = i.color
      ? `<div style="margin-top:6px"><span style="display:inline-block;padding:3px 9px;background:#7B1E28;color:#F6F0E5;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;border-radius:4px">Colour: ${esc(i.color)}</span></div>`
      : '';
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #E8DDC9;width:68px;vertical-align:top">${thumb}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #E8DDC9;vertical-align:top">
        <div style="font-size:13px;font-weight:500">${esc(i.product_name)}</div>
        <div style="color:#A89888;font-size:12px;margin-top:2px">Size ${esc(i.size)} · Qty ${Number(i.quantity) || 0}</div>
        ${colourPill}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #E8DDC9;text-align:right;white-space:nowrap;vertical-align:top;font-size:13px">${fmt(i.line_total_paise)}</td>
    </tr>`;
  }).join('');

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;color:#1F1A14;background:#FBF8F3;padding:28px">
    <div style="margin-bottom:24px;border-bottom:2px solid #7B1E28;padding-bottom:14px;display:flex;align-items:center;gap:14px">
      <img src="${LOGO_URL}" alt="Label Aarfa" width="44" height="44" style="display:inline-block;width:44px;height:44px;border:0;vertical-align:middle" />
      <div style="display:inline-block;vertical-align:middle">
        <div style="font-size:20px;letter-spacing:0.18em;font-weight:500">LABEL AARFA</div>
        <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#7B1E28;margin-top:4px">New Order — Ship Required</div>
      </div>
    </div>

    <h2 style="font-weight:400;font-size:22px;margin:0 0 8px">Order ${esc(orderRef)}</h2>
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
    subject: `New order ${orderRef} — ${addr.name || 'Customer'} (${order.payment_method === 'cod' ? 'COD' : 'Paid'})`,
    html,
  }, 'order-admin-notification');
}

// Welcome email sent when a visitor subscribes via the home-page newsletter form.
// Includes the WELCOME10 promo code so the on-screen "look out for your welcome
// code" promise actually gets fulfilled.
export async function sendNewsletterWelcome({ to }) {
  const safeTo = String(to || '').replace(/[\r\n]+/g, ' ').slice(0, 254);
  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:580px;margin:0 auto;color:#1F1A14;background:#FBF8F3;padding:32px">
    ${brandHeader()}
    <h1 style="font-weight:400;font-size:26px;margin:0 0 12px;text-align:center">Welcome to Label Aarfa</h1>
    <p style="color:#6B5F4F;margin:0 0 28px;text-align:center;line-height:1.6">Thank you for joining the list. We're a small Delhi atelier crafting handmade ethnic wear in handloom cottons, soft crepes, and silks — and we're glad to have you here.</p>

    <div style="background:#F6F0E5;border:1px dashed #B8924A;padding:24px;text-align:center;margin:0 0 28px;border-radius:8px">
      <div style="font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:#7B1E28;margin-bottom:8px">Your Welcome Gift</div>
      <div style="font-size:32px;letter-spacing:0.18em;font-weight:600;color:#1F1A14;margin:6px 0">WELCOME10</div>
      <div style="font-size:13px;color:#6B5F4F;margin-top:6px">10% off your first order — use this code at checkout.</div>
    </div>

    <p style="color:#6B5F4F;margin:0 0 12px;line-height:1.6">What you can expect from us:</p>
    <ul style="color:#6B5F4F;font-size:14px;line-height:1.8;margin:0 0 28px;padding-left:20px">
      <li>First look at new arrivals before they go public</li>
      <li>Private edits and limited releases</li>
      <li>Stories from the atelier — our weavers, our craft, our pieces</li>
    </ul>

    <div style="text-align:center;margin:32px 0">
      <a href="https://www.labelaarfa.com/" style="display:inline-block;padding:14px 32px;background:#1F1A14;color:#F6F0E5;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;border-radius:4px">Shop the Collection</a>
    </div>

    <p style="color:#6B5F4F;font-size:13px;margin-top:32px;text-align:center">Questions? Reply to this email or write to care@labelaarfa.com.</p>
    <p style="color:#A89888;font-size:11px;margin-top:24px;text-align:center;letter-spacing:0.18em">LABEL AARFA · NEW DELHI · INDIA</p>
  </div>`;
  return sendOrLog({
    from: FROM, to: safeTo,
    subject: 'Welcome to Label Aarfa — your 10% code is inside',
    html,
  }, 'newsletter-welcome');
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
