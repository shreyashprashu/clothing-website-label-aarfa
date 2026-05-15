import { getServiceClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, honeypot } = req.body || {};
    if (honeypot) return res.status(200).json({ ok: true });
    if (!email || !email.includes('@') || email.length > 254) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const sb = getServiceClient();
    // upsert so re-subscribing flips status back to active
    const { error } = await sb
      .from('newsletter_subscribers')
      .upsert({ email: email.toLowerCase().trim(), status: 'active' }, { onConflict: 'email' });
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('newsletter error', err);
    return res.status(500).json({ error: err.message || 'Subscribe failed' });
  }
}
