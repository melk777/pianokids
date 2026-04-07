"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Web Audio Engine â€” 2 canais adaptativos
   Canal A: Acompanhamento (volume estÃ¡vel)
   Canal B: Teclado do aluno (volume adaptativo 0.2 â†” 1.0)

   SÃ­ntese FM com 3 osciladores + ADSR envelope para
   um timbre quente parecido com piano Rhodes/Electric.
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// MIDI note â†’ frequency (A4 = 440Hz, equal temperament)
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface AudioEngineReturn {
  /** Initialize the audio context (must call on user gesture) */
  init: () => Promise<void>;
  /** Resume audio context if suspended (mobile safety) */
  resume: () => Promise<void>;
  /** Get current audio context time in seconds */
  getCurrentTime: () => number;
  /** Schedule an accompaniment note at a specific absolute time */
  scheduleAccompaniment: (midi: number, startTime: number, duration: number, velocity?: number) => void;
  /** Play a note on Channel B (student) immediately */
  playStudent: (midi: number, duration: number, velocity?: number) => void;
  /** Play a rhythmic metronome click */
  playTick: (velocity?: number) => void;
  /** Reward: ramp Channel B volume to max */
  rewardHit: () => void;
  /** Penalty: fade Channel B volume down */
  penaltyMiss: () => void;
  /** Set master volume (0.0 to 1.0) */
  setVolume: (volume: number) => void;
  /** Clean up */
  destroy: () => void;
}



export function useAudioEngine(): AudioEngineReturn {
  const ctxRef = useRef<AudioContext | null>(null);
  const channelAGain = useRef<GainNode | null>(null);
  const channelBGain = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  const isInitRef = useRef(false);

  // â”€â”€ Init: creates or resumes AudioContext â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // Master Gain for overall volume control
      const masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(compressor);
      masterGainRef.current = masterGain;

      // Channel A â€” Accompaniment (stable volume)
      const gainA = ctx.createGain();
      gainA.gain.value = 0.0; // Permanently silenced
      gainA.connect(masterGain);
      channelAGain.current = gainA;

      // Channel B â€” Student (adaptive volume)
      const gainB = ctx.createGain();
      gainB.gain.value = 0.0; // Permanently silenced
      gainB.connect(masterGain);
      channelBGain.current = gainB;


      isInitRef.current = true;
      console.log("[AudioEngine] Initialized. State:", ctx.state, "SampleRate:", ctx.sampleRate);
    } catch (err) {
      console.warn("[AudioEngine] Web Audio API not available:", err);
    }
  }, []);

  // â”€â”€ Get current audio time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getCurrentTime = useCallback(() => {
    return ctxRef.current?.currentTime || 0;
  }, []);

  // â”€â”€ Play a piano-like tone (FM Synthesis + ADSR) â”€â”€
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

      // Resume if suspended (Crticial for iOS/Android Safari & Chrome Autoplay)
      if (ctx.state === "suspended" || ctx.state === "interrupted") {
        ctx.resume();
      }

      const freq = midiToFreq(midi);
      const now = Math.max(startTime, ctx.currentTime);
      const noteVol = velocity * 0.35;
      const releaseTime = Math.min(duration, 2.5);

      // â”€â”€ Oscillator 1: Fundamental (Triangle = warm) â”€â”€
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      // â”€â”€ Oscillator 2: 2nd Harmonic (Sine, soft) â”€â”€
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);

      // â”€â”€ Oscillator 3: Sub-octave body (Sine, very soft) â”€â”€
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 0.5, now);

      // â”€â”€ Envelope 1 (Fundamental) â”€â”€
      const env1 = ctx.createGain();
      env1.gain.setValueAtTime(0, now);
      env1.gain.linearRampToValueAtTime(noteVol, now + 0.008);           // Fast attack
      env1.gain.exponentialRampToValueAtTime(noteVol * 0.45, now + 0.12); // Decay to sustain
      env1.gain.exponentialRampToValueAtTime(0.001, now + releaseTime + 0.4); // Release

      // â”€â”€ Envelope 2 (2nd Harmonic â€” brighter attack) â”€â”€
      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0, now);
      env2.gain.linearRampToValueAtTime(noteVol * 0.2, now + 0.005);
      env2.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.5);

      // â”€â”€ Envelope 3 (Sub-octave â€” warmth body) â”€â”€
      const env3 = ctx.createGain();
      env3.gain.setValueAtTime(0, now);
      env3.gain.linearRampToValueAtTime(noteVol * 0.12, now + 0.02);
      env3.gain.exponentialRampToValueAtTime(0.001, now + releaseTime * 0.8);

      // â”€â”€ Wire everything â”€â”€
      osc1.connect(env1);
      osc2.connect(env2);
      osc3.connect(env3);
      env1.connect(destinationGain);
      env2.connect(destinationGain);
      env3.connect(destinationGain);

      // â”€â”€ Start & stop â”€â”€
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

  // â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const scheduleAccompaniment = useCallback(
    (midi: number, startTime: number, duration: number, velocity = 0.6) => {
      playNote(midi, startTime, duration, channelAGain.current, velocity);
    },
    [playNote]
  );

  const playStudent = useCallback(() => {
    // SILENCIADO: Não toca som para evitar interferência no microfone
  }, []);


  /** Play a rhythmic/percussive click (metronome) */
  const playTick = useCallback(
    (velocity = 0.15) => {
      const ctx = ctxRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      // Sharp, dry wood-block-like click
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

  /** Acerto â†’ SILENCIADO */
  const rewardHit = useCallback(() => {
    // Desativado para evitar interferÃªncia no microfone
  }, []);

  /** Erro â†’ SILENCIADO */
  const penaltyMiss = useCallback(() => {
    // Desativado para evitar interferÃªncia no microfone
  }, []);

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
    // Se o contexto nÃ£o existir, inicializa ele (Garante som no 1Âº toque em Mobile)
    if (!ctxRef.current || !isInitRef.current) {
      await init();
      return;
    }
    
    // Se o contexto existir mas estiver suspenso ou interrompido (autoplay policy)
    const ctx = ctxRef.current;
    if (ctx && (ctx.state === "suspended" || ctx.state === "interrupted")) {
      await ctx.resume();
    }
  }, [init]);


  const engine = useMemo(() => ({
    init,
    resume,
    getCurrentTime,
    scheduleAccompaniment,
    playStudent,
    playTick,
    rewardHit,
    penaltyMiss,
    setVolume,
    destroy,
  }), [init, resume, getCurrentTime, scheduleAccompaniment, playStudent, playTick, rewardHit, penaltyMiss, setVolume, destroy]);


  return engine;
}


