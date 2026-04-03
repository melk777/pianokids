"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PitchDetector } from "pitchy";

export interface AudioNote {
  note: number;      // MIDI note number
  name: string;      // e.g. "C4"
  frequency: number;
  clarity: number;
  volume: number;
  timestamp: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNote(frequency: number): { note: number; name: string } {
  const n = Math.round(12 * Math.log2(frequency / 440) + 69);
  const name = NOTE_NAMES[n % 12];
  const octave = Math.floor(n / 12) - 1;
  return { note: n, name: `${name}${octave}` };
}

export function useAudioInput() {
  const [isListening, setIsListening] = useState(false);
  const [activeAudioNote, setActiveAudioNote] = useState<AudioNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    setIsListening(false);
    setActiveAudioNote(null);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.warn("Erro ao fechar AudioContext:", e));
        }
    }
  }, []);

  const start = useCallback(async () => {
    try {
      // 1. Solicitar microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Setup AudioContext
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();

      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // 3. Setup Pitchy
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const input = new Float32Array(detector.inputLength);

      setIsListening(true);
      setError(null);

      const updatePitch = () => {
        if (!analyserRef.current || !audioContext) return;
        
        analyserRef.current.getFloatTimeDomainData(input);
        
        // Volume (RMS)
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);

        // Pitch
        const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);
        
        // Thresholds (Similares aos do AudioEngine)
        if (rms > 0.01 && clarity > 0.85) {
          const { note, name } = frequencyToNote(pitch);
          setActiveAudioNote({
            note,
            name,
            frequency: pitch,
            clarity,
            volume: rms,
            timestamp: performance.now()
          });
        } else if (rms < 0.005) {
          setActiveAudioNote(null);
        }

        animationFrameRef.current = requestAnimationFrame(updatePitch);
      };

      updatePitch();
    } catch (err) {
      console.error("[USE_AUDIO_INPUT_ERROR]:", err);
      setError(err instanceof Error ? err.message : "Erro ao acessar microfone");
      setIsListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { 
    isListening, 
    activeAudioNote, 
    start, 
    stop, 
    error 
  };
}
