"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  readAudioCalibrationProfile,
  type AudioCalibrationProfile,
} from "@/lib/audioCalibration";

export interface AudioNote {
  note: number;
  name: string;
  frequency: number;
  clarity: number;
  volume: number;
  timestamp: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MIN_FREQUENCY = 65.4; // C2
const MAX_FREQUENCY = 2093; // C7
const MAX_POLYPHONY = 6;
const MIN_SIGNAL_RMS = 0.006;
const SILENCE_RMS = 0.0035;
const DEFAULT_NOTE_HOLD_MS = 140;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function frequencyToMidiFloat(frequency: number) {
  return 69 + 12 * Math.log2(frequency / 440);
}

function frequencyToNote(frequency: number): { note: number; name: string } {
  const note = Math.round(frequencyToMidiFloat(frequency));
  const name = NOTE_NAMES[(note + 1200) % 12];
  const octave = Math.floor(note / 12) - 1;
  return { note, name: `${name}${octave}` };
}

type PeakCandidate = {
  frequency: number;
  note: number;
  name: string;
  clarity: number;
  score: number;
  volume: number;
};

function isHarmonicOfLowerCandidate(candidateFrequency: number, lowerFrequency: number, tolerance = 0.045) {
  const ratio = candidateFrequency / lowerFrequency;
  return [2, 3, 4].some((multiple) => Math.abs(ratio - multiple) <= tolerance * multiple);
}

function getDetuneTolerance(frequency: number) {
  if (frequency < 130) return 0.32;
  if (frequency > 1200) return 0.26;
  return 0.36;
}

function getMinimumDbNormalized(frequency: number) {
  if (frequency < 140) return 0.24;
  if (frequency > 1100) return 0.2;
  return 0.16;
}

function getMinimumScore(frequency: number) {
  if (frequency < 140) return 0.42;
  if (frequency > 1100) return 0.34;
  return 0.28;
}

function detectPolyphonicNotes(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
  rms: number,
  now: number
): AudioNote[] {
  const binWidth = sampleRate / fftSize;
  const minBin = Math.max(2, Math.floor(MIN_FREQUENCY / binWidth));
  const maxBin = Math.min(frequencyData.length - 3, Math.ceil(MAX_FREQUENCY / binWidth));
  const strongestDb = -35;
  const noiseFloorDb = -78;
  const groupedCandidates = new Map<number, PeakCandidate>();

  for (let bin = minBin; bin <= maxBin; bin++) {
    const currentDb = frequencyData[bin];
    if (currentDb < noiseFloorDb) continue;

    const previousDb = frequencyData[bin - 1];
    const nextDb = frequencyData[bin + 1];
    if (currentDb <= previousDb || currentDb < nextDb) continue;

    const frequency = bin * binWidth;
    const midiFloat = frequencyToMidiFloat(frequency);
    const midi = Math.round(midiFloat);
    const detune = Math.abs(midiFloat - midi);
    if (detune > getDetuneTolerance(frequency)) continue;

    const dbNormalized = clamp((currentDb - noiseFloorDb) / (strongestDb - noiseFloorDb), 0, 1);
    if (dbNormalized < getMinimumDbNormalized(frequency)) continue;

    const harmonicSupport = [2, 3].reduce((sum, harmonicMultiplier, index) => {
      const harmonicBin = Math.round(bin * harmonicMultiplier);
      if (harmonicBin >= frequencyData.length) return sum;

      const harmonicDb = frequencyData[harmonicBin];
      const harmonicWeight = index === 0 ? 0.35 : 0.2;
      const harmonicValue = clamp((harmonicDb - noiseFloorDb) / (strongestDb - noiseFloorDb), 0, 1);
      return sum + harmonicValue * harmonicWeight;
    }, 0);

    const score = dbNormalized + harmonicSupport;
    if (score < getMinimumScore(frequency)) continue;
    const { name } = frequencyToNote(frequency);
    const clarity = clamp(score / 1.55, 0, 1);

    const previous = groupedCandidates.get(midi);
    if (!previous || previous.score < score) {
      groupedCandidates.set(midi, {
        frequency,
        note: midi,
        name,
        clarity,
        score,
        volume: rms,
      });
    }
  }

  const ranked = Array.from(groupedCandidates.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.note - b.note;
  });

  const accepted: PeakCandidate[] = [];

