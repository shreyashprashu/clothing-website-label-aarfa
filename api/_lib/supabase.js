import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client. Uses the service role key — bypasses RLS.
// NEVER import this from anything inside src/ — it would be bundled to the browser.
export function getServiceClient() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error('Supabase server credentials missing');
  return createClient(url, key, { auth: { persistSession: false } });
}
