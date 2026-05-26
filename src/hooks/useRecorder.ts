'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderPhase = 'idle' | 'recording' | 'processing';

interface UseRecorderOptions {
  maxSeconds?: number;
  onComplete: (blob: Blob, durationMs: number) => void;
}

export function useRecorder({ maxSeconds = 60, onComplete }: UseRecorderOptions) {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(32).fill(0.08));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const secondsRef = useRef(0);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => {});
    analyserRef.current = null;
    audioCtxRef.current = null;
  }, []);

  const tickLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const bars = 32;
    const step = Math.floor(data.length / bars);
    const next = Array.from({ length: bars }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += data[i * step + j];
      return Math.max(0.06, Math.min(1, (sum / step / 255) * 1.8));
    });
    setLevels(next);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, []);

  const stopRecording = useCallback(() => {
    if (phase !== 'recording') return;
    if (timerRef.current) clearInterval(timerRef.current);
    stopAnalyser();
    setPhase('processing');

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [phase, stopAnalyser]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const preferred = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ];
      const mime = preferred.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blobType = recorder.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        onComplete(blob, secondsRef.current * 1000);
      };

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(tickLevels);

      recorder.start(250);
      secondsRef.current = 0;
      setSeconds(0);
      setPhase('recording');

      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= maxSeconds) stopRecording();
      }, 1000);
    } catch {
      setPhase('idle');
      throw new Error('Microphone access required. Allow mic in browser settings.');
    }
  }, [maxSeconds, onComplete, stopRecording, tickLevels]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopAnalyser();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    secondsRef.current = 0;
    setSeconds(0);
    setPhase('idle');
    setLevels(Array(32).fill(0.08));
  }, [stopAnalyser]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopAnalyser();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [stopAnalyser]);

  return {
    phase,
    seconds,
    levels,
    startRecording,
    stopRecording,
    reset,
    setPhase,
  };
}
