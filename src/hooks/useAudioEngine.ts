"use client";

import { useRef, useCallback, useEffect } from "react";

/* ──────────────────────────────────────────────────────
   Web Audio Engine — 2 canais adaptativos
   Canal A: Acompanhamento (volume estável 0.3)
   Canal B: Teclado do aluno (volume adaptativo 0.2 ↔ 1.0)
   ────────────────────────────────────────────────────── */

// MIDI note → frequency (A4 = 440Hz, equal temperament)
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface AudioEngineReturn {
  /** Initialize the audio context (must call on user gesture) */
  init: () => void;
  /** Get current audio context time in seconds */
  getCurrentTime: () => number;
  /** Play an accompaniment note at a specific absolute time in the future */
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
  const channelAGain = useRef<GainNode | null>(null); // accompaniment master
  const channelBGain = useRef<GainNode | null>(null); // student master
  const isInitRef = useRef(false);

  const init = useCallback(() => {
    if (isInitRef.current) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      // Channel A — Accompaniment (stable volume)
      const gainA = ctx.createGain();
      gainA.gain.value = 0.25;
      gainA.connect(ctx.destination);
      channelAGain.current = gainA;

      // Channel B — Student (adaptive volume)
      const gainB = ctx.createGain();
      gainB.gain.value = 0.6;
      gainB.connect(ctx.destination);
      channelBGain.current = gainB;

      isInitRef.current = true;
    } catch {
      console.warn("Web Audio API not available");
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return ctxRef.current?.currentTime || 0;
  }, []);

  /**
   * Play a piano-like tone using OscillatorNode + GainNode envelope (ADSR-ish)
   */
  const playNote = useCallback(
    (
      midi: number,
      startTime: number,
      duration: number,
      destinationGain: GainNode | null,
      velocity = 0.8
    ) => {
      const ctx = ctxRef.current;
      if (!ctx || !destinationGain) return;

      const freq = midiToFreq(midi);
      // Safety bound: don't schedule notes in the past
      const now = Math.max(startTime, ctx.currentTime);
      const noteVol = velocity * 0.4; // scale down to avoid clipping

      // Fundamental oscillator (triangle = warmer than sine, less harsh than square)
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      // Second harmonic for richness
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);

      // Envelope gain node
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, now);
      // Attack
      envelope.gain.linearRampToValueAtTime(noteVol, now + 0.015);
      // Decay → sustain
      envelope.gain.exponentialRampToValueAtTime(noteVol * 0.5, now + 0.15);
      
      // Release
      const releaseTime = Math.min(duration, 2);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + releaseTime + 0.3);

      // Second harmonic envelope (softer)
      const envelope2 = ctx.createGain();
      envelope2.gain.setValueAtTime(0, now);
      envelope2.gain.linearRampToValueAtTime(noteVol * 0.15, now + 0.01);
      envelope2.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.6);

      // Wiring
      osc.connect(envelope);
      osc2.connect(envelope2);
      envelope.connect(destinationGain);
      envelope2.connect(destinationGain);

      osc.start(now);
      osc2.start(now);
      
      // Stop oscillators slightly after full release to clear memory
      osc.stop(now + releaseTime + 0.5);
      osc2.stop(now + releaseTime + 0.5);
    },
    []
  );

  const scheduleAccompaniment = useCallback(
    (midi: number, startTime: number, duration: number, velocity = 0.6) => {
      playNote(midi, startTime, duration, channelAGain.current, velocity);
    },
    [playNote]
  );

  const playStudent = useCallback(
    (midi: number, duration: number, velocity = 0.9) => {
      if (!ctxRef.current) return;
      playNote(midi, ctxRef.current.currentTime, duration, channelBGain.current, velocity);
    },
    [playNote]
  );

  /** Acerto → volume do Canal B sobe para 1.0 */
  const rewardHit = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = channelBGain.current;
    if (!ctx || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.1);
  }, []);

  /** Erro → volume do Canal B desce para 0.2 */
  const penaltyMiss = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = channelBGain.current;
    if (!ctx || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5);
  }, []);

  const destroy = useCallback(() => {
    ctxRef.current?.close();
    ctxRef.current = null;
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
