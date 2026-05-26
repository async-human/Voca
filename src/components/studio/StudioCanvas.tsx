'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { getSession, processVoice, regenerateSession, deliverSession } from '@/lib/api';
import { formatMeta, type OutputFormat, type PipelineStep } from '@/lib/constants';
import type { DeliveryDestination } from '@/lib/delivery';
import type { SessionResult } from '@/lib/types';
import { useConnections } from '@/hooks/useConnections';
import { useRecorder } from '@/hooks/useRecorder';
import { DestinationPicker, destinationSummary } from './DestinationPicker';
import { FormatPicker, FORMAT_TIPS } from './FormatPicker';
import { PipelineProgress } from './PipelineProgress';
import { RecordButton } from './RecordButton';
import { ResultPanel } from './ResultPanel';
import { StudioSteps, getStudioPhase } from './StudioSteps';
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
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [deliveryDestination, setDeliveryDestination] = useState<DeliveryDestination | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [editedOutput, setEditedOutput] = useState('');
  const sessionIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setPhaseRef = useRef<(phase: 'idle' | 'recording' | 'processing') => void>(() => {});

  const { connections } = useConnections(accessToken);

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
            setEditedOutput(data.generation?.output_text ?? '');
            setDelivered(false);
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
      setCopied(false);
      setDelivered(false);
      setEditedOutput('');
      setPipelineStep('transcribing');
      if (blob.size < 1000) {
        setError('Recording was empty. Hold the mic button, speak for a few seconds, then tap again to finish.');
        finishProcessing();
        return;
      }
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
  const phase = getStudioPhase(isRecording, isProcessing, !!result);

  async function handleRecordClick() {
    if (isProcessing) return;
    if (isRecording) {
      recorder.stopRecording();
      return;
    }
    setError('');
    setResult(null);
    setCopied(false);
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
    setCopied(false);
    setDelivered(false);
    setEditedOutput('');
    recorder.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCopy() {
    const text = editedOutput || result?.generation?.output_text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Copy failed');
    }
  }

  async function handleRegenerate(nextFormat: OutputFormat) {
    const id = sessionIdRef.current;
    if (!id) return;
    setRegenerating(true);
    setCopied(false);
    try {
      await regenerateSession(accessToken, id, nextFormat);
      const data = await getSession(accessToken, id);
      setResult(data);
      setEditedOutput(data.generation?.output_text ?? '');
      showToast(`Switched to ${formatMeta(nextFormat).name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regenerate failed');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDeliver() {
    const id = sessionIdRef.current;
    if (!id || !deliveryDestination) return;
    if (deliveryDestination.platform === 'gmail' && !deliveryDestination.to?.trim()) {
      setError('Enter a recipient email for Gmail');
      return;
    }

    setDelivering(true);
    setError('');
    try {
      const { connection_id, platform: _p, ...destFields } = deliveryDestination;
      const res = await deliverSession(
        accessToken,
        id,
        connection_id,
        destFields,
        editedOutput || result?.generation?.output_text,
      );
      setDelivered(true);
      showToast(res.message || 'Sent!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setDelivering(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-[680px] px-4 pb-24 pt-[104px] md:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-3.5">
        <h1 className="font-serif text-[clamp(28px,5vw,36px)] font-bold tracking-tight text-ink">
          {phase === 'result' ? 'Done.' : phase === 'processing' ? 'Polishing…' : phase === 'recording' ? 'Listening…' : 'What are you writing?'}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {phase === 'setup' && 'Pick a format, then speak naturally for up to 60 seconds.'}
          {phase === 'recording' && 'Speak like you\'re talking to a colleague. We\'ll handle the rest.'}
          {phase === 'processing' && 'Transcribing, structuring, and refining in your voice.'}
          {phase === 'result' && (deliveryDestination
            ? `Review your draft, then send to ${destinationSummary(deliveryDestination, recipientEmail) ?? 'your destination'}.`
            : 'Review, copy, send to a connected app, or try another format.')}
        </p>
      </motion.div>

      <StudioSteps phase={phase} />

      {/* Format picker — visible in setup & result (to switch before re-record) */}
      <AnimatePresence>
        {(phase === 'setup' || phase === 'result') && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <FormatPicker value={format} onChange={setFormat} variant="light" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main studio card */}
      <motion.div
        layout
        className={cn(
          'studio-card-glow relative overflow-hidden rounded-[26px] border border-white/[0.055] transition-all duration-500',
          phase === 'result' ? 'px-5 py-5 md:px-6 md:py-6' : 'px-6 py-8 md:px-8 md:py-9',
          phase === 'result' && 'opacity-60',
        )}
        style={{ background: 'linear-gradient(160deg, #231D17 0%, #181210 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          {/* Format on dark card during recording/processing */}
          {(phase === 'recording' || phase === 'processing') && (
            <div className="mb-5">
              <FormatPicker value={format} onChange={setFormat} disabled variant="dark" />
            </div>
          )}

          <div className={cn('flex items-center justify-between', phase === 'result' ? 'mb-3' : 'mb-8')}>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.055] px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] text-white/40">
              <span className={cn('mode-pip-glow h-[5px] w-[5px] rounded-full', isRecording ? 'bg-red-400' : 'bg-accent-2')} />
              {(isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Ready')} · {modeLabel.name}
            </div>
            <div className={cn(
              'font-serif tracking-wide text-white/92 transition-all duration-300',
              phase === 'result' ? 'text-xl' : 'text-[32px]',
              isRecording && 'text-accent-2',
            )}>
              {formatTime(recorder.seconds)}
            </div>
          </div>

          {phase !== 'result' && (
            <>
              <Waveform levels={recorder.levels} live={isRecording} />

              <RecordButton
                recording={isRecording}
                processing={isProcessing}
                onClick={handleRecordClick}
              />

              {/* Contextual tip */}
              {phase === 'setup' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 rounded-[14px] border border-white/[0.07] bg-white/[0.035] px-4 py-3.5"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/28">Tip</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/42">{FORMAT_TIPS[format]}</p>
                </motion.div>
              )}

              <AnimatePresence>
                {pipelineStep && <PipelineProgress current={pipelineStep} />}
              </AnimatePresence>
            </>
          )}

          {phase === 'result' && (
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-white/30">
              Recording complete · {formatTime(recorder.seconds || 0)}
            </p>
          )}
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-[14px] border border-accent/15 bg-accent/8 px-4 py-3.5 text-sm leading-relaxed text-accent-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <div className="mt-5">
            <ResultPanel
              data={result}
              format={result.generation?.format ?? format}
              connections={connections}
              outputText={editedOutput}
              onOutputChange={setEditedOutput}
              deliveryDestination={deliveryDestination}
              onDestinationChange={(dest) => {
                setDeliveryDestination(dest);
                setDelivered(false);
              }}
              recipientEmail={recipientEmail}
              onRecipientEmailChange={setRecipientEmail}
              onCopy={handleCopy}
              onNew={handleNew}
              onRegenerate={handleRegenerate}
              onDeliver={deliveryDestination ? handleDeliver : undefined}
              regenerating={regenerating}
              delivering={delivering}
              delivered={delivered}
              copied={copied}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <div
        className={cn(
          'fixed bottom-7 left-1/2 z-[300] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-paper shadow-[0_12px_40px_rgba(28,24,20,.2)] transition-all duration-300',
          toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0',
        )}
      >
        {toast}
      </div>
    </div>
  );
}
