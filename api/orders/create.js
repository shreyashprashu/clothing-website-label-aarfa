import Razorpay from 'razorpay';
import { getServiceClient } from '../_lib/supabase.js';
import { productById, effectivePriceInr } from '../_lib/products.js';
import { sendOrderConfirmation, sendOrderAdminNotification } from '../_lib/email.js';
import { validatePromo } from '../_lib/promos.js';

// Best-effort: persist the address as the user's default so next time it's prefilled.
async function saveDefaultAddress(sb, userId, addr) {
  if (!userId || !addr) return;
  try {
    await sb.from('addresses').update({ is_default: false }).eq('user_id', userId);
    await sb.from('addresses').insert({
      user_id: userId,
      full_name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || null,
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: 'IN',
      is_default: true,
    });
  } catch (e) {
    // Never let address-save failures cascade into the order flow
    console.error('saveDefaultAddress failed', e?.message || e);
  }
}

// Insert order then line items. If line items fail, roll back the order so we never
// leave an orphan row behind.
async function insertOrderAtomic(sb, orderRow, lineItems) {
  const { data: order, error } = await sb.from('orders').insert(orderRow).select().single();
  if (error) throw error;
  try {
    const { error: liErr } = await sb.from('order_items')
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
    if (liErr) throw liErr;
    return order;
  } catch (liErr) {
    // Rollback — delete the orphan order
    try { await sb.from('orders').delete().eq('id', order.id); }
    catch (delErr) { console.error('rollback delete failed', delErr?.message || delErr); }
    throw liErr;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, shippingAddress, userId: clientUserId, guestEmail, paymentMethod = 'razorpay', currency = 'INR', promoCode } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }
    if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.pincode || !shippingAddress.phone || !shippingAddress.name) {
      return res.status(400).json({ error: 'Shipping address incomplete' });
    }

    const sb = getServiceClient();

    // Server-authoritative user id: validate the Supabase access token if present.
    // The `userId` in the request body is only a hint and is discarded if the token
    // doesn't match (or isn't there at all → guest checkout).
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let userId = null;
    if (bearer) {
      const { data, error } = await sb.auth.getUser(bearer);
      if (!error && data?.user) userId = data.user.id;
    }
    if (!userId && clientUserId) {
      console.warn('orders/create: client sent userId without a valid token — treating as guest', { clientUserId });
    }

    // Server-authoritative intl detection: if Vercel says the request is from outside
    // India, force intl pricing regardless of the currency the client claims. Empty
    // header (local dev) falls back to the client value.
    const headerCountry = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
    const headerForcesIntl = headerCountry && headerCountry !== 'IN';

    // Server-side price computation — never trust client totals.
    // Aggregate quantity per product across size lines to enforce stock at the
    // product level, since stock is a single field per product (not per variant).
    const perProductQty = new Map();
    let subtotalInr = 0;
    const lineItems = [];
    for (const it of items) {
      const p = productById(it.productId);
      if (!p) return res.status(400).json({ error: `Unknown product ${it.productId}` });
      if (!p.sizes.includes(it.size)) return res.status(400).json({ error: `Invalid size ${it.size} for ${p.name}` });
      const qty = Math.max(1, Math.min(20, Math.floor(Number(it.quantity) || 0)));
      perProductQty.set(p.id, (perProductQty.get(p.id) || 0) + qty);
      const unit = effectivePriceInr(p);
      const line = unit * qty;
      subtotalInr += line;
      // `color` column is kept on the schema for legacy rows but always written
      // as empty string now — UI has no color selection.
      lineItems.push({
        product_id: p.id, product_name: p.name,
        size: it.size, color: '',
        quantity: qty,
        unit_price_paise: unit * 100,
        line_total_paise: line * 100,
      });
    }
    for (const [pid, qty] of perProductQty) {
      const p = productById(pid);
      if (typeof p.stock === 'number' && qty > p.stock) {
        return res.status(400).json({ error: `Only ${p.stock} of "${p.name}" available — please reduce the quantity` });
      }
    }

    // Pricing rules:
    //   Domestic (INR): free shipping >= ₹2999, else ₹99
    //   International: flat ₹5000 service/shipping markup, no domestic shipping fee
    const isIntl = headerForcesIntl || (String(currency).toUpperCase() !== 'INR');
    const shippingInr = isIntl ? 0 : (subtotalInr >= 2999 ? 0 : 99);
    const markupInr = isIntl ? 5000 : 0;

    // Promo code — server-authoritative. firstOrderOnly is enforced via a
    // count of the user's prior successful orders. Guests can use a
    // firstOrderOnly code (we have no stable identity to count against).
    let priorOrderCount = 0;
    if (promoCode && userId) {
      const { count } = await sb.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['paid', 'cod_confirmed', 'shipped', 'delivered']);
      priorOrderCount = count || 0;
    }
    const promoResult = validatePromo({ code: promoCode, subtotalInr, isIntl, priorOrderCount });
    if (promoCode && promoResult.error) {
      return res.status(400).json({ error: promoResult.error });
    }
    const discountInr = promoResult.discountInr || 0;
    const appliedPromoCode = promoResult.code || null;

    const totalInr = Math.max(0, subtotalInr + shippingInr + markupInr - discountInr);

    // ----- COD -----
    if (paymentMethod === 'cod') {
      const order = await insertOrderAtomic(sb, {
        user_id: userId || null,
        guest_email: userId ? null : (guestEmail || null),
        status: 'cod_confirmed',
        payment_method: 'cod',
        subtotal_paise: subtotalInr * 100,
        shipping_paise: (shippingInr + markupInr) * 100,
        discount_paise: discountInr * 100,
        promo_code: appliedPromoCode,
        total_paise: totalInr * 100,
        currency: 'INR',
        shipping_address: shippingAddress,
      }, lineItems);

      await saveDefaultAddress(sb, userId, shippingAddress);

      const to = shippingAddress?.email || guestEmail;
      let email = { ok: false, skipped: true };
      if (to) {
        try { email = await sendOrderConfirmation({ to, order, items: lineItems }); }
        catch (e) { email = { ok: false, error: e?.message || 'send failed' }; }
      } else {
        console.warn('[email] order-confirmation skipped: no recipient', { orderId: order.id, paymentMethod: 'cod' });
      }
      // Notify the shop owner so they can start fulfilment. COD orders are auto-confirmed
      // on creation, so we send the admin email here (no separate payment step).
      try { await sendOrderAdminNotification({ order, items: lineItems, address: shippingAddress }); }
      catch (e) { console.error('admin notify failed (cod)', e?.message); }
      return res.status(200).json({ paymentMethod: 'cod', order, email });
    }

    // ----- Razorpay -----
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

    let order;
    try {
      order = await insertOrderAtomic(sb, {
        user_id: userId || null,
        guest_email: userId ? null : (guestEmail || null),
        status: 'created',
        payment_method: 'razorpay',
        subtotal_paise: subtotalInr * 100,
        shipping_paise: (shippingInr + markupInr) * 100,
        discount_paise: discountInr * 100,
        promo_code: appliedPromoCode,
        total_paise: totalInr * 100,
        currency: 'INR',
        razorpay_order_id: rzpOrder.id,
        shipping_address: shippingAddress,
      }, lineItems);
    } catch (dbErr) {
      // Razorpay order will expire on its own in ~15 min if never paid.
      console.error('Razorpay order created but DB insert failed — Razorpay order will auto-expire', { rzpOrderId: rzpOrder.id, err: dbErr?.message });
      throw dbErr;
    }

    await saveDefaultAddress(sb, userId, shippingAddress);

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
