import crypto from 'node:crypto';
import { getServiceClient } from '../_lib/supabase.js';

// Razorpay webhook events: payment.captured, payment.failed, refund.processed, etc.
// Configure the URL `https://<host>/api/webhooks/razorpay` in Razorpay Dashboard → Webhooks
// and set RAZORPAY_WEBHOOK_SECRET to the secret you generate there.

export const config = {
  api: {
    bodyParser: false,  // we need the raw body to verify the signature
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = await readRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret) return res.status(400).json({ error: 'Missing signature or secret' });

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Bad signature' });

    const event = JSON.parse(raw);
    const sb = getServiceClient();

    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await sb.from('orders').update({
          status: 'paid',
          razorpay_payment_id: payment.id,
          paid_at: new Date().toISOString(),
        }).eq('razorpay_order_id', payment.order_id);
      }
    } else if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await sb.from('orders').update({ status: 'failed' }).eq('razorpay_order_id', payment.order_id);
      }
    } else if (event.event === 'refund.processed') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await sb.from('orders').update({ status: 'refunded' }).eq('razorpay_order_id', payment.order_id);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('razorpay webhook error', err);
    return res.status(500).json({ error: err.message });
  }
}
