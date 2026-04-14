"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Activity, SlidersHorizontal, RefreshCcw } from "lucide-react";
import { useAudioInput } from "@/hooks/useAudioInput";
import {
  clearAudioCalibrationProfile,
  saveAudioCalibrationProfile,
  type AudioCalibrationProfile,
} from "@/lib/audioCalibration";

type CalibrationStep = "idle" | "silence" | "single" | "chord" | "done";

type CalibrationSample = {
  level: number;
  detectedCount: number;
};

const STEP_DURATION_MS = 2400;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function AudioEngine() {
  const {
    isListening,
    activeAudioNote,
    activeAudioNotes,
    inputLevel,
    calibrationProfile,
    reloadCalibration,
    start,
    stop,
    error,
  } = useAudioInput();

  const displayedNotes = activeAudioNotes.length > 0 ? activeAudioNotes : activeAudioNote ? [activeAudioNote] : [];
  const primaryNote = displayedNotes[0] ?? null;

  const [calibrationStep, setCalibrationStep] = useState<CalibrationStep>("idle");
  const [stepStartedAt, setStepStartedAt] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>(null);

  const samplesRef = useRef<Record<"silence" | "single" | "chord", CalibrationSample[]>>({
    silence: [],
    single: [],
    chord: [],
  });

  const stepConfig = useMemo<Record<Exclude<CalibrationStep, "idle" | "done">, { title: string; description: string }>>(
    () => ({
      silence: {
        title: "1. Escute o ambiente",
        description: "Deixe o piano em silencio por alguns segundos para medir o ruido do ambiente.",
      },
      single: {
        title: "2. Toque uma nota longa",
        description: "Toque e sustente uma nota central, como D4 ou E4, para ajustar a sensibilidade.",
      },
      chord: {
        title: "3. Toque um acorde completo",
        description: "Toque um acorde simples, como Do maior, para calibrar a deteccao polifonica.",
      },
    }),
    []
  );

  const finalizeCalibration = useCallback(() => {
    const silenceSamples = samplesRef.current.silence;
    const singleSamples = samplesRef.current.single;
    const chordSamples = samplesRef.current.chord;

    const silenceAvg = average(silenceSamples.map((sample) => sample.level));
    const singleAvg = average(singleSamples.filter((sample) => sample.detectedCount >= 1).map((sample) => sample.level));
    const chordAvg = average(chordSamples.filter((sample) => sample.detectedCount >= 2).map((sample) => sample.level));
    const chordCoverage = chordSamples.length > 0
      ? chordSamples.filter((sample) => sample.detectedCount >= 2).length / chordSamples.length
      : 0;

    const profile: AudioCalibrationProfile = {
      noiseFloorRms: clamp(silenceAvg * 1.1 || 0.0025, 0.0005, 0.02),
      silenceRms: clamp(Math.max(silenceAvg * 1.45, 0.0018), 0.0015, 0.025),
      minSignalRms: clamp(
        Math.max(
          silenceAvg * 2.4,
          singleAvg * 0.33 || 0,
          chordAvg * 0.28 || 0,
          0.0048
        ),
        0.0038,
        0.05
      ),
      noteHoldMs: Math.round(clamp(130 + (1 - chordCoverage) * 70, 110, 220)),
      updatedAt: Date.now(),
    };

    saveAudioCalibrationProfile(profile);
    reloadCalibration();
    setCalibrationStep("done");
    setProgress(1);
    setCalibrationMessage("Perfil salvo. O jogo agora vai usar essa calibracao automaticamente neste navegador.");
  }, [reloadCalibration]);

  useEffect(() => {
    if (!isListening || !stepStartedAt || !["silence", "single", "chord"].includes(calibrationStep)) {
      if (calibrationStep === "idle" || calibrationStep === "done") {
        setProgress(0);
      }
      return;
    }

    const step = calibrationStep as "silence" | "single" | "chord";
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - stepStartedAt;
      const ratio = clamp(elapsed / STEP_DURATION_MS, 0, 1);
      setProgress(ratio);

      samplesRef.current[step].push({
        level: inputLevel,
        detectedCount: displayedNotes.length,
      });

      if (elapsed >= STEP_DURATION_MS) {
        window.clearInterval(timer);
        if (step === "silence") {
          setCalibrationStep("single");
          setStepStartedAt(performance.now());
        } else if (step === "single") {
          setCalibrationStep("chord");
          setStepStartedAt(performance.now());
        } else {
          finalizeCalibration();
        }
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [calibrationStep, displayedNotes.length, finalizeCalibration, inputLevel, isListening, stepStartedAt]);

  const startCalibration = async () => {
    setCalibrationMessage(null);
    samplesRef.current = { silence: [], single: [], chord: [] };

    if (!isListening) {
      await start();
    }

    setCalibrationStep("silence");
    setStepStartedAt(performance.now());
    setProgress(0);
  };

  const resetCalibration = () => {
    clearAudioCalibrationProfile();
    reloadCalibration();
    setCalibrationStep("idle");
    setCalibrationMessage("Calibracao removida. O reconhecimento voltou para os ajustes padrao.");
  };

  const liveProfile = calibrationProfile;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 p-8 glass">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center">
          <div className="mb-8 flex items-center gap-3">
            <div className={`rounded-full p-3 ${isListening ? "bg-cyan/20 text-cyan animate-pulse" : "bg-white/5 text-white/40"}`}>
              {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </div>
            <h3 className="text-xl font-bold text-white">Reconhecimento</h3>
          </div>

          <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
            <AnimatePresence>
              {isListening && primaryNote && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1 + primaryNote.volume * 2, opacity: 0.1 }}
                    className="absolute inset-0 rounded-full bg-cyan"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1 + primaryNote.volume * 4, opacity: 0.05 }}
                    className="absolute inset-0 rounded-full bg-cyan"
                  />
                </>
              )}
            </AnimatePresence>

            <div className="z-10 text-center">
              <AnimatePresence mode="wait">
                {primaryNote ? (
                  <motion.div
                    key={displayedNotes.map((note) => note.name).join("-")}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.05, opacity: 0 }}
                    className="flex max-w-[11rem] flex-wrap items-center justify-center gap-2"
                  >
                    {displayedNotes.map((note) => (
                      <span
                        key={note.note}
                        className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      >
                        {note.name}
                      </span>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    className="flex flex-col items-center gap-2 text-white"
                  >
                    <Activity className="h-12 w-12 text-cyan" />
                    <span className="text-xs uppercase tracking-widest">Silencio</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {primaryNote && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 font-mono text-sm font-black text-cyan">
                  {displayedNotes.length > 1 ? `${displayedNotes.length} notas simultaneas` : `${Math.round(primaryNote.frequency)} Hz`}
                </motion.div>
              )}
            </div>
          </div>

          <div className="mb-6 w-full space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-tighter text-white/40">
                <span>Nivel de Entrada</span>
                <span>{Math.round(inputLevel * 1000)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <motion.div animate={{ width: `${clamp(inputLevel * 4000, 0, 100)}%` }} className="h-full bg-cyan" />
              </div>
            </div>

            {isListening && primaryNote && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-tighter text-white/40">
                  <span>Clareza do Som</span>
                  <span>{Math.round(primaryNote.clarity * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    animate={{ width: `${primaryNote.clarity * 100}%` }}
                    className={`h-full ${primaryNote.clarity > 0.85 ? "bg-cyan" : "bg-pink-500"}`}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="mb-4 text-center text-xs text-pink-400">{error}</p>}

          <button
            onClick={isListening ? stop : start}
            className={`w-full rounded-2xl py-4 font-bold transition-all ${
              isListening
                ? "border border-pink-500/20 bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
                : "bg-cyan text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(0,234,255,0.4)]"
            }`}
          >
            {isListening ? "Parar Reconhecimento" : "Iniciar Microfone"}
          </button>

          <p className="mt-6 text-center text-[10px] leading-relaxed text-white/30">
            Toque notas isoladas ou acordes no piano. O microfone agora tenta reconhecer varias notas ao mesmo tempo.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-white/5 p-3 text-cyan">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Calibracao do Microfone</h4>
              <p className="text-sm text-white/40">Ajuste automatico para o ambiente e o piano do aluno.</p>
            </div>
          </div>

          {calibrationStep !== "idle" && calibrationStep !== "done" && (
            <div className="mb-6 rounded-2xl border border-cyan/20 bg-cyan/5 p-4">
              <p className="text-sm font-black text-cyan">{stepConfig[calibrationStep].title}</p>
              <p className="mt-1 text-sm text-white/60">{stepConfig[calibrationStep].description}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div animate={{ width: `${progress * 100}%` }} className="h-full bg-cyan" />
              </div>
            </div>
          )}

          {calibrationStep === "done" && calibrationMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {calibrationMessage}
            </div>
          )}

          {calibrationStep === "idle" && calibrationMessage && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              {calibrationMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={startCalibration}
              disabled={calibrationStep !== "idle" && calibrationStep !== "done"}
              className="w-full rounded-2xl bg-white px-4 py-3 font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {liveProfile ? "Recalibrar Microfone" : "Iniciar Calibracao Guiada"}
            </button>

            <button
              onClick={resetCalibration}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Remover Calibracao
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Ruido ambiente" value={liveProfile ? liveProfile.noiseFloorRms.toFixed(4) : "--"} />
            <MetricCard label="Silencio ativo" value={liveProfile ? liveProfile.silenceRms.toFixed(4) : "--"} />
            <MetricCard label="Sinal minimo" value={liveProfile ? liveProfile.minSignalRms.toFixed(4) : "--"} />
            <MetricCard label="Retencao da nota" value={liveProfile ? `${liveProfile.noteHoldMs} ms` : "--"} />
          </div>

          <div className="mt-6 space-y-3 text-sm text-white/45">
            <p>1. Rode a calibracao no mesmo ambiente em que o aluno costuma praticar.</p>
            <p>2. No passo da nota simples, prefira uma tecla da regiao central do piano.</p>
            <p>3. No passo do acorde, use 3 notas bem definidas e sustente por 2 segundos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-2 font-mono text-lg font-black text-white">{value}</p>
    </div>
  );
}
