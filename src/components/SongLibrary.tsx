"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Song } from "@/lib/songs";
import { Lock, Play } from "lucide-react";

interface SongLibraryProps {
  songs: Song[];
  hasPremium: boolean;
}

export default function SongLibrary({ songs, hasPremium }: SongLibraryProps) {
  // Extract unique categories
  const categories = Array.from(new Set(songs.map((s) => s.category)));

  const getDifficultyStars = (diff: string) => {
    switch (diff) {
      case "Fácil":
        return "★☆☆";
      case "Médio":
        return "★★☆";
      case "Difícil":
        return "★★★";
      default:
        return "★☆☆";
    }
  };

  return (
    <div className="flex flex-col gap-12 mt-8">
      {categories.map((category, catIndex) => {
        const categorySongs = songs.filter((s) => s.category === category);

        return (
          <div key={category} className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold text-white/90 mb-4 px-2">
              {category}
            </h2>

            {/* Carousel Container */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-4 pb-4 px-2">
              {categorySongs.map((song, i) => {
                const isLocked = song.isPremium && !hasPremium;
                const targetHref = isLocked ? "/#pricing" : `/dashboard/play/${song.id}`;

                return (
                  <Link
                    key={song.id}
                    href={targetHref}
                    className="flex-none w-56 md:w-64 snap-start group relative transition-transform duration-300 hover:scale-105"
                  >
                    {/* Card Body */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: catIndex * 0.1 + i * 0.05 }}
                      className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-white/10"
                    >
                      {/* Cover Image */}
                      {song.coverUrl && (
                        <Image
                          src={song.coverUrl}
                          alt={song.title}
                          fill
                          className={`object-cover transition-all duration-500 group-hover:blur-sm ${
                            isLocked ? "grayscale opacity-50" : "opacity-80 group-hover:brightness-50"
                          }`}
                        />
                      )}

                      {/* Info Gradient Bottom Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              song.isPremium
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {song.isPremium ? "Premium" : "Grátis"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate mb-1">
                          {song.title}
                        </h3>
                        <p className="text-sm text-white/60 mb-2 truncate">{song.artist}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-cyan text-sm tracking-widest">
                            {getDifficultyStars(song.difficulty)}
                          </span>
                          <span className="text-xs text-white/40">{song.notes.length} notas</span>
                        </div>
                      </div>

                      {/* Hover / Locked Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl ${
                            isLocked
                              ? "bg-rose-500/30 border border-rose-500/50 text-rose-300"
                              : "bg-cyan/30 border border-cyan/50 text-cyan-300"
                          }`}
                        >
                          {isLocked ? (
                            <Lock size={24} className="ml-0.5" />
                          ) : (
                            <Play size={24} className="ml-1" />
                          )}
                        </div>
                      </div>

                      {/* Se estiver bloqueado de verdade (mobile), mostre cadeado sutil mesmo sem hover */}
                      {isLocked && (
                        <div className="absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
                            <Lock size={14} className="text-white/60" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
