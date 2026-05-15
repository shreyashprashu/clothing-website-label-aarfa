import { getServiceClient } from './_lib/supabase.js';
import { sendContactMessage } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, message, honeypot } = req.body || {};
    if (honeypot) return res.status(200).json({ ok: true });  // bot trap
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email, message required' });
    if (!email.includes('@') || email.length > 254) return res.status(400).json({ error: 'Invalid email' });
    if (message.length > 5000) return res.status(400).json({ error: 'Message too long' });

    const sb = getServiceClient();
    const { error } = await sb.from('contact_messages').insert({ name, email, message });
    if (error) throw error;

    try { await sendContactMessage({ name, email, message }); }
    catch (e) { console.error('contact email failed', e); }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact error', err);
    return res.status(500).json({ error: err.message || 'Send failed' });
  }
}
