'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function hasAuthParams(search: string, hash: string) {
  return (
    hash.includes('access_token') ||
    hash.includes('error=') ||
    search.includes('code=') ||
    search.includes('token_hash=')
  );
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const next = searchParams.get('next') ?? '/app/';
    const supabase = createClient();

    async function finish() {
      try {
        const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
        if (oauthError) {
          throw new Error(oauthError);
        }

        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          await supabase.auth.getSession();
        }

        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        if (tokenHash && type) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'email' | 'magiclink' | 'signup' | 'recovery' | 'invite',
          });
          if (otpError) throw otpError;
        }

        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const pkce =
              exchangeError.message.includes('PKCE') ||
              exchangeError.message.includes('code verifier');
            if (pkce) {
              const { data: { session: existing } } = await supabase.auth.getSession();
              if (!existing) {
                throw new Error(
                  'Sign-in could not be completed. Try again from https://vokal.work/app in the same browser.',
                );
              }
            } else {
              throw exchangeError;
            }
          }
        }

        // Allow Supabase client to persist session from URL
        await new Promise((r) => setTimeout(r, 150));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          setError('Sign-in expired or invalid. Go back to Studio and try again.');
          return;
        }

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

export { hasAuthParams };
