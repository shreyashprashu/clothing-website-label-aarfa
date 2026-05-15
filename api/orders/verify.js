import crypto from 'node:crypto';
import { getServiceClient } from '../_lib/supabase.js';
import { sendOrderConfirmation, sendOrderAdminNotification } from '../_lib/email.js';

// Constant-time compare for HMAC hex strings — avoids leaking signature bytes via timing.
function safeEqHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing signature fields' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqHex(expected, razorpay_signature)) {
      return res.status(400).json({ error: 'Signature mismatch' });
    }

    const sb = getServiceClient();
    // Atomic transition: only flip to 'paid' if it's not already paid. If the webhook
    // beat us to it, this returns no row — we then read the existing order and respond
    // without re-sending the confirmation email.
    const { data: order, error } = await sb
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .neq('status', 'paid')
      .select()
      .maybeSingle();
    if (error) throw error;

    if (!order) {
      const { data: already } = await sb.from('orders').select('id').eq('razorpay_order_id', razorpay_order_id).maybeSingle();
      if (!already) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json({ ok: true, orderId: already.id, email: { ok: true, skipped: true, reason: 'already-confirmed' } });
    }

    const { data: items } = await sb.from('order_items').select('*').eq('order_id', order.id);

    // Send confirmation — failures should not break the API response.
    const to = order.shipping_address?.email || order.guest_email;
    let email = { ok: false, skipped: true };
    if (to) {
      try { email = await sendOrderConfirmation({ to, order, items: items || [] }); }
      catch (e) { email = { ok: false, error: e?.message || 'send failed' }; }
    }
    // Notify the shop owner. We only get here if THIS request flipped status to paid
    // (atomic .neq above), so this fires exactly once per order even if the webhook
    // also runs.
    try { await sendOrderAdminNotification({ order, items: items || [], address: order.shipping_address }); }
    catch (e) { console.error('admin notify failed (verify)', e?.message); }

    return res.status(200).json({ ok: true, orderId: order.id, email });
  } catch (err) {
    console.error('orders/verify error', err);
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
}
