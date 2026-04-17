"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";

/* ─── Web Audio Engine — 2 canais adaptativos ──────────────────────────
   Canal A: Acompanhamento (volume estável)
   Canal B: Teclado do aluno (volume adaptativo 0.2 ↔ 1.0)
   ────────────────────────────────────────────────────────────────────── */

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface AudioEngineReturn {
  init: () => Promise<void>;
  resume: () => Promise<void>;
  suspend: () => Promise<void>;
  getCurrentTime: () => number;
  scheduleAccompaniment: (midi: number, startTime: number, duration: number, velocity?: number) => void;
  playStudent: (midi: number, duration: number, velocity?: number) => void;
  playTick: (velocity?: number) => void;
  rewardHit: () => void;
  penaltyMiss: () => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

export function useAudioEngine(): AudioEngineReturn {
  const ctxRef = useRef<AudioContext | null>(null);
  const channelAGain = useRef<GainNode | null>(null);
  const channelBGain = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const isInitRef = useRef(false);

  const init = useCallback(async () => {
    if (ctxRef.current && isInitRef.current) {
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      return;
    }

    if (ctxRef.current?.state === "closed") {
      ctxRef.current = null;
      isInitRef.current = false;
    }

    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 44100 });
      ctxRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;
      compressor.connect(ctx.destination);
      compressorRef.current = compressor;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(compressor);
      masterGainRef.current = masterGain;

      const gainA = ctx.createGain();
      gainA.gain.value = 0.5; // Accompaniment
      gainA.connect(masterGain);
      channelAGain.current = gainA;

      const gainB = ctx.createGain();
      gainB.gain.value = 0.4; // Student keys
      gainB.connect(masterGain);
      channelBGain.current = gainB;

      isInitRef.current = true;
      console.log("[AudioEngine] Full Restore: Initialized.", ctx.state);
    } catch (err) {
      console.warn("[AudioEngine] Web Audio API not available:", err);
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return ctxRef.current?.currentTime || 0;
  }, []);

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

      if (ctx.state === "suspended" || ctx.state === "interrupted") {
        ctx.resume();
      }

      const freq = midiToFreq(midi);
      const now = Math.max(startTime, ctx.currentTime);
      const noteVol = velocity * 0.35;
      const releaseTime = Math.min(duration, 2.5);

      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);

      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 0.5, now);

      const env1 = ctx.createGain();
      env1.gain.setValueAtTime(0, now);
      env1.gain.linearRampToValueAtTime(noteVol, now + 0.008);
      env1.gain.exponentialRampToValueAtTime(noteVol * 0.45, now + 0.12);
      env1.gain.exponentialRampToValueAtTime(0.001, now + releaseTime + 0.4);

      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0, now);
      env2.gain.linearRampToValueAtTime(noteVol * 0.2, now + 0.005);
      env2.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.5);

      const env3 = ctx.createGain();
      env3.gain.setValueAtTime(0, now);
      env3.gain.linearRampToValueAtTime(noteVol * 0.12, now + 0.02);
      env3.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.8);

      osc1.connect(env1);
      osc2.connect(env2);
      osc3.connect(env3);
      env1.connect(destinationGain);
      env2.connect(destinationGain);
      env3.connect(destinationGain);

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

  const scheduleAccompaniment = useCallback(
    (midi: number, startTime: number, duration: number, velocity = 0.6) => {
      playNote(midi, startTime, duration, channelAGain.current, velocity);
    },
    [playNote]
  );

  const playStudent = useCallback(
    (midi: number, duration: number, velocity = 0.8) => {
      // Students play on channel B
      playNote(midi, 0, duration, channelBGain.current, velocity);
    },
    [playNote]
  );

  const playTick = useCallback(
    (velocity = 0.15) => {
      const ctx = ctxRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.015);

      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(velocity, now + 0.001);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(env);
      env.connect(master);

      osc.start(now);
      osc.stop(now + 0.04);
    },
    []
  );

  const rewardHit = useCallback(() => {}, []);
  const penaltyMiss = useCallback(() => {}, []);

  const setVolume = useCallback((volume: number) => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime + 0.1);
  }, []);

  const destroy = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close();
    }
    ctxRef.current = null;
    channelAGain.current = null;
    channelBGain.current = null;
    masterGainRef.current = null;
    compressorRef.current = null;
    isInitRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  const resume = useCallback(async () => {
    if (!ctxRef.current || !isInitRef.current) {
      await init();
      return;
    }
    const ctx = ctxRef.current;
    if (ctx && (ctx.state === "suspended" || ctx.state === "interrupted")) {
      await ctx.resume();
    }
  }, [init]);

  const suspend = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state === "closed") {
      return;
    }

    if (ctx.state === "running") {
      await ctx.suspend();
    }
  }, []);

  const engine = useMemo(() => ({
    init,
    resume,
    suspend,
    getCurrentTime,
    scheduleAccompaniment,
    playStudent,
    playTick,
    rewardHit,
    penaltyMiss,
    setVolume,
    destroy,
  }), [init, resume, suspend, getCurrentTime, scheduleAccompaniment, playStudent, playTick, rewardHit, penaltyMiss, setVolume, destroy]);

  return engine;
}
