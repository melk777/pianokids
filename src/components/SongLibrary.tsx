"use client";

import { memo, useDeferredValue, useEffect, useMemo, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { Song } from "@/lib/types";
import { Lock, Play, Search, X } from "lucide-react";
import { useSFX } from "@/hooks/useSFX";

const MusicRecommendation = dynamic(() => import("./MusicRecommendation"), {
  loading: () => null,
});

const SongSummaryModal = dynamic(() => import("./SongSummaryModal"), {
  loading: () => null,
});

interface SongLibraryProps {
  songs: Song[];
  hasPremium: boolean;
  hasAccess: boolean;
}

const CATEGORIES = [
  { id: "Infantis", label: "Infantis" },
  { id: "Clássicos", label: "Clássicos" },
  { id: "Religiosos", label: "Religiosos" },
  { id: "Intro de Filmes", label: "Intro de Filmes" },
] as const;

const CATEGORY_ORDER = CATEGORIES.map((category) => category.id);
const INITIAL_CATEGORY_LIMIT = 10;
const CATEGORY_INCREMENT = 10;
const FILTERED_PAGE_SIZE = 20;

function getSongCategories(song: Song) {
  return song.categories?.length ? song.categories : [song.category];
}

export default function SongLibrary({ songs, hasPremium, hasAccess }: SongLibraryProps) {
  const { playClick } = useSFX();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSongForSummary, setSelectedSongForSummary] = useState<Song | null>(null);
  const [visibleFilteredCount, setVisibleFilteredCount] = useState(FILTERED_PAGE_SIZE);
  const [categoryVisibleCounts, setCategoryVisibleCounts] = useState<Record<string, number>>({});

  const filteredSongs = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    return songs.filter((song) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        song.title.toLowerCase().includes(normalizedSearch) ||
        song.artist.toLowerCase().includes(normalizedSearch);

      const matchesCategory = selectedCategory === "all" || getSongCategories(song).includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [songs, deferredSearchTerm, selectedCategory]);

  const isFiltering = deferredSearchTerm.length > 0 || selectedCategory !== "all";

  const categoriesToRender = useMemo(() => {
    if (isFiltering) return [];

    const availableCategories = new Set(songs.flatMap((song) => getSongCategories(song)));
    return CATEGORY_ORDER.filter((category) => availableCategories.has(category));
  }, [isFiltering, songs]);

  const groupedSongs = useMemo(() => {
    const grouped = new Map<string, Song[]>();

    for (const category of categoriesToRender) {
      grouped.set(
        category,
        songs.filter((song) => getSongCategories(song).includes(category)),
      );
    }

    return grouped;
  }, [categoriesToRender, songs]);

  const visibleFilteredSongs = useMemo(
    () => filteredSongs.slice(0, visibleFilteredCount),
    [filteredSongs, visibleFilteredCount],
  );

  useEffect(() => {
    setVisibleFilteredCount(FILTERED_PAGE_SIZE);
  }, [deferredSearchTerm, selectedCategory]);

  useEffect(() => {
    setCategoryVisibleCounts((current) => {
      const nextCounts: Record<string, number> = {};
      for (const category of categoriesToRender) {
        nextCounts[category] = current[category] ?? INITIAL_CATEGORY_LIMIT;
      }
      return nextCounts;
    });
  }, [categoriesToRender]);

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
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

  const showMoreInCategory = (category: string) => {
    setCategoryVisibleCounts((current) => ({
      ...current,
      [category]: (current[category] ?? INITIAL_CATEGORY_LIMIT) + CATEGORY_INCREMENT,
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  return (
    <div className="mt-4 flex flex-col gap-8">
      <div className="mb-4 flex flex-col items-end justify-between gap-6 px-2 md:flex-row md:items-center">
        <div className="scrollbar-hide flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  playClick();
                  setSelectedCategory(category.id);
                }}
                className={`whitespace-nowrap rounded-2xl border px-6 py-2.5 transition-all duration-300 ${
                  isActive
                    ? "border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                }`}
              >
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>

        <div className="group relative w-full md:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-4 w-4 text-white/20 transition-colors group-focus-within:text-cyan" />
          </div>
          <input
            type="text"
            placeholder="O que vamos tocar hoje?"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-11 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-cyan/50 focus:bg-white/[0.06]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-4 flex items-center text-white/20 transition-colors hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isFiltering ? (
          <motion.div
            key="grouped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {categoriesToRender.map((category, categoryIndex) => {
              const categorySongs = groupedSongs.get(category) ?? [];
              const visibleCount = categoryVisibleCounts[category] ?? INITIAL_CATEGORY_LIMIT;
              const visibleSongs = categorySongs.slice(0, visibleCount);
              const hasMoreSongs = visibleCount < categorySongs.length;

              if (categorySongs.length === 0) return null;

              return (
                <div key={category} className="flex flex-col">
                  <div className="mb-4 flex items-center justify-between gap-4 px-2">
                    <h2 className="text-xl font-bold text-white/90 md:text-2xl">{category}</h2>
                    <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/30">
                      {categorySongs.length} músicas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 px-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {visibleSongs.map((song, index) => (
                      <SongCard
                        key={`${category}-${song.id}`}
                        song={song}
                        hasPremium={hasPremium}
                        hasAccess={hasAccess}
                        categoryIndex={categoryIndex}
                        index={index}
                        playClick={playClick}
                        getDifficultyStars={getDifficultyStars}
                        onSelect={() => setSelectedSongForSummary(song)}
                      />
                    ))}
                  </div>

                  {hasMoreSongs && (
                    <div className="mt-5 px-2">
                      <button
                        onClick={() => showMoreInCategory(category)}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-cyan/30 hover:bg-cyan/10 hover:text-white"
                      >
                        Ver mais {Math.min(CATEGORY_INCREMENT, categorySongs.length - visibleCount)} músicas
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col"
          >
            <div className="mb-6 flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-white/90 md:text-2xl">
                {deferredSearchTerm ? `Resultados para "${deferredSearchTerm}"` : selectedCategory}
              </h2>
              <span className="text-sm text-white/40">{filteredSongs.length} músicas encontradas</span>
            </div>

            {filteredSongs.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-6 px-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleFilteredSongs.map((song, index) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      hasPremium={hasPremium}
                      hasAccess={hasAccess}
                      categoryIndex={0}
                      index={index}
                      playClick={playClick}
                      getDifficultyStars={getDifficultyStars}
                      onSelect={() => setSelectedSongForSummary(song)}
                    />
                  ))}
                </div>

                {visibleFilteredCount < filteredSongs.length && (
                  <div className="mt-6 px-2">
                    <button
                      onClick={() => setVisibleFilteredCount((current) => current + FILTERED_PAGE_SIZE)}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-cyan/30 hover:bg-cyan/10 hover:text-white"
                    >
                      Carregar mais resultados
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-white/20">
                <Search className="h-12 w-12 opacity-50" />
                <p className="text-lg">Nenhuma música encontrada...</p>
                <button onClick={clearFilters} className="text-sm text-cyan hover:underline">
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <MusicRecommendation hasPremium={hasPremium} />

      <SongSummaryModal
        song={selectedSongForSummary}
        isOpen={!!selectedSongForSummary}
        onClose={() => setSelectedSongForSummary(null)}
      />
    </div>
  );
}

interface SongCardProps {
  song: Song;
  hasPremium: boolean;
  hasAccess: boolean;
  categoryIndex: number;
  index: number;
  playClick: () => void;
  getDifficultyStars: (difficulty: string) => string;
  onSelect: () => void;
}

const SongCard = memo(function SongCard({
  song,
  hasPremium,
  hasAccess,
  categoryIndex,
  index,
  playClick,
  getDifficultyStars,
  onSelect,
}: SongCardProps) {
  const isLocked = !hasAccess || (song.isPremium && !hasPremium);
  const [coverFailed, setCoverFailed] = useState(false);

  const handleClick = (event: MouseEvent) => {
    if (isLocked) return;
    event.preventDefault();
    playClick();
    onSelect();
  };

  return (
    <Link
      href={isLocked ? "/#pricing" : "#"}
      onClick={handleClick}
      className="group relative w-full transition-transform duration-300 hover:scale-105"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "120px" }}
        transition={{ delay: categoryIndex * 0.04 + index * 0.02 }}
        className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,234,255,0.22),transparent_32%),linear-gradient(135deg,rgba(251,146,60,0.18),rgba(24,24,27,0.95))]" />

        {song.coverUrl && !coverFailed && (
          <Image
            src={song.coverUrl}
            alt={song.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            onError={() => setCoverFailed(true)}
            className={`object-cover transition-all duration-500 group-hover:blur-sm ${
              isLocked ? "grayscale opacity-50" : "opacity-80 group-hover:brightness-50"
            }`}
          />
        )}

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                !hasAccess
                  ? "border border-rose-500/30 bg-rose-500/20 text-rose-300"
                  : song.isPremium
                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                    : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {song.isPremium ? "Premium" : "Grátis"}
            </span>
          </div>
          <h3 className="mb-1 truncate text-lg font-bold text-white">{song.title}</h3>
          <p className="mb-2 truncate text-sm text-white/60">{song.artist}</p>

          <div className="flex items-center justify-between">
            <span className="text-gradient text-sm font-black tracking-widest">{getDifficultyStars(song.difficulty)}</span>
            <span className="text-xs text-white/40">{song.noteCount ?? song.notes.length} notas</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl backdrop-blur-md ${
              isLocked
                ? "border-rose-500/50 bg-rose-500/30 text-rose-300"
                : "border-cyan/50 bg-cyan/30 icon-gradient"
            }`}
          >
            {isLocked ? <Lock size={24} className="ml-0.5" /> : <Play size={24} className="ml-1" />}
          </div>
        </div>

        {isLocked && (
          <div className="absolute right-4 top-4 transition-opacity group-hover:opacity-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md">
              <Lock size={14} className="text-white/60" />
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
});
