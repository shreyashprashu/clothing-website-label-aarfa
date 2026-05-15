import { getServiceClient } from './_lib/supabase.js';
import { sendNewsletterWelcome } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, honeypot } = req.body || {};
    if (honeypot) return res.status(200).json({ ok: true });
    if (!email || !email.includes('@') || email.length > 254) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const sb = getServiceClient();
    const normalised = email.toLowerCase().trim();

    // Only send the welcome email if this is a fresh signup (or a re-activation
    // from an unsubscribed state). Returning subscribers don't get re-spammed.
    const { data: existing } = await sb
      .from('newsletter_subscribers')
      .select('status')
      .eq('email', normalised)
      .maybeSingle();
    const isFresh = !existing || existing.status !== 'active';

    const { error } = await sb
      .from('newsletter_subscribers')
      .upsert({ email: normalised, status: 'active' }, { onConflict: 'email' });
    if (error) throw error;

    if (isFresh) {
      try { await sendNewsletterWelcome({ to: normalised }); }
      catch (e) { console.error('newsletter welcome email failed', e?.message); }
    }

    return res.status(200).json({ ok: true, alreadySubscribed: !isFresh });
  } catch (err) {
    console.error('newsletter error', err);
    return res.status(500).json({ error: err.message || 'Subscribe failed' });
  }
}