  for (const candidate of ranked) {
    if (accepted.some((note) => Math.abs(note.note - candidate.note) <= 1 && note.score >= candidate.score)) {
      continue;
    }

    const lowerHarmonicBase = accepted.find((note) =>
      note.note < candidate.note &&
      note.score >= candidate.score * 0.72 &&
      isHarmonicOfLowerCandidate(candidate.frequency, note.frequency)
    );

    if (lowerHarmonicBase) continue;

    accepted.push(candidate);
    if (accepted.length >= MAX_POLYPHONY) break;
  }

  return accepted
    .sort((a, b) => a.note - b.note)
    .map((candidate) => ({
      note: candidate.note,
      name: candidate.name,
      frequency: candidate.frequency,
      clarity: candidate.clarity,
      volume: candidate.volume,
      timestamp: now,
    }));
}

export function useAudioInput() {
  const [isSupported, setIsSupported] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isListening, setIsListening] = useState(false);
  const [activeAudioNote, setActiveAudioNote] = useState<AudioNote | null>(null);
  const [activeAudioNotes, setActiveAudioNotes] = useState<AudioNote[]>([]);
  const [inputLevel, setInputLevel] = useState(0);
  const [calibrationProfile, setCalibrationProfile] = useState<AudioCalibrationProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const heldNotesRef = useRef<Map<number, AudioNote>>(new Map());

  const reloadCalibration = useCallback(() => {
    setCalibrationProfile(readAudioCalibrationProfile());
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError("Seu navegador nao suporta entrada de audio.");
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((status) => {
          setPermissionStatus(status.state as "prompt" | "granted" | "denied");
          status.onchange = () => {
            setPermissionStatus(status.state as "prompt" | "granted" | "denied");
          };
        })
        .catch(() => {
          // Alguns navegadores nao suportam a consulta de permissao.
        });
    }

    setCalibrationProfile(readAudioCalibrationProfile());
  }, []);

  const stop = useCallback(() => {
    setIsListening(false);
    setActiveAudioNote(null);
    setActiveAudioNotes([]);
    heldNotesRef.current.clear();

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch((closeError) => {
        console.warn("Erro ao fechar AudioContext:", closeError);
      });
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });

      streamRef.current = stream;
      setPermissionStatus("granted");

      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext nao disponivel neste navegador.");
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 16384;
      analyser.smoothingTimeConstant = 0.08;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const input = new Float32Array(analyser.fftSize);
      const frequencyData = new Float32Array(analyser.frequencyBinCount);

      setIsListening(true);
      setError(null);
      reloadCalibration();

      const updatePitch = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(input);

        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }

        const rms = Math.sqrt(sum / input.length);
        const now = performance.now();
        const profile = calibrationProfile ?? readAudioCalibrationProfile();
        const minSignalThreshold = profile?.minSignalRms ?? MIN_SIGNAL_RMS;
        const silenceThreshold = profile?.silenceRms ?? SILENCE_RMS;
        const noteHoldMs = profile?.noteHoldMs ?? DEFAULT_NOTE_HOLD_MS;

        setInputLevel(rms);

        if (rms > minSignalThreshold) {
          analyserRef.current.getFloatFrequencyData(frequencyData);
          const detectedNotes = detectPolyphonicNotes(
            frequencyData,
            audioContext.sampleRate,
            analyserRef.current.fftSize,
            rms,
            now
          );

          for (const note of detectedNotes) {
            heldNotesRef.current.set(note.note, note);
          }
        }

        for (const [midi, note] of heldNotesRef.current.entries()) {
          if (rms < silenceThreshold || now - note.timestamp > noteHoldMs) {
            heldNotesRef.current.delete(midi);
          }
        }

        const stabilizedNotes = Array.from(heldNotesRef.current.values()).sort((a, b) => a.note - b.note);
        setActiveAudioNotes(stabilizedNotes);
        setActiveAudioNote(stabilizedNotes[0] ?? null);

        animationFrameRef.current = requestAnimationFrame(updatePitch);
      };

      updatePitch();
    } catch (err) {
      console.error("[USE_AUDIO_INPUT_ERROR]:", err);
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        setPermissionStatus("denied");
        setError("Acesso ao microfone negado. Permita o acesso nas configuracoes do navegador.");
      } else {
        setError(err instanceof Error ? err.message : "Erro ao acessar microfone");
      }
      setIsListening(false);
    }
  }, [calibrationProfile, reloadCalibration]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    permissionStatus,
    activeAudioNote,
    activeAudioNotes,
    inputLevel,
    calibrationProfile,
    reloadCalibration,
    start,
    stop,
    error,
  };
}
