'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient, hasSupabaseConfig } from '@/lib/supabase/client';

function redirectToAuthCallback() {
  const params = new URLSearchParams({ next: '/app/' });
  const search = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;
  if (search) {
    new URLSearchParams(search).forEach((v, k) => {
      if (k !== 'next') params.set(k, v);
    });
  }
  const dest = `/auth/callback?${params.toString()}${window.location.hash}`;
  window.location.replace(dest);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMsg, setAuthMsg] = useState('Loading…');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/callback')) {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('access_token') ||
        search.includes('code=') ||
        search.includes('token_hash=')
      ) {
        redirectToAuthCallback();
        return;
      }
    }

    if (!hasSupabaseConfig()) {
      setAuthMsg('Missing Supabase config. Add env vars in Vercel and redeploy.');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthMsg(s ? '' : 'Enter your email for a magic sign-in link.');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function signInWithEmail(email: string) {
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/app/')}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthMsg('Signed out. Enter your email to continue.');
  }

  return { session, loading, authMsg, setAuthMsg, signInWithEmail, signOut };
}
