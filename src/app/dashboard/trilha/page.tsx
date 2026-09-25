"use client";

import Link from "next/link";
import { Check, ChevronRight, Loader2, Lock, Play, Target } from "lucide-react";
import { useLearningPath } from "@/hooks/useLearningPath";
import { DAILY_GOAL_SECONDS, LEARNING_PATH, describeGoal, lessonHref, type LessonProgress } from "@/lib/learningPath";

function DailyGoal({ seconds }: { seconds: number }) {
  const progress = Math.min(1, seconds / DAILY_GOAL_SECONDS);
  const minutes = Math.floor(seconds / 60);
  const goalMinutes = DAILY_GOAL_SECONDS / 60;
  const done = progress >= 1;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${done ? "#6ee7b7" : "#22d3ee"} ${progress * 360}deg, rgba(255,255,255,0.08) 0deg)` }}
        aria-hidden
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-950 text-xs font-black text-white">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-white">{done ? "Meta de hoje cumprida!" : "Meta de hoje"}</p>
        <p className="text-xs text-white/60">
          {minutes} de {goalMinutes} minutos de prática
        </p>
      </div>
    </div>
  );
}

function LessonRow({ item }: { item: LessonProgress }) {
  const { lesson, status } = item;
  const locked = status === "locked";
  const content = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-black ${
          status === "done"
            ? "border-emerald-300/40 bg-emerald-300 text-black"
            : status === "current"
              ? "border-cyan bg-cyan text-black shadow-[0_0_20px_rgba(34,211,238,0.45)]"
              : locked
                ? "border-white/10 bg-white/[0.03] text-white/30"
                : "border-white/20 bg-white/[0.05] text-white/80"
        }`}
        aria-hidden
      >
        {status === "done" ? <Check size={16} strokeWidth={3} /> : locked ? <Lock size={14} /> : lesson.id.split("-")[1]}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${locked ? "text-white/40" : "text-white"}`}>{lesson.title}</p>
        <p className={`truncate text-xs ${locked ? "text-white/30" : "text-white/60"}`}>
          {lesson.skill} · meta {lesson.goalAccuracy}%
        </p>
      </div>
      {status === "current" ? (
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-cyan px-3 py-2 text-xs font-bold text-black">
          <Play size={12} className="fill-black" /> Começar
        </span>
      ) : status === "done" ? (
        <span className="shrink-0 text-xs font-semibold text-emerald-300">Repetir</span>
      ) : !locked ? (
        <ChevronRight size={16} className="shrink-0 text-white/40" />
      ) : null}
    </>
  );

  const className = `flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
    status === "current" ? "border-cyan/40 bg-cyan/[0.07]" : "border-white/8 bg-white/[0.02]"
  } ${locked ? "cursor-not-allowed" : "hover:border-white/20 hover:bg-white/[0.05]"}`;

  if (locked) {
    return (
      <li className={className} title="Conclua a aula anterior para liberar">
        <span className="sr-only">Bloqueada. </span>
        {content}
      </li>
    );
  }
  return (
    <li>
      <Link href={lessonHref(lesson)} className={className}>
        {content}
      </Link>
    </li>
  );
}

export default function LearningPathPage() {
  const { progress, completed, total, current, todaySeconds, loading } = useLearningPath();

  return (
    <main className="min-h-screen bg-black px-4 pb-20 pt-28 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Minha trilha</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Do zero ao louvor</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
            Aulas curtas em ordem: da primeira nota a acompanhar hinos com as duas mãos. Cada aula libera a próxima
            quando você atinge a meta.
          </p>
        </header>

        <section className="mb-8 grid gap-3 sm:grid-cols-2">
          <DailyGoal seconds={todaySeconds} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-bold text-white">
              {completed} de {total} aulas concluídas
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan to-emerald-300 transition-all"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
        </section>

        {current && (
          <Link
            href={lessonHref(current.lesson)}
            className="mb-10 flex items-center gap-4 rounded-3xl border border-cyan/30 bg-gradient-to-r from-cyan/15 to-transparent p-5 transition hover:border-cyan/60"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan text-black">
              <Play size={20} className="ml-0.5 fill-black" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan">Próxima aula</p>
              <p className="truncate text-lg font-black">{current.lesson.title}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/65">
                <Target size={12} /> {describeGoal(current.lesson)}
              </p>
            </div>
            <ChevronRight className="shrink-0 text-cyan" />
          </Link>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
            <Loader2 size={16} className="animate-spin" /> Carregando sua trilha…
          </div>
        ) : (
          <ol className="space-y-8">
            {LEARNING_PATH.map((unit, unitIndex) => {
              const lessons = progress.filter((item) => item.unitIndex === unitIndex);
              const unitDone = lessons.every((item) => item.status === "done");
              return (
                <li key={unit.id}>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-black">
                      <span className="mr-2 text-white/40">Nível {unitIndex + 1}</span>
                      {unit.title}
                    </h2>
                    {unitDone && <span className="text-xs font-bold text-emerald-300">Concluído</span>}
                  </div>
                  <p className="mb-3 text-xs text-white/55">{unit.description}</p>
                  <ul className="space-y-2">
                    {lessons.map((item) => (
                      <LessonRow key={item.lesson.id} item={item} />
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
