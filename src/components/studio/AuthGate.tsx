'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/cn';

interface AuthGateProps {
  onSignInWithGoogle: () => Promise<void>;
  message: string;
  loading: boolean;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export function AuthGate({ onSignInWithGoogle, message, loading }: AuthGateProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSignInWithGoogle();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not start sign-in.');
      setSubmitting(false);
    }
  }

  const busy = loading || submitting;
  const infoMsg = !errorMsg && message && message !== 'Loading…' ? message : '';

  return (
    <div className="studio-bg relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Warm ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[65vh]"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 50% -8%, rgba(191,59,42,0.08) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Logo above card */}
        <div className="mb-7 flex justify-center">
          <a href="/" className="flex items-baseline gap-1 no-underline">
            <span className="font-serif text-[22px] font-bold tracking-tight text-ink">Vokal</span>
            <span className="mb-0.5 inline-block h-[5px] w-[5px] rounded-full bg-accent" />
          </a>
        </div>

        {/* Card */}
        <div className="rounded-[26px] border border-faint-2/60 bg-white/82 px-8 py-9 shadow-[0_8px_48px_rgba(28,24,20,.09),0_2px_10px_rgba(28,24,20,.05)] backdrop-blur-xl">
          {/* Headline */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-[27px] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
              Your voice.
              <br />
              <span className="italic text-accent" style={{ fontStyle: 'italic' }}>
                Perfectly expressed.
              </span>
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Speak for 60 seconds. Get polished writing in your voice — with every change explained.
            </p>
          </div>

          {/* Divider */}
          <div className="eyebrow-line mb-6">sign in to continue</div>

          {/* Google sign-in button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className={cn(
              'group flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-faint-2/80 bg-paper px-6 py-3.5',
              'text-[14px] font-semibold text-ink transition-all duration-300 ease-out',
              'hover:-translate-y-0.5 hover:border-ink/12 hover:bg-white hover:shadow-[0_8px_28px_rgba(28,24,20,.1)]',
              'active:translate-y-0 active:shadow-none',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
            )}
          >
            {!submitting && <GoogleIcon />}
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-faint border-t-ink/40" />
                Redirecting to Google…
              </span>
            ) : (
              'Continue with Google'
            )}
          </button>

          {/* Error message */}
          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-[13px] leading-relaxed text-accent"
            >
              {errorMsg}
            </motion.p>
          )}

          {/* Info message */}
          {infoMsg && (
            <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">{infoMsg}</p>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-5 text-center text-[11px] text-faint">
          No password needed · Secure Google sign-in
        </p>
      </motion.div>
    </div>
  );
}
