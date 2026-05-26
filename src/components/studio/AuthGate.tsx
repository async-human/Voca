'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/cn';

interface AuthGateProps {
  onSignInWithGoogle: () => Promise<void>;
  message: string;
  loading: boolean;
}

const WAVE_HEIGHTS = [12, 20, 28, 16, 24, 14, 22, 30, 10, 26, 18, 32, 14, 24, 20];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c3.42-3.15 5.384-7.785 5.384-13.315z"
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

  const infoMsg = !errorMsg ? message : '';

  return (
    <div className="studio-bg relative z-[1] px-5 pb-16 pt-[108px] md:px-8">
      <div className="relative z-10 mx-auto grid max-w-[980px] items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="text-center lg:text-left"
        >
          <div className="eyebrow-line mx-auto mb-8 max-w-[280px] lg:mx-0">
            Studio · Early access
          </div>
          <h1 className="font-serif text-[clamp(32px,6vw,48px)] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
            Your voice.
            <br />
            <span className="font-normal italic text-accent">Perfectly expressed.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[380px] text-[15px] leading-[1.75] text-muted lg:mx-0">
            Speak for 60 seconds. Get polished writing in your voice — with every change explained.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[420px] lg:max-w-none"
        >
          <div className="studio-card-glow relative mb-5 overflow-hidden rounded-[20px] bg-ink px-6 py-5">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                  <span className="mode-pip-glow h-1 w-1 rounded-full bg-accent-2" />
                  Ready · Sign in
                </span>
                <span className="font-serif text-lg text-white/80">0:00</span>
              </div>
              <div className="mb-3 flex h-10 items-center justify-center gap-[3px]">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="auth-wb"
                    style={{ ['--mh' as string]: `${h}px`, ['--d' as string]: `${0.55 + (i % 5) * 0.1}s`, ['--dl' as string]: `${i * 0.06}s` }}
                  />
                ))}
              </div>
              <p className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-white/30">
                Tap to record when signed in
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-faint-2/80 bg-[#faf7f2]/90 p-7 shadow-[0_20px_60px_rgba(28,24,20,.06)] backdrop-blur-md md:p-8">
            <p className="mb-5 text-center text-sm leading-relaxed text-muted">
              One click — you&apos;ll return here signed in. No email link to open.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || submitting}
              className={cn(
                'flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-faint-2 bg-paper py-3.5',
                'text-[14px] font-semibold text-ink transition-all duration-300 ease-out',
                'hover:-translate-y-px hover:border-ink/15 hover:shadow-[0_10px_32px_rgba(28,24,20,.08)]',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
              )}
            >
              <GoogleIcon />
              {submitting ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>

            {errorMsg && (
              <p className="mt-4 text-center text-[13px] leading-relaxed text-accent">{errorMsg}</p>
            )}
            {infoMsg && !errorMsg && (
              <p className="mt-4 text-center text-[13px] leading-relaxed text-muted">{infoMsg}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
