"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SongLibrary from "@/components/SongLibrary";
import OnboardingWizard from "@/components/OnboardingWizard";
import { ChevronRight, Loader2, Play, Sparkles } from "lucide-react";
import type { PracticeSession, Song } from "@/lib/types";
import { loadSongs } from "@/lib/songCatalog";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { buildPracticeRecommendation, type PracticeRecommendation } from "@/lib/practiceProgress";
import { trackEvent } from "@/lib/analytics";
import {
  buildOnboardingSongRecommendation,
  buildFirstLessonOptions,
  getStoredOnboardingPreferences,
  type OnboardingPreferences,
} from "@/lib/onboarding";

export default function SongsPage() {
  const { isPro: hasPremium, hasAccess, loading: subscriptionLoading } = useSubscription();
  const { profile } = useProfile();
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingPreferences, setOnboardingPreferences] = useState<OnboardingPreferences | null>(null);

  useEffect(() => {
    trackEvent("library_view");
    const preferences = getStoredOnboardingPreferences();
    setOnboardingPreferences(preferences);
    setOnboardingOpen(!preferences);
  }, []);

  useEffect(() => {
    let mounted = true;

    loadSongs().then((catalog) => {
      if (!mounted) return;
      setSongs(catalog);
      setSongsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPracticeHistory = async () => {
      try {
        const response = await fetch("/api/practice/session", { cache: "no-store" });
        const data = await response.json();
        if (!mounted || !response.ok || !data?.supported) return;
        setRecentSessions((data.recentSessions || []) as PracticeSession[]);
      } catch {
        if (!mounted) return;
      }
    };

    loadPracticeHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const recommendation = buildPracticeRecommendation(profile, recentSessions, songs);
  const onboardingRecommendation = buildOnboardingSongRecommendation(songs, onboardingPreferences);
  const firstLessonOptions = buildFirstLessonOptions(songs, onboardingPreferences);

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <OnboardingWizard
        open={onboardingOpen}
        onComplete={() => {
          setOnboardingOpen(false);
          setOnboardingPreferences(getStoredOnboardingPreferences());
        }}
      />
      <div className="mx-auto max-w-[1400px] overflow-hidden px-4 pb-32 pt-28 md:px-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10 px-2">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white md:text-5xl">Biblioteca</h1>
          <p className="text-lg text-white/40">Explore nosso catalogo premium categorizado por dificuldade e estilos.</p>
        </motion.div>

        {subscriptionLoading || songsLoading ? (
          <div className="mt-20 flex h-64 flex-col items-center justify-center gap-4 text-white/30">
            <Loader2 className="icon-gradient h-10 w-10 animate-spin" />
            <p>Carregando catalogo...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {recommendation && <LibraryRecommendation recommendation={recommendation} />}
            {!recommendation && onboardingRecommendation && (
              <OnboardingRecommendation recommendation={onboardingRecommendation} preferences={onboardingPreferences} />
            )}
            {!recommendation && !onboardingRecommendation && firstLessonOptions.length > 0 && (
              <FirstLessonStrip options={firstLessonOptions} />
            )}
            <SongLibrary songs={songs} hasPremium={hasPremium} hasAccess={hasAccess} />
          </motion.div>
        )}
      </div>
    </main>
  );
}

function FirstLessonStrip({
  options,
}: {
  options: ReturnType<typeof buildFirstLessonOptions>;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/10 via-white/[0.02] to-magenta/10 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            Comece em 1 clique
          </p>
          <h2 className="text-2xl font-black text-white">Primeiras aulas seguras para tocar agora</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">
            Escolhi musicas curtas e simples para reduzir decisao e aumentar sua chance de concluir a primeira pratica.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {options.map((option) => (
          <Link
            key={option.song.id}
            href={option.href}
            onClick={() =>
              trackEvent("first_lesson_started", {
                source: "first_lesson_strip",
                songId: option.song.id,
                title: option.song.title,
                difficulty: option.difficulty,
                leftHand: option.handSelection.includeLeftHand,
                rightHand: option.handSelection.includeRightHand,
              })
            }
            className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-cyan/40 hover:bg-cyan/10"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-white/50">
                {option.label}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-black transition group-hover:scale-105">
                <Play className="h-4 w-4 fill-current" />
              </span>
            </div>
            <h3 className="text-lg font-black text-white">{option.song.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/48">{option.reason}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OnboardingRecommendation({
  recommendation,
  preferences,
}: {
  recommendation: NonNullable<ReturnType<typeof buildOnboardingSongRecommendation>>;
  preferences: OnboardingPreferences | null;
}) {
  const goalLabel =
    preferences?.goal === "worship"
      ? "louvor"
      : preferences?.goal === "classic"
        ? "clássico"
        : preferences?.goal === "popular"
          ? "filmes"
          : "infantil";

  return (
    <section className="mb-8 rounded-2xl border border-cyan/20 bg-cyan/5 p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            Primeira aula sugerida
          </p>
          <h2 className="text-2xl font-black text-white">{recommendation.song.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
            Escolhi essa música porque combina com seu objetivo {goalLabel} e com seu nível inicial.
          </p>
        </div>

        <Link
          href={recommendation.href}
          onClick={() =>
            trackEvent("recommended_practice_clicked", {
              source: "onboarding_recommendation",
              songId: recommendation.song.id,
              difficulty: recommendation.difficulty,
              leftHand: recommendation.handSelection.includeLeftHand,
              rightHand: recommendation.handSelection.includeRightHand,
            })
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-cyan-300"
        >
          Começar agora
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function LibraryRecommendation({ recommendation }: { recommendation: PracticeRecommendation }) {
  const handLabel = recommendation.handMode === "both" ? "Duas maos" : recommendation.handMode === "left" ? "Mao esquerda" : "Mao direita";
  const difficultyLabel = recommendation.difficulty === "pro" ? "Profissional" : recommendation.difficulty === "medium" ? "Intermediario" : "Iniciante";

  return (
    <section className="mb-8 rounded-2xl border border-magenta/20 bg-magenta/5 p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-magenta">
            <Sparkles className="h-3.5 w-3.5" />
            Aula recomendada para agora
          </p>
          <h2 className="text-2xl font-black text-white">{recommendation.songTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">{recommendation.reason}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
              {difficultyLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
              {handLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
              {recommendation.label}
            </span>
          </div>
        </div>

        <Link
          href={recommendation.href}
          onClick={() =>
            trackEvent("recommended_practice_clicked", {
              songId: recommendation.songId,
              difficulty: recommendation.difficulty,
              handMode: recommendation.handMode,
              source: "library_recommendation",
            })
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-magenta px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:opacity-90"
        >
          Comecar
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
