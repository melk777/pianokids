"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { songs } from "@/lib/songs";
import { useState, useEffect } from "react";
import {
  Play,
  Lock,
  Crown,
  ChevronRight,
  Music,
  Star,
  Loader2,
  Wifi,
  WifiOff,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMIDI } from "@/hooks/useMIDI";
import Header from "@/components/Header";

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { isSupported, isConnected, connect, devices, error: midiError } = useMIDI();

  const [subStatus, setSubStatus] = useState<{
    isSubscribed: boolean;
    loading: boolean;
  }>({
    isSubscribed: false,
    loading: true,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/auth/stripe-check");
        const data = await res.json();
        setSubStatus({
          isSubscribed: data.hasAccess,
          loading: false,
        });
      } catch (error) {
        console.error("Erro ao verificar assinatura:", error);
        setSubStatus({ isSubscribed: false, loading: false });
      }
    };
    fetchStatus();
  }, []);

  const handleSubscriptionAction = async () => {
    if (subStatus.isSubscribed) {
      router.push("/dashboard/songs");
    } else {
      router.push("/#pricing");
    }
  };

  const handlePortal = () => {
    router.push("/dashboard/membership");
  };

  /* ── Greeting based on time of day ── */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName =
    isLoaded && user ? user.firstName || user.username || "Aluno" : "...";

  return (
    <>
      <Header />

      <main className="min-h-screen bg-black text-white selection:bg-cyan/30">
        <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
          {/* ── Greeting ──────────────────────────── */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              {getGreeting()},{" "}
              <span className="text-cyan">{firstName}</span>!
            </h1>
            <p className="text-white/50 text-lg max-w-2xl">
              Bom ver você de volta. Continue sua jornada musical.
            </p>
          </motion.div>

          {/* ── Dashboard Grid ────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: MIDI Status + Actions + Lessons */}
            <div className="lg:col-span-2 space-y-8">
              {/* ── MIDI Status Card (Apple-style) ── */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
              >
                {/* Subtle gradient background */}
                <div
                  className={`absolute inset-0 transition-colors duration-700 ${
                    isConnected
                      ? "bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-cyan/[0.04]"
                      : "bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01]"
                  }`}
                />

                <div className="relative p-6 backdrop-blur-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                          isConnected
                            ? "bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                            : "bg-white/[0.05] text-white/30"
                        }`}
                      >
                        {isConnected ? (
                          <Wifi className="w-5 h-5" />
                        ) : (
                          <WifiOff className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white/90 mb-1">
                          Status MIDI
                        </h3>
                        {isConnected ? (
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <p className="text-sm text-emerald-400 font-medium">
                              Piano detectado! Pronto para praticar
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-white/40">
                            Nenhum teclado detectado
                          </p>
                        )}

                        {/* Device list */}
                        {isConnected && devices.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {devices.map((device) => (
                              <span
                                key={device.id}
                                className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50"
                              >
                                🎹 {device.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Error message */}
                        {midiError && (
                          <p className="mt-2 text-xs text-red-400/80">
                            {midiError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Connect button */}
                    {!isConnected && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={connect}
                        disabled={!isSupported}
                        className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Conectar
                      </motion.button>
                    )}
                  </div>

                  {/* WebMIDI not supported warning */}
                  {!isSupported && (
                    <p className="mt-3 text-xs text-white/25 border-t border-white/[0.04] pt-3">
                      WebMIDI não suportado neste navegador. Use Chrome ou Edge.
                    </p>
                  )}
                </div>
              </motion.div>

              {/* ── Giant Redirect Card ── */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Link href="/dashboard/songs" className="block group outline-none">
                  <div className="relative p-8 rounded-3xl glass glass-hover transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,234,255,0.15)] flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan/20 to-magenta/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex items-center justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-cyan transition-colors duration-300">
                        <Music className="w-8 h-8" />
                      </div>
                      <ChevronRight className="w-8 h-8 text-white/20 group-hover:text-cyan group-hover:translate-x-2 transition-all duration-300" />
                    </div>

                    <div className="relative z-10 w-full max-w-lg">
                      <h3 className="text-3xl font-bold mb-2 group-hover:text-white transition-colors">
                        Explorar Biblioteca
                      </h3>
                      <p className="text-base text-white/50 group-hover:text-white/70 transition-colors">
                        Acesse todo o nosso acervo de músicas infantis e clássicas prontas para tocar. 
                        Inclui o novo modo Prática Livre!
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* ── Gamification: Meu Progresso ── */}
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Meu Progresso</h2>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass p-5 rounded-2xl flex flex-col gap-1 border border-white/5 relative overflow-hidden">
                     <div className="absolute -right-4 -bottom-4 opacity-10"><Play size={64}/></div>
                     <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Músicas Concluídas</span>
                     <span className="text-3xl font-bold text-white">0</span>
                  </div>
                  <div className="glass p-5 rounded-2xl flex flex-col gap-1 border border-white/5 relative overflow-hidden">
                     <div className="absolute -right-4 -bottom-4 opacity-10"><Crown size={64}/></div>
                     <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Ofensiva Atual (Dias)</span>
                     <span className="text-3xl font-bold text-magenta">0</span>
                  </div>
                </div>

                {/* Medals Grid (Mock) */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { name: "Primeira Nota", icon: <Star className="w-6 h-6" />, active: true, color: "text-amber-400 bg-amber-400/10 border-amber-400/30", shadow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]" },
                    { name: "Mestre do Ritmo", icon: <Crown className="w-6 h-6" />, active: false, color: "text-white/20 bg-black/40 border-white/5", shadow: "" },
                    { name: "Combo x10", icon: <Music className="w-6 h-6" />, active: false, color: "text-white/20 bg-black/40 border-white/5", shadow: "" },
                    { name: "Mozart", icon: <Crown className="w-6 h-6" />, active: false, color: "text-white/20 bg-black/40 border-white/5", shadow: "" },
                  ].map((medal, i) => (
                    <div key={i} className={`flex flex-col items-center gap-3 p-4 rounded-2xl border ${medal.color} ${medal.shadow} transition-all duration-300`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${medal.active ? 'bg-amber-400/20' : 'bg-white/5'}`}>
                         {medal.icon}
                      </div>
                      <span className="text-[10px] text-center font-medium opacity-70 uppercase tracking-wider">{medal.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* Locked Module Suggestion */}
                {!subStatus.isSubscribed && !subStatus.loading && (
                  <div className="glass p-5 rounded-xl flex items-center gap-4 border border-magenta/20 bg-magenta/5 mt-6 group">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-magenta/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Lock className="w-5 h-5 text-magenta" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-medium text-white/90 mb-0.5">
                        Acesso Completo
                      </h4>
                      <p className="text-xs text-white/50 mb-3">
                        As medalhas e a maioria das músicas requerem um plano ativo.
                      </p>
                      <button
                        onClick={() => router.push("/#pricing")}
                        className="text-xs font-semibold text-magenta hover:text-magenta/80 transition-colors flex items-center gap-1"
                      >
                        Ver planos premium <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.section>
            </div>

            {/* ── Right Column: Subscription + Stats ── */}
            <div className="space-y-6">
              {/* Subscription Card */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="glass rounded-2xl p-1 relative overflow-hidden group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    subStatus.isSubscribed
                      ? "from-magenta/20 to-cyan/20"
                      : "from-white/10 to-transparent"
                  } opacity-50 block`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${
                    subStatus.isSubscribed
                      ? "from-cyan via-magenta to-cyan opacity-20 group-hover:opacity-40"
                      : "from-white/5 to-white/5 opacity-10"
                  } blur-xl transition-opacity duration-700`}
                />

                <div className="relative bg-black/80 backdrop-blur-xl rounded-[14px] p-6 h-full flex flex-col border border-white/10">
                  {subStatus.loading ? (
                    <div className="flex flex-col items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            subStatus.isSubscribed
                              ? "bg-gradient-to-br from-magenta to-cyan shadow-[0_0_20px_rgba(255,0,229,0.3)]"
                              : "bg-white/10"
                          }`}
                        >
                          <Crown
                            className={`w-5 h-5 ${
                              subStatus.isSubscribed
                                ? "text-white"
                                : "text-white/40"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">
                            {subStatus.isSubscribed
                              ? "Plano Pro"
                              : "Plano Gratuito"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                subStatus.isSubscribed
                                  ? "bg-green-400 animate-pulse"
                                  : "bg-white/20"
                              }`}
                            />
                            <span
                              className={`text-xs font-medium uppercase tracking-widest ${
                                subStatus.isSubscribed
                                  ? "text-green-400"
                                  : "text-white/40"
                              }`}
                            >
                              {subStatus.isSubscribed ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-white/60 mb-6 leading-relaxed">
                        {subStatus.isSubscribed
                          ? "Você tem acesso ilimitado a todas as lições, músicas e ferramentas de prática da plataforma."
                          : "Você está no plano gratuito. Desbloqueie todo o poder do PianoKids assinando o Premium."}
                      </p>

                      <button
                        onClick={handleSubscriptionAction}
                        className={`mt-auto w-full py-2.5 px-4 font-semibold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                          subStatus.isSubscribed
                            ? "bg-white text-black hover:bg-white/90"
                            : "bg-gradient-to-r from-cyan to-magenta text-white shadow-[0_0_20px_rgba(0,234,255,0.2)] hover:shadow-[0_0_30px_rgba(0,234,255,0.4)]"
                        }`}
                      >
                        {subStatus.isSubscribed
                          ? "Acessar Aulas"
                          : "Assinar Agora"}
                      </button>

                      {/* Gerenciar Assinatura (only if subscribed) */}
                      {subStatus.isSubscribed && (
                        <button
                          onClick={handlePortal}
                          className="mt-3 w-full py-2 px-4 text-sm font-medium rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Gerenciar Assinatura
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* ── Quick Stats Summary ── */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-6">
                  Resumo de Progresso
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex flex-col mb-2">
                      <span className="text-3xl font-bold text-white mb-1">
                        12
                      </span>
                      <span className="text-sm text-white/50 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-cyan" /> Coroas ganhas
                      </span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/5" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Tempo de Prática
                    </span>
                    <span className="text-sm font-medium text-white">
                      2h 45m
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Dias Seguidos
                    </span>
                    <span className="text-sm font-medium text-white flex items-center gap-1">
                      <span className="text-orange-500">🔥</span> 3 dias
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Precisão Média
                    </span>
                    <span className="text-sm font-medium text-cyan">87%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Músicas Concluídas
                    </span>
                    <span className="text-sm font-medium text-white">
                      1 / {songs.length}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
