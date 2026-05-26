'use client';

import { useCallback, useEffect, useState } from 'react';
import { completeGoogleAuth, fetchAuthMe, getGoogleAuthStartUrl } from '@/lib/api';
import { clearSession, getAccessToken, getStoredUser, setSession, type StoredUser } from '@/lib/auth';

export interface AuthSession {
  access_token: string;
  user: StoredUser;
}

export function useAuth() {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMsg, setAuthMsg] = useState('');

  const applySession = useCallback((accessToken: string, user: StoredUser) => {
    setSession(accessToken, user);
    setSessionState({ access_token: accessToken, user });
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token) {
      setLoading(false);
      return;
    }

    if (stored) {
      setSessionState({ access_token: token, user: stored });
    }

    fetchAuthMe(token)
      .then((user) => {
        applySession(token, user);
        setAuthMsg('');
      })
      .catch(() => {
        clearSession();
        setSessionState(null);
        setAuthMsg('Session expired. Sign in again.');
      })
      .finally(() => setLoading(false));
  }, [applySession]);

  async function signInWithGoogle() {
    const url = await getGoogleAuthStartUrl('/app/');
    if (url.includes('supabase.co')) {
      throw new Error(
        'This site is still using old Supabase login. Redeploy Vercel from the latest code.',
      );
    }
    if (!url.includes('accounts.google.com')) {
      throw new Error('Invalid sign-in URL from API. Check NEXT_PUBLIC_VOCA_API_URL and Railway JWT_SECRET.');
    }
    window.location.href = url;
  }

  function signOut() {
    clearSession();
    setSessionState(null);
    setAuthMsg('');
  }

  return { session, loading, authMsg, setAuthMsg, signInWithGoogle, signOut, applySession };
}
