import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const options = {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
      autoRefreshToken: true,
    },
  };

  if (!url || !key) {
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key', options);
  }

  return createSupabaseClient(url, key, options);
}

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
