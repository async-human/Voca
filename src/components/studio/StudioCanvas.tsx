'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { getSession, processVoice, regenerateSession } from '@/lib/api';
import { formatMeta, type OutputFormat, type PipelineStep } from '@/lib/constants';
import type { SessionResult } from '@/lib/types';
import { useRecorder } from '@/hooks/useRecorder';
import { FormatPicker, FormatPickerMotion } from './FormatPicker';
import { PipelineProgress } from './PipelineProgress';
import { ResultPanel } from './ResultPanel';
import { Waveform } from './Waveform';

interface StudioCanvasProps {
  accessToken: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function StudioCanvas({ accessToken }: StudioCanvasProps) {
  const [format, setFormat] = useState<OutputFormat>('email');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [result, setResult] = useState<SessionResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setPhaseRef = useRef<(phase: 'idle' | 'recording' | 'processing') => void>(() => {});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const finishProcessing = useCallback(() => {
    setPipelineStep(null);
    setPhaseRef.current('idle');
  }, []);

  const pollSession = useCallback(
    (id: string) => {
      const poll = async () => {
        try {
          const data = await getSession(accessToken, id);
          if (data.pipeline_step && data.pipeline_step !== 'failed') {
            setPipelineStep(data.pipeline_step);
          }
          if (data.status === 'complete') {
            setResult(data);
            finishProcessing();
            return;
          }
          if (data.status === 'failed') {
            setError(data.error_message || 'Processing failed');
            finishProcessing();
            return;
          }
          pollRef.current = setTimeout(poll, 1200);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load session');
          finishProcessing();
        }
      };
      poll();
    },
    [accessToken, finishProcessing],
  );

  const onRecordingComplete = useCallback(
    async (blob: Blob, durationMs: number) => {
      setError('');
      setResult(null);
      setPipelineStep('transcribing');
      try {
        const { session_id } = await processVoice(accessToken, blob, format, durationMs);
        sessionIdRef.current = session_id;
        pollSession(session_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        finishProcessing();
      }
    },
    [accessToken, format, pollSession, finishProcessing],
  );

  const recorder = useRecorder({ onComplete: onRecordingComplete });

  useEffect(() => {
    setPhaseRef.current = recorder.setPhase;
  }, [recorder.setPhase]);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  const modeLabel = formatMeta(format);
  const isRecording = recorder.phase === 'recording';
  const isProcessing = recorder.phase === 'processing' || pipelineStep !== null;

  async function handleRecordClick() {
    if (isProcessing) return;
    if (isRecording) {
      recorder.stopRecording();
      return;
    }
    setError('');
    setResult(null);
    setPipelineStep(null);
    try {
      await recorder.startRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start recording');
    }
  }

  function handleNew() {
    if (pollRef.current) clearTimeout(pollRef.current);
    setResult(null);
    setPipelineStep(null);
    setError('');
    recorder.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCopy() {
    const text = result?.generation?.output_text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      showToast('Copy failed');
    }
  }

  async function handleRegenerate(nextFormat: OutputFormat) {
    const id = sessionIdRef.current;
    if (!id) return;
    setRegenerating(true);
    showToast('Regenerating…');
    try {
      await regenerateSession(accessToken, id, nextFormat);
      const data = await getSession(accessToken, id);
      setResult(data);
      showToast('Updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regenerate failed');
    } finally {
      setRegenerating(false);
    }
  }

  const hint = isRecording ? 'Tap to stop' : isProcessing ? 'Processing…' : 'Tap to record';

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(28,24,20,.038) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1040px] px-4 pb-20 pt-[100px] md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-serif text-[clamp(24px,4vw,32px)] font-bold tracking-tight">Studio</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Speak naturally for up to 60 seconds. Vokal handles structure, tone, and clarity.
          </p>
        </motion.div>

        <div className="grid items-start gap-5 lg:grid-cols-[220px_1fr]">
          <FormatPickerMotion value={format} onChange={setFormat} disabled={isRecording || isProcessing} />

          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="studio-card-glow relative overflow-hidden rounded-[24px] bg-ink px-6 py-8 md:px-8 md:py-9"
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-[24px] opacity-55"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative z-10">
                <div className="mb-5 hidden md:block">
                  <FormatPicker
                    variant="inline"
                    value={format}
                    onChange={setFormat}
                    disabled={isRecording || isProcessing}
                  />
                </div>

                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
                    <span className={cn('mode-pip-glow h-[5px] w-[5px] rounded-full bg-accent-2', isRecording && 'bg-red-400')} />
                    {(isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Ready')} · {modeLabel.name}
                  </div>
                  <div className={cn('font-serif text-[32px] tracking-wide text-white/92 transition-colors', isRecording && 'text-accent-2')}>
                    {formatTime(recorder.seconds)}
                  </div>
                </div>

                <Waveform levels={recorder.levels} live={isRecording} />

                <div className="flex flex-col items-center gap-3.5">
                  <button
                    type="button"
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    disabled={isProcessing}
                    onClick={handleRecordClick}
                    className={cn(
                      'flex h-[72px] w-[72px] cursor-pointer items-center justify-center rounded-full border-none',
                      'bg-gradient-to-br from-accent-2 to-accent shadow-[0_8px_32px_rgba(191,59,42,.4),inset_0_0_0_1px_rgba(255,255,255,.12)]',
                      'transition-transform hover:scale-105 active:scale-[0.98]',
                      isRecording && 'rec-pulse',
                      isProcessing && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {isRecording ? (
                      <span className="block h-4 w-4 rounded-[3px] bg-white" />
                    ) : (
                      <span className="block h-4 w-4 rounded-full bg-white" />
                    )}
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">{hint}</span>
                </div>

                <AnimatePresence>{pipelineStep && <PipelineProgress current={pipelineStep} />}</AnimatePresence>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-[14px] border border-accent/15 bg-accent/8 px-[18px] py-3.5 text-sm leading-relaxed text-accent-2"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                <ResultPanel
                  data={result}
                  onCopy={handleCopy}
                  onNew={handleNew}
                  onRegenerate={handleRegenerate}
                  regenerating={regenerating}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'fixed bottom-7 left-1/2 z-[300] -translate-x-1/2 rounded-full bg-ink px-[22px] py-2.5 text-[13px] font-medium text-paper shadow-[0_12px_40px_rgba(28,24,20,.2)] transition-all duration-300',
          toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0',
        )}
      >
        {toast}
      </div>
    </>
  );
}
