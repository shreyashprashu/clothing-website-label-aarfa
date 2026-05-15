import Razorpay from 'razorpay';
import { getServiceClient } from '../_lib/supabase.js';
import { productById, effectivePriceInr } from '../_lib/products.js';
import { sendOrderConfirmation } from '../_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, shippingAddress, userId, guestEmail, paymentMethod = 'razorpay', currency = 'INR' } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }
    if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.pincode || !shippingAddress.phone) {
      return res.status(400).json({ error: 'Shipping address incomplete' });
    }

    // Server-side price computation — never trust client totals.
    let subtotalInr = 0;
    const lineItems = [];
    for (const it of items) {
      const p = productById(it.productId);
      if (!p) return res.status(400).json({ error: `Unknown product ${it.productId}` });
      if (!p.sizes.includes(it.size)) return res.status(400).json({ error: `Invalid size ${it.size} for ${p.name}` });
      const qty = Math.max(1, Math.min(20, Math.floor(Number(it.quantity) || 0)));
      const unit = effectivePriceInr(p);
      const line = unit * qty;
      subtotalInr += line;
      lineItems.push({
        product_id: p.id, product_name: p.name,
        size: it.size, color: it.color || '',
        quantity: qty,
        unit_price_paise: unit * 100,
        line_total_paise: line * 100,
      });
    }

    // Pricing rules:
    //   Domestic (INR): free shipping >= ₹2999, else ₹99
    //   International: flat ₹5000 service/shipping markup, no domestic shipping fee
    const isIntl = String(currency).toUpperCase() !== 'INR';
    const shippingInr = isIntl ? 0 : (subtotalInr >= 2999 ? 0 : 99);
    const markupInr = isIntl ? 5000 : 0;
    const totalInr = subtotalInr + shippingInr + markupInr;

    const sb = getServiceClient();

    // COD: skip Razorpay, just create the order in the DB
    if (paymentMethod === 'cod') {
      const { data: order, error } = await sb.from('orders').insert({
        user_id: userId || null,
        guest_email: userId ? null : (guestEmail || null),
        status: 'cod_confirmed',
        payment_method: 'cod',
        subtotal_paise: subtotalInr * 100,
        shipping_paise: (shippingInr + markupInr) * 100,
        total_paise: totalInr * 100,
        currency: 'INR',
        shipping_address: shippingAddress,
      }).select().single();
      if (error) throw error;
      const { error: liErr } = await sb.from('order_items').insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
      if (liErr) throw liErr;

      const to = shippingAddress?.email || guestEmail;
      let email = { ok: false, skipped: true };
      if (to) {
        try { email = await sendOrderConfirmation({ to, order, items: lineItems }); }
        catch (e) { email = { ok: false, error: e?.message || 'send failed' }; }
      }
      return res.status(200).json({ paymentMethod: 'cod', order, email });
    }

    // Razorpay: create an Order with them, then mirror it in our DB with status=created
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await rzp.orders.create({
      amount: totalInr * 100,
      currency: 'INR',
      receipt: `la_${Date.now()}`,
      notes: { source: 'label-aarfa-web' },
    });

    const { data: order, error } = await sb.from('orders').insert({
      user_id: userId || null,
      guest_email: userId ? null : (guestEmail || null),
      status: 'created',
      payment_method: 'razorpay',
      subtotal_paise: subtotalInr * 100,
      shipping_paise: (shippingInr + markupInr) * 100,
      total_paise: totalInr * 100,
      currency: 'INR',
      razorpay_order_id: rzpOrder.id,
      shipping_address: shippingAddress,
    }).select().single();
    if (error) throw error;

    const { error: liErr } = await sb.from('order_items').insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
    if (liErr) throw liErr;

    return res.status(200).json({
      paymentMethod: 'razorpay',
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('orders/create error', err);
    return res.status(500).json({ error: err.message || 'Order creation failed' });
  }
}
