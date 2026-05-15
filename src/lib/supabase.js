import { createClient } from '@supabase/supabase-js';

// Client-side Supabase. Uses the public ANON key — RLS in Supabase keeps user data safe.
// Falls back to a stub when env vars are missing so the app still builds/boots locally
// before keys are configured.

// Trim defensively — env values pasted from a .env file can carry trailing whitespace
// which silently breaks URL parsing and JWT validation.
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(url && anon);

export const supabase = supabaseConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
