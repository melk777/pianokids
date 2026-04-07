"use client";

import { motion } from "framer-motion";
import Header from "@/components/Header";
import { songs } from "@/lib/songs";
import { useState, useEffect } from "react";
import SongLibrary from "@/components/SongLibrary";
import { Loader2 } from "lucide-react";

import { useSubscription } from "@/hooks/useSubscription";

export default function SongsPage() {
  const { hasAccess: hasPremium, loading: isLoading } = useSubscription();

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <div className="pt-28 pb-32 px-4 md:px-8 max-w-[1400px] mx-auto overflow-hidden">
        {/* Header Hero */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 px-2"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            Biblioteca
          </h1>
          <p className="text-lg text-white/40">
            Explore nosso catálogo premium categorizado por dificuldade e estilos.
          </p>
        </motion.div>

        {/* Content Loading or Netflix UI */}
        {isLoading ? (
          <div className="flex flex-col h-64 items-center justify-center text-white/30 gap-4 mt-20">
            <Loader2 className="w-10 h-10 animate-spin icon-gradient" />
            <p>Carregando catálogo...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SongLibrary songs={songs} hasPremium={hasPremium} />
          </motion.div>
        )}
      </div>
    </main>
  );
}
