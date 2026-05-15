import crypto from 'node:crypto';
import { getServiceClient } from '../_lib/supabase.js';
import { sendOrderConfirmation } from '../_lib/email.js';

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

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Signature mismatch' });
    }

    const sb = getServiceClient();
    const { data: order, error } = await sb
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single();
    if (error) throw error;

    const { data: items } = await sb.from('order_items').select('*').eq('order_id', order.id);

    // Send confirmation — failures should not break the API response.
    const to = order.shipping_address?.email || order.guest_email;
    if (to) {
      try { await sendOrderConfirmation({ to, order, items: items || [] }); }
      catch (e) { console.error('confirmation email failed', e); }
    }

    return res.status(200).json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error('orders/verify error', err);
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
}
