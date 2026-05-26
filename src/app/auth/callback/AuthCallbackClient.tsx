'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeGoogleAuth } from '@/lib/api';
import { setSession } from '@/lib/auth';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const nextFromUrl = searchParams.get('next') ?? '/app/';

    async function finish() {
      try {
        const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
        if (oauthError) {
          throw new Error(oauthError);
        }

        const code = searchParams.get('code');
        if (!code) {
          setError('Sign-in link invalid or expired. Try again from Studio.');
          return;
        }

        const result = await completeGoogleAuth(code, searchParams.get('state'));
        setSession(result.access_token, result.user);

        const next = result.next || nextFromUrl;
        window.history.replaceState(null, '', next);
        router.replace(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not complete sign-in.');
      }
    }

    finish();
  }, [router, searchParams]);

  return (
    <div className="studio-bg flex min-h-screen items-center justify-center px-6 text-muted">
      <div className="max-w-sm text-center">
        {error ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-accent">{error}</p>
            <a href="/app/" className="text-sm font-medium text-ink underline-offset-4 hover:underline">
              Back to sign in →
            </a>
          </>
        ) : (
          <p className="text-sm">Completing sign-in…</p>
        )}
      </div>
    </div>
  );
}
