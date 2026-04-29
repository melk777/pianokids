"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SongLibrary from "@/components/SongLibrary";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import type { PracticeSession, Song } from "@/lib/types";
import { loadSongs } from "@/lib/songCatalog";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { buildPracticeRecommendation, type PracticeRecommendation } from "@/lib/practiceProgress";

export default function SongsPage() {
  const { isPro: hasPremium, hasAccess, loading: subscriptionLoading } = useSubscription();
  const { profile } = useProfile();
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);

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

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
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
            <SongLibrary songs={songs} hasPremium={hasPremium} hasAccess={hasAccess} />
          </motion.div>
        )}
      </div>
    </main>
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
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-magenta px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:opacity-90"
        >
          Comecar
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
