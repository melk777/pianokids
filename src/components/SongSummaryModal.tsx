"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Hand, Play, ArrowLeft } from "lucide-react";
import Image from "next/image";
import type { Song } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX";
import { type Difficulty, DIFFICULTY_LABELS } from "@/lib/songFilters";

interface SongSummaryModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

const difficultyCards: Array<{ id: Difficulty; label: string; tone: string }> = [
  { id: "beginner", label: "Fácil", tone: "emerald" },
  { id: "medium", label: "Intermediário", tone: "amber" },
  { id: "pro", label: "Difícil", tone: "rose" },
];

type PracticeHandMode = "right" | "both";

const practiceModeCards: Array<{
  id: PracticeHandMode;
  label: string;
  description: string;
  iconClassName?: string;
}> = [
  { id: "right", label: "Mão direita", description: "Treino focado para iniciar com clareza." },
  { id: "both", label: "Duas mãos", description: "Versão completa da música no teclado." },
];

export default function SongSummaryModal({ song, isOpen, onClose }: SongSummaryModalProps) {
  const router = useRouter();
  const { playClick } = useSFX();

  const [practiceHandMode, setPracticeHandMode] = useState<PracticeHandMode>("right");
  const [micEnabled, setMicEnabled] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("beginner");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPracticeHandMode("right");
    setMicEnabled(false);
    setSelectedDifficulty("beginner");
    setIsStarting(false);
  }, [isOpen]);

  const difficultyAccent = useMemo(() => {
    if (selectedDifficulty === "pro") return "text-rose-300";
    if (selectedDifficulty === "medium") return "text-amber-300";
    return "text-emerald-300";
  }, [selectedDifficulty]);

  if (!song) return null;

  const categoryLabel = song.categories?.length ? song.categories.join(" • ") : song.category;

  const handleStart = async () => {
    if (isStarting) return;

    playClick();
    setIsStarting(true);
    const params = new URLSearchParams();
    params.set("leftHand", String(practiceHandMode === "both"));
    params.set("rightHand", "true");
    params.set("mic", micEnabled.toString());
    params.set("difficulty", selectedDifficulty);
    const targetHref = `/dashboard/play/${song.id}?${params.toString()}`;

    try {
      const response = await fetch("/api/auth/stripe-check", {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as { hasAccess?: boolean };
        if (!data.hasAccess) {
          const subscriptionHref = "/dashboard/subscription";
          if (typeof window !== "undefined") {
            window.location.assign(subscriptionHref);
            return;
          }
          router.push(subscriptionHref);
          return;
        }
      }
    } catch {
      // Se a verificacao falhar momentaneamente, seguimos para o jogo e deixamos o middleware decidir.
    }

    if (typeof window !== "undefined") {
      window.location.assign(targetHref);
      return;
    }
    router.push(targetHref);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}>
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(1px 1px at 20px 30px, white, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, white, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, white, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, white, rgba(0,0,0,0)), radial-gradient(1px 1px at 130px 80px, white, rgba(0,0,0,0))",
                backgroundSize: "200px 200px",
              }}
            />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative flex w-full max-w-5xl flex-col items-center gap-6 md:flex-row"
            onClick={(event) => event.stopPropagation()}
          >
            <button onClick={onClose} className="absolute left-0 -top-12 text-white/40 transition-colors hover:text-white md:-left-16 md:top-0">
              <ArrowLeft size={32} />
            </button>

            <div className="group perspective-1000 relative">
              <div className="animate-pulse-slow absolute -inset-4 rounded-full border border-white/5" />
              <div className="absolute -inset-8 rounded-full border border-white/5 opacity-50" />

              <div className="relative h-48 w-48 overflow-hidden rounded-full border-8 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)] ring-2 ring-white/10 transition-transform duration-500 group-hover:scale-[1.02] md:h-72 md:w-72">
                <Image
                  src={song.coverUrl || "/images/covers/default.png"}
                  alt={song.title}
                  fill
                  className="object-cover brightness-75 transition-all duration-700 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-6 rounded-[32px] border border-white/10 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-widest text-cyan/60">{categoryLabel}</span>
                <h2 className="text-3xl font-black text-[#FDFCF0] md:text-4xl">{song.title}</h2>
                <p className="text-lg font-medium text-white/40">{song.artist}</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-[4px] text-white/30">Nível e modo de prática</h3>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black tracking-widest ${difficultyAccent}`}>NÍVEL {DIFFICULTY_LABELS[selectedDifficulty].toUpperCase()}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        animate={{
                          width: selectedDifficulty === "pro" ? "100%" : selectedDifficulty === "medium" ? "66%" : "33%",
                          backgroundColor: selectedDifficulty === "pro" ? "#FB7185" : selectedDifficulty === "medium" ? "#F59E0B" : "#10B981",
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {difficultyCards.map((level) => {
                    const isActive = selectedDifficulty === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => {
                          playClick();
                          setSelectedDifficulty(level.id);
                        }}
                        className={`rounded-2xl border px-3 py-3 text-center transition-all ${
                          isActive
                            ? level.tone === "emerald"
                              ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                              : level.tone === "amber"
                                ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                                : "border-rose-400/40 bg-rose-400/15 text-rose-200"
                            : "border-white/8 bg-white/[0.03] text-white/40 hover:border-white/15 hover:text-white/70"
                        }`}
                      >
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em]">{level.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {practiceModeCards.map((mode) => {
                    const isActive = practiceHandMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          playClick();
                          setPracticeHandMode(mode.id);
                        }}
                        className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                          isActive
                            ? "border-white bg-zinc-100 text-zinc-900 shadow-[0_0_30px_rgba(255,255,255,0.1)] outline outline-4 outline-white/10"
                            : "border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                              isActive ? "bg-zinc-900 text-white" : "bg-white/5 text-white/40"
                            }`}
                          >
                            <Hand
                              size={24}
                              className={mode.id === "both" ? "scale-110" : "scale-110 -translate-x-0.5"}
                            />
                          </div>
                          <div className="space-y-1">
                            <span
                              className={`block text-[11px] font-black uppercase tracking-[0.22em] ${
                                isActive ? "text-zinc-900" : "text-white/70"
                              }`}
                            >
                              {mode.label}
                            </span>
                            <p className={`text-sm leading-relaxed ${isActive ? "text-zinc-700" : "text-white/35"}`}>
                              {mode.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="group flex cursor-pointer items-center justify-between rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.05]"
                onClick={() => {
                  playClick();
                  setMicEnabled(!micEnabled);
                }}
              >
                <div className="flex items-center gap-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 ${micEnabled ? "bg-cyan text-black shadow-[0_0_20px_rgba(0,234,255,0.4)]" : "bg-white/5 text-white/20"}`}>
                    {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Modo reconhecimento</h4>
                    <p className="text-sm text-white/30">Usar microfone para validar notas</p>
                  </div>
                </div>

                <div className={`relative h-6 w-12 rounded-full p-1 transition-all duration-300 ${micEnabled ? "bg-cyan" : "bg-red-500/20"}`}>
                  <motion.div animate={{ x: micEnabled ? 24 : 0 }} className={`h-4 w-4 rounded-full shadow-lg ${micEnabled ? "bg-white" : "bg-red-500"}`} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className={`group relative mt-2 h-16 w-full overflow-hidden rounded-full shadow-[0_20px_40px_-10px_rgba(249,115,22,0.45)] transition-all duration-500 ${
                  isStarting ? "cursor-wait opacity-90" : "opacity-100 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                <div className="absolute inset-0 animate-gradient-slow bg-gradient-to-r from-orange-500 via-orange-400 to-red-500 bg-[length:200%_100%]" />

                <div className="relative flex h-full items-center justify-between px-8">
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-black tracking-[2px] text-white">Começar a tocar.</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                      {isStarting ? "Abrindo..." : micEnabled ? "Microfone ligado" : "Sem microfone"}
                    </span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md transition-all group-hover:bg-white/40">
                    <Play size={20} fill="currentColor" className="ml-1 text-white" />
                  </div>
                </div>
              </button>

              <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-white/10">
                <span>MIDI SUPPORT: ON</span>
                <span>BPM: {song.bpm}</span>
                <span>
                  ESTIMATED: {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
