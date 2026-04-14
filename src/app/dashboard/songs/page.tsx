"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SongLibrary from "@/components/SongLibrary";
import { Loader2 } from "lucide-react";
import type { Song } from "@/lib/songs";
import { loadSongs } from "@/lib/songCatalog";
import { useSubscription } from "@/hooks/useSubscription";

export default function SongsPage() {
  const { isPro: hasPremium, loading: subscriptionLoading } = useSubscription();
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);

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
            <SongLibrary songs={songs} hasPremium={hasPremium} />
          </motion.div>
        )}
      </div>
    </main>
  );
}
