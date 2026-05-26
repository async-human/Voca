'use client';

import { motion } from 'framer-motion';
import { useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

interface AuthGateProps {
  onSignInWithGoogle: () => Promise<void>;
  message: string;
  loading: boolean;
}

const WAVE = [10, 18, 26, 14, 22, 30, 12, 24, 16, 28, 11, 20];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="shrink-0">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c3.42-3.15 5.384-7.785 5.384-13.315z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
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
  const showAlert = Boolean(errorMsg || (message && !loading && message !== 'Loading…'));

  return (
    <div className="studio-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-14">
      {/* Ambient layers */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[70vh]"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% -5%, rgba(191,59,42,0.11) 0%, transparent 68%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 top-1/3 z-0 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(42,122,114,0.18) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-16 bottom-1/4 z-0 h-72 w-72 rounded-full opacity-35 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(191,59,42,0.14) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <a href="/" className="mb-8 flex items-center justify-center gap-1.5 no-underline">
          <span className="font-serif text-[26px] font-bold tracking-[-0.03em] text-ink">Vokal</span>
          <span className="mode-pip-glow mb-1 h-[6px] w-[6px] rounded-full bg-accent" />
        </a>

        {/* Card shell — layered border + glow */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-px rounded-[28px] opacity-60"
            style={{
              background:
                'linear-gradient(145deg, rgba(191,59,42,0.35) 0%, rgba(221,213,202,0.5) 40%, rgba(42,122,114,0.2) 100%)',
            }}
          />
          <div className="relative overflow-hidden rounded-[27px] border border-white/60 bg-[#fdfaf6]/95 shadow-[0_24px_80px_rgba(28,24,20,0.1),0_4px_16px_rgba(28,24,20,0.04)] backdrop-blur-2xl">
            {/* Top accent strip with live waveform */}
            <div className="relative border-b border-faint-2/50 bg-gradient-to-b from-white/90 to-paper/30 px-8 pb-5 pt-7">
              <div className="mb-4 flex h-9 items-end justify-center gap-[3px]">
                {WAVE.map((h, i) => (
                  <span
                    key={i}
                    className="auth-wb w-[3px] rounded-full"
                    style={
                      {
                        ['--mh' as string]: `${h}px`,
                        ['--d' as string]: `${0.5 + (i % 4) * 0.12}s`,
                        ['--dl' as string]: `${i * 0.05}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
              <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                Studio · Voice to polished writing
              </p>
            </div>

            <div className="px-8 py-8">
              <div className="mb-7 text-center">
                <h1 className="font-serif text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">
                  Your voice.
                  <br />
                  <span className="italic text-accent">Perfectly expressed.</span>
                </h1>
                <p className="mx-auto mt-3.5 max-w-[300px] text-[14px] leading-[1.7] text-muted">
                  Speak for 60 seconds. Get polished writing in your voice — with every change explained.
                </p>
              </div>

              <div className="eyebrow-line mb-6">Continue with Google</div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className={cn(
                  'group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full',
                  'border border-faint-2 bg-white px-6 py-4 text-[14px] font-semibold text-ink',
                  'shadow-[0_2px_12px_rgba(28,24,20,0.06)] transition-all duration-300',
                  'hover:-translate-y-0.5 hover:border-ink/10 hover:shadow-[0_12px_36px_rgba(28,24,20,0.12)]',
                  'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0',
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(191,59,42,0.04) 50%, transparent 100%)',
                  }}
                />
                {submitting ? (
                  <span className="relative flex items-center gap-2.5">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-faint-2 border-t-accent" />
                    Opening Google…
                  </span>
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="relative">Sign in with Google</span>
                  </>
                )}
              </button>

              {showAlert && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'mt-4 text-center text-[12px] leading-relaxed',
                    errorMsg ? 'text-accent' : 'text-muted',
                  )}
                >
                  {errorMsg || message}
                </motion.p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">
          Secure sign-in · Your audio stays private
        </p>
      </motion.div>
    </div>
  );
}
