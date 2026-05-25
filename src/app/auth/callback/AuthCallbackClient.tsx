'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const next = searchParams.get('next') ?? '/app/';
    const supabase = createClient();

    async function finish() {
      const code = searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      } else {
        await supabase.auth.getSession();
      }
      router.replace(next);
    }

    finish();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-muted">
      {error || 'Completing sign-in…'}
    </div>
  );
}
