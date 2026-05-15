import { createClient } from '@supabase/supabase-js';

// Client-side Supabase. Uses the public ANON key — RLS in Supabase keeps user data safe.
// Falls back to a stub when env vars are missing so the app still builds/boots locally
// before keys are configured.

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = supabaseConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
