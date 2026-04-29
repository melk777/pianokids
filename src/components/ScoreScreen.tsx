"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { Clock3, Gauge, LogOut, Music2, RotateCcw, SkipForward, Star, Target, TrendingUp } from "lucide-react";
import type { PracticeFeedbackSummary } from "@/lib/types";
import type { Difficulty } from "@/lib/songFilters";
import { buildPracticePlan } from "@/lib/practicePlan";

interface ScoreScreenProps {
  accuracy: number;
  score: number;
  combo: number;
  difficulty: Difficulty;
  feedback?: PracticeFeedbackSummary;
  onRestart: () => void;
  onPracticeRange?: (range: { start: number; end: number }) => void;
  onNext: () => void;
  onExit: () => void;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatRange(range?: { start: number; end: number } | null) {
  if (!range) return null;
  const start = Math.max(0, Math.floor(range.start));
  const end = Math.max(start, Math.floor(range.end));
  return `${start}s-${end}s`;
}

function StatCard({
  icon,
  label,
  value,
  tone = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
      <div className={`mb-2 flex items-center gap-2 ${tone}`}>
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</span>
      </div>
      <p className="text-base font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

export default function ScoreScreen({
  accuracy,
  score,
  combo,
  difficulty,
  feedback,
  onRestart,
  onPracticeRange,
  onNext,
  onExit,
}: ScoreScreenProps) {
  const safeAccuracy = clampPercent(accuracy);
  const isStrong = safeAccuracy >= 80;
  const practicePlan = buildPracticePlan({ accuracy: safeAccuracy, difficulty, feedback });
  const activeStars = safeAccuracy >= 92 ? 3 : safeAccuracy >= 75 ? 2 : safeAccuracy > 0 ? 1 : 0;
  const rangeLabel = formatRange(feedback?.weakestRange);
  const levelLabel = {
    review: "revisar",
    steady: "consolidar",
    advance: "avançar",
    mastered: "dominado",
  }[practicePlan.level];
  const timingBias =
    feedback && feedback.lateHits > feedback.earlyHits
      ? "Você está chegando um pouco tarde."
      : feedback && feedback.earlyHits > feedback.lateHits
        ? "Você está tocando um pouco cedo."
        : "Seu timing ficou equilibrado.";

  const headline = useMemo(() => {
    if (safeAccuracy >= 92) return "Performance excelente";
    if (safeAccuracy >= 75) return "Bom progresso";
    if (safeAccuracy > 0) return "Vamos consolidar";
    return "Primeira leitura registrada";
  }, [safeAccuracy]);

  useEffect(() => {
    if (!isStrong) return;

    const duration = 1800;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 50,
        origin: { x: 0 },
        colors: ["#00EAFF", "#FF00E5", "#34D399", "#FBBF24"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 50,
        origin: { x: 1 },
        colors: ["#00EAFF", "#FF00E5", "#34D399", "#FBBF24"],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }, [isStrong]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/72 p-3 backdrop-blur-md md:p-6"
    >
      <motion.div
        initial={{ scale: 0.96, y: 22 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, bounce: 0.24 }}
        data-testid="score-screen"
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-cyan/15 bg-[#05070A] p-4 shadow-[0_28px_110px_rgba(0,0,0,0.72),0_0_60px_rgba(34,211,238,0.08)] md:p-6"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan/10 blur-3xl" />

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan">Resultado</p>
                <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">{headline}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{practicePlan.message}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {[1, 2, 3].map((starIndex) => (
                  <Star
                    key={starIndex}
                    size={22}
                    className={
                      activeStars >= starIndex
                        ? "fill-amber-300 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]"
                        : "fill-transparent text-white/14"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Precisão</p>
                  <p className="mt-1 text-5xl font-black tabular-nums text-white">{safeAccuracy}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Meta</p>
                  <p className="mt-1 text-xl font-black text-cyan">{practicePlan.targetAccuracy}%</p>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${safeAccuracy}%` }}
                  transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan via-emerald-300 to-amber-300"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatCard icon={<Gauge size={15} />} label="Pontos" value={score.toLocaleString()} tone="text-cyan" />
              <StatCard icon={<TrendingUp size={15} />} label="Sequência" value={`${combo}x`} tone="text-magenta" />
            </div>
          </section>

          <section className="grid gap-3">
            {feedback && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard icon={<Target size={14} />} label="Notas" value={`${feedback.hits}/${feedback.totalNotes || 0}`} tone="text-cyan" />
                  <StatCard icon={<Star size={14} />} label="Perfeitas" value={`${feedback.perfectHits}`} tone="text-amber-300" />
                  <StatCard icon={<Clock3 size={14} />} label="Timing" value={`${feedback.averageTimingMs}ms`} tone="text-emerald-300" />
                </div>

                <div className="rounded-xl border border-white/10 bg-black/35 p-4">
                  <div className="mb-2 flex items-center gap-2 text-magenta">
                    <Music2 size={15} />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Diagnóstico</p>
                  </div>
                  <p className="text-sm leading-relaxed text-white/76">{feedback.recommendation}</p>
                  <p className="mt-1 text-xs text-white/45">{timingBias}</p>
                  {feedback.problemNotes.length > 0 && (
                    <p className="mt-2 text-xs leading-relaxed text-white/50">
                      Foco: {feedback.problemNotes.map((note) => `${note.name ?? note.midi} (${note.misses}x)`).join(", ")}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-cyan/20 bg-cyan/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-cyan">
                    <Gauge size={15} />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">Plano de prática</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-white">{practicePlan.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/68">
                        Velocidade sugerida: {Math.round(practicePlan.suggestedSpeed * 100)}%
                        {rangeLabel ? ` · trecho ${rangeLabel}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan">
                      {levelLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {practicePlan.focusAreas.slice(0, 4).map((area) => (
                      <span key={area} className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-[10px] text-white/62">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {feedback?.weakestRange && onPracticeRange && (
                <button
                  data-testid="score-practice-range"
                  onClick={() =>
                    onPracticeRange({
                      start: feedback.weakestRange?.start ?? 0,
                      end: feedback.weakestRange?.end ?? 0,
                    })
                  }
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-emerald-200 active:scale-[0.98] sm:col-span-2"
                >
                  <Target size={18} />
                  {practicePlan.preferPracticeRange ? practicePlan.nextActionLabel : "Treinar trecho recomendado"}
                </button>
              )}

              <button
                data-testid="score-restart"
                onClick={onRestart}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-cyan-300 active:scale-[0.98]"
              >
                <RotateCcw size={18} />
                Tocar novamente
              </button>

              <button
                data-testid="score-next"
                onClick={onNext}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/12 active:scale-[0.98]"
              >
                <SkipForward size={18} />
                Próxima música
              </button>

              <button
                data-testid="score-exit"
                onClick={onExit}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white/42 transition hover:bg-white/6 hover:text-white/70 sm:col-span-2"
              >
                <LogOut size={15} />
                Sair para a biblioteca
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
