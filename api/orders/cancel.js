// POST /api/orders/cancel
//
// Called by the client when the user dismisses the Razorpay modal without
// paying, or when /api/orders/verify rejects (signature mismatch, etc).
// Atomically transitions the order from 'created' → 'cancelled' AND releases
// the stock units that were reserved at create-time. The `.eq('status',
// 'created')` guard means this is a no-op if the payment already succeeded
// in parallel (verify or webhook beat us to it) — we never accidentally
// cancel a paid order.
//
// Body: { orderId?: uuid, razorpayOrderId?: string }  — either is enough.
import { getServiceClient } from '../_lib/supabase.js';

async function releaseStockForOrder(sb, orderId) {
  try {
    const { data: items, error } = await sb.from('order_items')
      .select('product_id, quantity').eq('order_id', orderId);
    if (error || !items?.length) return;
    const agg = new Map();
    for (const it of items) agg.set(it.product_id, (agg.get(it.product_id) || 0) + (it.quantity || 0));
    const basket = Array.from(agg.entries()).map(([pid, qty]) => ({ product_id: pid, qty }));
    await sb.rpc('increment_stock', { p_items: basket });
  } catch (e) {
    console.error('[orders/cancel] increment_stock failed', { orderId, err: e?.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { orderId, razorpayOrderId } = req.body || {};
    if (!orderId && !razorpayOrderId) {
      return res.status(400).json({ error: 'orderId or razorpayOrderId required' });
    }
    const sb = getServiceClient();
    let query = sb.from('orders').update({ status: 'cancelled' }).eq('status', 'created');
    if (orderId) query = query.eq('id', orderId);
    else query = query.eq('razorpay_order_id', razorpayOrderId);
    const { data: cancelled, error } = await query.select().maybeSingle();
    if (error) {
      // Not fatal — log and return ok:false so the client doesn't spin.
      console.error('[orders/cancel] update failed', error?.message);
      return res.status(500).json({ ok: false, error: error.message });
    }
    if (!cancelled) {
      // Already paid / already cancelled / never existed. Either way, nothing
      // for us to do — but report so the client knows not to retry.
      return res.status(200).json({ ok: true, cancelled: false });
    }
    await releaseStockForOrder(sb, cancelled.id);
    return res.status(200).json({ ok: true, cancelled: true, orderId: cancelled.id });
  } catch (err) {
    console.error('[orders/cancel] error', err);
    return res.status(500).json({ ok: false, error: err.message || 'Cancel failed' });
  }
}
