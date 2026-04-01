"use client";

import { useRef, useCallback, useEffect } from "react";

/* ──────────────────────────────────────────────────────
   Web Audio Engine — 2 canais adaptativos
   Canal A: Acompanhamento (volume estável)
   Canal B: Teclado do aluno (volume adaptativo 0.2 ↔ 1.0)

   Síntese FM com 3 osciladores + ADSR envelope para
   um timbre quente parecido com piano Rhodes/Electric.
   ────────────────────────────────────────────────────── */

// MIDI note → frequency (A4 = 440Hz, equal temperament)
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface AudioEngineReturn {
  /** Initialize the audio context (must call on user gesture) */
  init: () => Promise<void>;
  /** Get current audio context time in seconds */
  getCurrentTime: () => number;
  /** Schedule an accompaniment note at a specific absolute time */
  scheduleAccompaniment: (midi: number, startTime: number, duration: number, velocity?: number) => void;
  /** Play a note on Channel B (student) immediately */
  playStudent: (midi: number, duration: number, velocity?: number) => void;
  /** Reward: ramp Channel B volume to max */
  rewardHit: () => void;
  /** Penalty: fade Channel B volume down */
  penaltyMiss: () => void;
  /** Clean up */
  destroy: () => void;
}

export function useAudioEngine(): AudioEngineReturn {
  const ctxRef = useRef<AudioContext | null>(null);
  const channelAGain = useRef<GainNode | null>(null);
  const channelBGain = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const isInitRef = useRef(false);

  // ── Init: creates or resumes AudioContext ─────────
  const init = useCallback(async () => {
    // If already initialized and running, just resume if suspended
    if (ctxRef.current && isInitRef.current) {
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      return;
    }

    // If we had a destroyed context, allow re-init
    if (ctxRef.current?.state === "closed") {
      ctxRef.current = null;
      isInitRef.current = false;
    }

    try {
      const ctx = new AudioContext({ sampleRate: 44100 });
      ctxRef.current = ctx;

      // CRITICAL: Resume on user gesture (Chrome/Safari Autoplay Policy)
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Master compressor to avoid clipping with many simultaneous notes
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;
      compressor.connect(ctx.destination);
      compressorRef.current = compressor;

      // Channel A — Accompaniment (stable volume)
      const gainA = ctx.createGain();
      gainA.gain.value = 0.3;
      gainA.connect(compressor);
      channelAGain.current = gainA;

      // Channel B — Student (adaptive volume)
      const gainB = ctx.createGain();
      gainB.gain.value = 0.7;
      gainB.connect(compressor);
      channelBGain.current = gainB;

      isInitRef.current = true;
      console.log("[AudioEngine] Initialized. State:", ctx.state, "SampleRate:", ctx.sampleRate);
    } catch (err) {
      console.warn("[AudioEngine] Web Audio API not available:", err);
    }
  }, []);

  // ── Get current audio time ────────────────────────
  const getCurrentTime = useCallback(() => {
    return ctxRef.current?.currentTime || 0;
  }, []);

  // ── Play a piano-like tone (FM Synthesis + ADSR) ──
  const playNote = useCallback(
    (
      midi: number,
      startTime: number,
      duration: number,
      destinationGain: GainNode | null,
      velocity = 0.8
    ) => {
      const ctx = ctxRef.current;
      if (!ctx || ctx.state === "closed" || !destinationGain) return;

      // Resume if suspended (safety net)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const freq = midiToFreq(midi);
      const now = Math.max(startTime, ctx.currentTime);
      const noteVol = velocity * 0.35;
      const releaseTime = Math.min(duration, 2.5);

      // ── Oscillator 1: Fundamental (Triangle = warm) ──
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      // ── Oscillator 2: 2nd Harmonic (Sine, soft) ──
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);

      // ── Oscillator 3: Sub-octave body (Sine, very soft) ──
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 0.5, now);

      // ── Envelope 1 (Fundamental) ──
      const env1 = ctx.createGain();
      env1.gain.setValueAtTime(0, now);
      env1.gain.linearRampToValueAtTime(noteVol, now + 0.008);           // Fast attack
      env1.gain.exponentialRampToValueAtTime(noteVol * 0.45, now + 0.12); // Decay to sustain
      env1.gain.exponentialRampToValueAtTime(0.001, now + releaseTime + 0.4); // Release

      // ── Envelope 2 (2nd Harmonic — brighter attack) ──
      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0, now);
      env2.gain.linearRampToValueAtTime(noteVol * 0.2, now + 0.005);
      env2.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.5);

      // ── Envelope 3 (Sub-octave — warmth body) ──
      const env3 = ctx.createGain();
      env3.gain.setValueAtTime(0, now);
      env3.gain.linearRampToValueAtTime(noteVol * 0.12, now + 0.02);
      env3.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.8);

      // ── Wire everything ──
      osc1.connect(env1);
      osc2.connect(env2);
      osc3.connect(env3);
      env1.connect(destinationGain);
      env2.connect(destinationGain);
      env3.connect(destinationGain);

      // ── Start & stop ──
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      const stopAt = now + releaseTime + 0.6;
      osc1.stop(stopAt);
      osc2.stop(stopAt);
      osc3.stop(stopAt);
    },
    []
  );

  // ── Public API ────────────────────────────────────

  const scheduleAccompaniment = useCallback(
    (midi: number, startTime: number, duration: number, velocity = 0.6) => {
      playNote(midi, startTime, duration, channelAGain.current, velocity);
    },
    [playNote]
  );

  const playStudent = useCallback(
    (midi: number, duration: number, velocity = 0.9) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      playNote(midi, ctx.currentTime, duration, channelBGain.current, velocity);
    },
    [playNote]
  );

  /** Acerto → volume do Canal B sobe para 1.0 */
  const rewardHit = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = channelBGain.current;
    if (!ctx || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.08);
  }, []);

  /** Erro → volume do Canal B desce para 0.2 */
  const penaltyMiss = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = channelBGain.current;
    if (!ctx || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.4);
  }, []);

  const destroy = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close();
    }
    ctxRef.current = null;
    channelAGain.current = null;
    channelBGain.current = null;
    compressorRef.current = null;
    isInitRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    init,
    getCurrentTime,
    scheduleAccompaniment,
    playStudent,
    rewardHit,
    penaltyMiss,
    destroy,
  };
}
