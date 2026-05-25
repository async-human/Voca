'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/cn';

interface AuthGateProps {
  onSignIn: (email: string) => Promise<void>;
  message: string;
  loading: boolean;
}

export function AuthGate({ onSignIn, message, loading }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [localMsg, setLocalMsg] = useState('');

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
    try {
      await onSignIn(trimmed);
      setStatus('success');
      setLocalMsg(`Link sent to ${trimmed}. Check inbox and spam.`);
    } catch (err) {
      setStatus('error');
      setLocalMsg(err instanceof Error ? err.message : 'Could not send link.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayMsg = localMsg || message;
  const msgType = status === 'success' ? 'success' : status === 'error' ? 'error' : 'info';

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] rounded-[28px] border border-faint-2 bg-white/78 p-10 shadow-[0_24px_80px_rgba(28,24,20,.08),inset_0_0_0_1px_rgba(255,255,255,.5)] backdrop-blur-xl md:p-11"
      >
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Studio · Early access</p>
        <h1 className="font-serif text-[clamp(28px,5vw,38px)] font-bold leading-[1.12] tracking-tight">
          Your voice.
          <br />
          <em className="font-normal text-accent not-italic">Perfectly expressed.</em>
        </h1>
        <p className="mt-3 mb-7 text-[15px] leading-relaxed text-muted">
          Sign in to record, polish, and send — in your voice, with every change explained.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="mb-2.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
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
            className="mb-4 w-full rounded-[14px] border border-faint-2 bg-paper px-[18px] py-[15px] text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent/35 focus:shadow-[0_0_0_4px_rgba(191,59,42,.08)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full cursor-pointer rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-all hover:-translate-y-px hover:bg-accent hover:shadow-[0_8px_28px_rgba(191,59,42,.28)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Sending…' : 'Send magic link →'}
          </button>
        </form>
        {displayMsg && (
          <p
            className={cn(
              'mt-4 text-sm leading-relaxed',
              msgType === 'success' && 'rounded-xl bg-teal/10 px-4 py-3 text-teal',
              msgType === 'error' && 'rounded-xl bg-accent/8 px-4 py-3 text-accent-2',
              msgType === 'info' && 'text-muted',
            )}
          >
            {displayMsg}
          </p>
        )}
      </motion.div>
    </div>
  );
}
