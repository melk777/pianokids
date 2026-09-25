"use client";

import Link from "next/link";
import { ChevronRight, Play, Route, Target } from "lucide-react";
import { useLearningPath } from "@/hooks/useLearningPath";
import { DAILY_GOAL_SECONDS, LEARNING_PATH, describeGoal, lessonHref } from "@/lib/learningPath";

/** Dashboard entry point to the learning path: next lesson plus today's goal. */
export default function NextLessonCard() {
  const { current, completed, total, todaySeconds, loading } = useLearningPath();
  if (loading) {
    return <div className="h-[132px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" aria-hidden />;
  }

  const goalProgress = Math.min(1, todaySeconds / DAILY_GOAL_SECONDS);
  const unit = current ? LEARNING_PATH[current.unitIndex] : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan/25 bg-gradient-to-br from-cyan/[0.10] via-transparent to-emerald-400/[0.05] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan">
            <Route size={13} /> Minha trilha · {completed}/{total} aulas
          </p>
          {current ? (
            <>
              <h2 className="mt-2 truncate text-xl font-black text-white md:text-2xl">{current.lesson.title}</h2>
              <p className="mt-1 text-xs text-white/60">
                Nível {current.unitIndex + 1} · {unit?.title}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                <Target size={12} className="shrink-0" /> {describeGoal(current.lesson)}
              </p>
            </>
          ) : (
            <h2 className="mt-2 text-xl font-black text-white">Trilha concluída! Escolha qualquer música da biblioteca.</h2>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3" title="Meta diária de prática">
          <div
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{ background: `conic-gradient(#22d3ee ${goalProgress * 360}deg, rgba(255,255,255,0.08) 0deg)` }}
            aria-hidden
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-950 text-[10px] font-black text-white">
              {Math.floor(todaySeconds / 60)}m
            </span>
          </div>
          <p className="text-xs leading-tight text-white/60">
            Hoje
            <br />
            <span className="font-bold text-white/85">meta {DAILY_GOAL_SECONDS / 60} min</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {current && (
          <Link
            href={lessonHref(current.lesson)}
            className="flex items-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-sm font-bold text-black transition hover:bg-cyan/85"
          >
            <Play size={14} className="fill-black" /> Começar aula
          </Link>
        )}
        <Link
          href="/dashboard/trilha"
          className="flex items-center gap-1 rounded-xl border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:text-white"
        >
          Ver trilha <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  );
}
