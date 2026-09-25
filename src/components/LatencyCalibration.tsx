"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, X } from "lucide-react";
import { estimateLatencyMs } from "@/lib/latencyCalibration";

const BEATS = 10;
const BEAT_INTERVAL_MS = 600;

type Phase = "intro" | "running" | "result";

interface LatencyCalibrationProps {
  currentLatencyMs: number;
  getAudioTime: () => number;
  playTick: (velocity?: number) => void;
  resumeAudio: () => Promise<void>;
  /** Changes identity on every MIDI note-on, so MIDI taps are counted too. */
  midiSignal: unknown;
  onSave: (latencyMs: number) => void;
  onClose: () => void;
}

export default function LatencyCalibration({
  currentLatencyMs,
  getAudioTime,
  playTick,
  resumeAudio,
  midiSignal,
  onSave,
  onClose,
}: LatencyCalibrationProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [beatIndex, setBeatIndex] = useState(-1);
  const [tapCount, setTapCount] = useState(0);
  const [measuredMs, setMeasuredMs] = useState<number | null>(null);
  const beatTimesRef = useRef<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("intro");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const registerTap = useCallback(() => {
    if (phaseRef.current !== "running") return;
    tapTimesRef.current.push(getAudioTime());
    setTapCount((count) => count + 1);
  }, [getAudioTime]);

  const start = useCallback(async () => {
    await resumeAudio();
    clearTimers();
    beatTimesRef.current = [];
    tapTimesRef.current = [];
    setTapCount(0);
    setMeasuredMs(null);
    setBeatIndex(-1);
    setPhase("running");

    for (let beat = 0; beat < BEATS; beat++) {
      timersRef.current.push(
        window.setTimeout(() => {
          beatTimesRef.current.push(getAudioTime());
          playTick(0.45);
          setBeatIndex(beat);
        }, 700 + beat * BEAT_INTERVAL_MS),
      );
    }
    timersRef.current.push(
      window.setTimeout(() => {
        setMeasuredMs(estimateLatencyMs(beatTimesRef.current, tapTimesRef.current));
        setPhase("result");
      }, 700 + BEATS * BEAT_INTERVAL_MS + 300),
    );
  }, [clearTimers, getAudioTime, playTick, resumeAudio]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.repeat || event.key === "Tab" || event.key === "Enter") return;
      if (phaseRef.current === "running") {
        event.preventDefault();
        event.stopPropagation();
        registerTap();
      }
    };
    // Capture phase so the game's own key handlers never see calibration taps.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, registerTap]);

  const lastMidiSignal = useRef(midiSignal);
  useEffect(() => {
    if (midiSignal === lastMidiSignal.current) return;
    lastMidiSignal.current = midiSignal;
    if (midiSignal) registerTap();
  }, [midiSignal, registerTap]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="latency-title"
        className="w-full max-w-md rounded-3xl border border-white/12 bg-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan">
              <Timer size={19} />
            </span>
            <div>
              <h2 id="latency-title" className="text-lg font-black">Calibrar atraso</h2>
              <p className="text-xs text-white/55">Atual: {currentLatencyMs} ms</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar calibração"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/55 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {phase === "intro" && (
          <>
            <p className="mt-5 text-sm leading-relaxed text-white/72">
              Fones Bluetooth e alguns teclados MIDI atrasam o som, e o jogo marca &quot;Tarde&quot; mesmo quando você acerta.
              Toque junto com os {BEATS} cliques do metrônomo: qualquer tecla do computador, do seu piano MIDI ou o botão abaixo.
            </p>
            <p className="mt-3 text-xs text-white/45">Use os mesmos fones ou caixa de som que você usa para tocar.</p>
            <button
              type="button"
              onClick={start}
              className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-black transition hover:bg-cyan"
            >
              Começar
            </button>
          </>
        )}

        {phase === "running" && (
          <>
            <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
              {Array.from({ length: BEATS }).map((_, index) => (
                <span
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    index === beatIndex ? "bg-cyan shadow-[0_0_12px_rgba(34,211,238,0.9)]" : index < beatIndex ? "bg-white/40" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                registerTap();
              }}
              className={`mt-6 grid h-32 w-full place-items-center rounded-2xl border text-sm font-bold transition-colors ${
                beatIndex >= 0 ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/10 bg-white/[0.04] text-white/60"
              }`}
            >
              {beatIndex < 0 ? "Prepare-se…" : "Toque junto com o clique"}
            </button>
            <p className="mt-3 text-center text-xs text-white/45" aria-live="polite">
              {tapCount} toques registrados
            </p>
          </>
        )}

        {phase === "result" && (
          <>
            {measuredMs === null ? (
              <p className="mt-5 text-sm leading-relaxed text-amber-200">
                Não deu para medir: poucos toques acompanharam o metrônomo. Tente de novo tocando em cada clique.
              </p>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-white/75">
                Atraso medido: <strong className="text-2xl font-black text-cyan">{measuredMs} ms</strong>
                <span className="mt-1 block text-xs text-white/45">
                  O jogo vai descontar esse tempo ao avaliar suas notas.
                </span>
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={start}
                className="rounded-xl border border-white/12 py-3 text-sm font-semibold text-white/75 transition hover:text-white"
              >
                Repetir
              </button>
              {measuredMs === null ? (
                <button
                  type="button"
                  onClick={() => {
                    onSave(0);
                    onClose();
                  }}
                  className="rounded-xl border border-white/12 py-3 text-sm font-semibold text-white/75 transition hover:text-white"
                >
                  Zerar atraso
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSave(measuredMs);
                    onClose();
                  }}
                  className="rounded-xl bg-white py-3 text-sm font-bold text-black transition hover:bg-cyan"
                >
                  Salvar
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
