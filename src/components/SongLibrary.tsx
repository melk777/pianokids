"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Song } from "@/lib/songs";
import { 
  Lock, 
  Play, 
  Search, 
  X
} from "lucide-react";
import { useSFX } from "@/hooks/useSFX";
import { useState, useMemo } from "react";
import MusicRecommendation from "./MusicRecommendation";
import SongSummaryModal from "./SongSummaryModal";

interface SongLibraryProps {
  songs: Song[];
  hasPremium: boolean;
}

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "Infantis", label: "Infantis" },
  { id: "Clássicos", label: "Clássicos" },
  { id: "Sertanejos", label: "Sertanejos" },
  { id: "Religiosos", label: "Religiosos" },
  { id: "Grandes Sucessos", label: "Grandes Sucessos" },
];

export default function SongLibrary({ songs, hasPremium }: SongLibraryProps) {
  const { playClick } = useSFX();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSongForSummary, setSelectedSongForSummary] = useState<Song | null>(null);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch = 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === "all" || song.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [songs, searchTerm, selectedCategory]);

  const isFiltering = searchTerm.length > 0 || selectedCategory !== "all";

  // Extract unique categories from filtered results for the grouped view
  const categoriesToRender = useMemo(() => {
    if (isFiltering) return []; // In grid mode, we don't group by category rows
    return Array.from(new Set(songs.map((s) => s.category)));
  }, [isFiltering, songs]);

  const getDifficultyStars = (diff: string) => {
    switch (diff) {
      case "Fácil": return "★☆☆";
      case "Médio": return "★★☆";
      case "Difícil": return "★★★";
      default: return "★☆☆";
    }
  };

  return (
    <div className="flex flex-col gap-8 mt-4">
      
      {/* ── Filter Bar ──────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 items-end md:items-center justify-between mb-4 px-2">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0 w-full md:w-auto">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center justify-center px-6 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 border ${
                  isActive
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white/60"
                }`}
              >
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/20 group-focus-within:text-cyan transition-colors" />
          </div>
          <input
            type="text"
            placeholder="O que vamos tocar hoje?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan/50 focus:bg-white/[0.06] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isFiltering ? (
          /* ── Grouped Carousel View ──────────────────────────── */
          <motion.div
            key="grouped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {categoriesToRender.map((category, catIndex) => {
              const categorySongs = songs.filter((s) => s.category === category);
              if (categorySongs.length === 0) return null;

              return (
                <div key={category} className="flex flex-col">
                  <h2 className="text-xl md:text-2xl font-bold text-white/90 mb-4 px-2">
                    {category}
                  </h2>

                  <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-4 pb-4 px-2">
                    {categorySongs.map((song, i) => (
                      <SongCard 
                        key={song.id} 
                        song={song} 
                        hasPremium={hasPremium} 
                        catIndex={catIndex} 
                        i={i} 
                        playClick={playClick} 
                        getDifficultyStars={getDifficultyStars} 
                        onSelect={() => setSelectedSongForSummary(song)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* ── Filtered Grid View ──────────────────────────── */
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl md:text-2xl font-bold text-white/90">
                {searchTerm ? `Resultados para "${searchTerm}"` : selectedCategory}
              </h2>
              <span className="text-sm text-white/40">{filteredSongs.length} músicas encontradas</span>
            </div>

            {filteredSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-2">
                {filteredSongs.map((song, i) => (
                  <SongCard 
                    key={song.id} 
                    song={song} 
                    hasPremium={hasPremium} 
                    catIndex={0} 
                    i={i} 
                    playClick={playClick} 
                    getDifficultyStars={getDifficultyStars} 
                    onSelect={() => setSelectedSongForSummary(song)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-white/20 gap-4">
                <Search className="w-12 h-12 opacity-50" />
                <p className="text-lg">Nenhuma música encontrada...</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="text-sm text-cyan hover:underline"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Music Recommendation Section (Gemini Style) ── */}
      <MusicRecommendation hasPremium={hasPremium} />

      {/* ── Song Summary Modal (Pre-Game) ── */}
      <SongSummaryModal 
        song={selectedSongForSummary}
        isOpen={!!selectedSongForSummary}
        onClose={() => setSelectedSongForSummary(null)}
      />
    </div>
  );
}

/* ── Song Card Sub-component ── */
interface SongCardProps {
  song: Song;
  hasPremium: boolean;
  catIndex: number;
  i: number;
  playClick: () => void;
  getDifficultyStars: (diff: string) => string;
  onSelect: () => void;
}

function SongCard({ song, hasPremium, catIndex, i, playClick, getDifficultyStars, onSelect }: SongCardProps) {
  const isLocked = song.isPremium && !hasPremium;
  
  const handleClick = (e: React.MouseEvent) => {
    if (!isLocked) {
      e.preventDefault();
      playClick();
      onSelect();
    }
  };

  return (
    <Link
      href={isLocked ? "/#pricing" : "#"}
      onClick={handleClick}
      className="flex-none w-56 md:w-64 snap-start group relative transition-transform duration-300 hover:scale-105"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: catIndex * 0.1 + i * 0.05 }}
        className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 border border-white/10"
      >
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
            <span className="text-gradient font-black text-sm tracking-widest">
              {getDifficultyStars(song.difficulty)}
            </span>
            <span className="text-xs text-white/40">{song.notes.length} notas</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl ${
              isLocked
                ? "bg-rose-500/30 border border-rose-500/50 text-rose-300"
                : "bg-cyan/30 border border-cyan/50 icon-gradient"
            }`}
          >
            {isLocked ? (
              <Lock size={24} className="ml-0.5" />
            ) : (
              <Play size={24} className="ml-1" />
            )}
          </div>
        </div>

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
}
