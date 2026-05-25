'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/cn';

interface AuthGateProps {
  onSignIn: (email: string) => Promise<void>;
  message: string;
  loading: boolean;
}

const WAVE_HEIGHTS = [12, 20, 28, 16, 24, 14, 22, 30, 10, 26, 18, 32, 14, 24, 20];

export function AuthGate({ onSignIn, message, loading }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [localMsg, setLocalMsg] = useState('');
  const [sentTo, setSentTo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setLocalMsg('Enter your email address.');
      return;
    }
    setSubmitting(true);
    setStatus('idle');
    setLocalMsg('');
    try {
      await onSignIn(trimmed);
      setSentTo(trimmed);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setLocalMsg(err instanceof Error ? err.message : 'Could not send link.');
    } finally {
      setSubmitting(false);
    }
  }

  const errorMsg = status === 'error' ? localMsg : '';
  const infoMsg = status === 'idle' && !errorMsg ? message : '';

  return (
    <div className="studio-bg relative z-[1] px-5 pb-16 pt-[108px] md:px-8">
      <div className="relative z-10 mx-auto grid max-w-[980px] items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        {/* Copy */}
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

        {/* Form + preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[420px] lg:max-w-none"
        >
          {/* Dark preview card */}
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
                  Ready · Email
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

          {/* Form card */}
          <div className="rounded-[22px] border border-faint-2/80 bg-[#faf7f2]/90 p-7 shadow-[0_20px_60px_rgba(28,24,20,.06)] backdrop-blur-md md:p-8">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-2 text-center"
                >
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-faint-2 bg-paper">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                      <path d="M4 9.5l3.5 3.5 6.5-7" stroke="#2A7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="font-serif text-xl font-bold tracking-tight text-ink">Check your inbox</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    We sent a sign-in link to{' '}
                    <span className="font-medium text-ink-2">{sentTo}</span>
                  </p>
                  <p className="mt-1 text-xs text-faint">Check spam if it doesn&apos;t arrive in a minute.</p>
                  <button
                    type="button"
                    onClick={() => { setStatus('idle'); setLocalMsg(''); }}
                    className="mt-6 cursor-pointer text-[13px] font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    Use a different email
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="email" className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    disabled={loading || submitting}
                    className={cn(
                      'studio-input mb-5 w-full rounded-[14px] border border-faint-2 bg-[#faf7f2] px-4 py-[14px]',
                      'text-[15px] text-ink outline-none transition-all duration-200',
                      'placeholder:text-faint/80',
                      'focus:border-ink/20 focus:ring-2 focus:ring-ink/5',
                      'disabled:opacity-50',
                    )}
                  />
                  <button
                    type="submit"
                    disabled={loading || submitting}
                    className={cn(
                      'w-full cursor-pointer rounded-full bg-ink py-3.5 text-[14px] font-semibold text-paper',
                      'transition-all duration-300 ease-out',
                      'hover:-translate-y-px hover:bg-accent hover:shadow-[0_10px_32px_rgba(191,59,42,.22)]',
                      'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
                    )}
                  >
                    {submitting ? 'Sending…' : 'Send magic link →'}
                  </button>

                  {errorMsg && (
                    <p className="mt-4 text-center text-[13px] leading-relaxed text-accent">{errorMsg}</p>
                  )}
                  {infoMsg && !errorMsg && (
                    <p className="mt-4 text-center text-[13px] leading-relaxed text-muted">{infoMsg}</p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
