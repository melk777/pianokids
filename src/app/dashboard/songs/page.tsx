"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { songs } from "@/lib/songs";

const difficultyColors: Record<string, string> = {
  "Fácil": "text-green-400",
  "Médio": "text-yellow-400",
  "Difícil": "text-red-400",
};

export default function SongsPage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        {/* Back + Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Voltar
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Escolha uma <span className="text-cyan">música</span>
          </h1>
          <p className="text-white/40 mt-2">
            {songs.length} músicas disponíveis
          </p>
        </motion.div>

        {/* Song Grid */}
        <div className="grid gap-4">
          {songs.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link href={`/dashboard/play/${song.id}`} className="block group">
                <div className="glass glass-hover rounded-xl p-6 flex items-center justify-between transition-all duration-300">
                  <div className="flex items-center gap-5">
                    {/* Track number */}
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20 font-mono text-sm group-hover:bg-cyan/10 group-hover:text-cyan transition-all duration-300">
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    <div>
                      <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors">
                        {song.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/30">{song.artist}</span>
                        <span className="text-white/10">·</span>
                        <span className={`text-xs ${difficultyColors[song.difficulty]}`}>
                          {song.difficulty}
                        </span>
                        <span className="text-white/10">·</span>
                        <span className="text-xs text-white/30">
                          {song.notes.length} notas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Play icon */}
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-cyan group-hover:text-black transition-all duration-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21"/>
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
