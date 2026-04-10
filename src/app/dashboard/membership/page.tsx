"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Header from "@/components/Header";
import {
  Crown,
  Music,
  Zap,
  Shield,
  Headphones,
  Star,
  ExternalLink,
  ArrowLeft,
  Loader2,
  CalendarDays,
  CreditCard,
} from "lucide-react";

interface SubData {
  status: string;
  planType: string;
  hasAccess: boolean;
  customerId: string | null;
  interval: string | null;
  currentPeriodEnd: string | null;
}

export default function MembershipPage() {
  const router = useRouter();
  const [subData, setSubData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/stripe-check");
        const data = await res.json();
        setSubData(data);

        // Se não tem assinatura ativa, redireciona para pricing
        if (!data.hasAccess) {
          router.replace("/#pricing");
          return;
        }
      } catch {
        router.replace("/#pricing");
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [router]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <div className="pt-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 icon-gradient animate-spin" />
          <p className="text-sm text-white/40">Verificando assinatura...</p>
        </div>
      </main>
    );
  }

  // This should not render if redirect happened, but as safety:
  if (!subData?.hasAccess) return null;

  const isYearly = subData.planType === "yearly";
  const renewDate = subData.currentPeriodEnd
    ? new Date(subData.currentPeriodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  const benefits = [
    {
      icon: <Music className="w-5 h-5" />,
      title: "Acesso a todas as músicas",
      description: "Biblioteca completa incluindo clássicos e músicas exclusivas.",
      active: true,
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "Modo Profissional",
      description: "Desbloqueie dificuldade PRO com janela de tempo reduzida.",
      active: true,
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Prática livre ilimitada",
      description: "Pratique o quanto quiser, sem limites de sessão.",
      active: true,
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: "Conexão MIDI",
      description: "Conecte seu teclado via WebMIDI para feedback em tempo real.",
      active: true,
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Progresso salvo",
      description: "Seus scores e combos são salvos automaticamente na nuvem.",
      active: true,
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: isYearly ? "Músicas exclusivas" : "Upgrade para Anual",
      description: isYearly
        ? "Acesso antecipado a novos conteúdos e músicas premium."
        : "Assine o plano anual e ganhe 2 meses grátis + músicas exclusivas.",
      active: isYearly,
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
        {/* Back */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </motion.div>

        {/* Plan Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="glass rounded-2xl border border-white/[0.06] overflow-hidden mb-8"
        >
          {/* Gradient header accent */}
          <div className={`h-1 w-full ${isYearly ? "bg-gradient-to-r from-cyan via-emerald-400 to-cyan" : "bg-gradient-to-r from-cyan/60 to-cyan/30"}`} />

          <div className="p-8 md:p-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isYearly ? "bg-gradient-to-br from-cyan/20 to-emerald-400/20" : "bg-cyan/10"}`}>
                    <Crown className={`w-5 h-5 ${isYearly ? "text-emerald-400" : "icon-gradient"}`} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">
                      {isYearly ? "Pianify Pro Anual" : "Pianify Pro Mensal"}
                    </h1>
                    <p className="text-xs text-white/35">Sua Jornada Musical</p>
                  </div>
                  {isYearly && (
                    <span className="ml-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-full">
                      Mais popular
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-bold text-white">
                    {isYearly ? "R$ 239,90" : "R$ 29,90"}
                  </span>
                  <span className="text-sm text-white/35">
                    {isYearly ? "/ano" : "/mês"}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativo
                </span>
              </div>
            </div>

            {/* Renewal info */}
            <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <CalendarDays className="w-4 h-4" />
                <span>Renova em <span className="text-white/70 font-medium">{renewDate}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <CreditCard className="w-4 h-4" />
                <span>Cobrança {isYearly ? "anual" : "mensal"} automática</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/30 mb-5">
            Seus benefícios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className={`glass rounded-xl p-5 border transition-all duration-300 ${
                  b.active
                    ? "border-white/[0.06] hover:border-white/[0.12]"
                    : "border-white/[0.03] opacity-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    b.active ? "bg-cyan/10 text-magenta font-bold" : "bg-white/5 text-white/20"
                  }`}>
                    {b.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{b.title}</h3>
                      {b.active ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 bg-white/5 px-1.5 py-0.5 rounded">
                          Upgrade
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-1 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-black bg-white rounded-xl transition-all duration-300 hover:bg-white/90 hover:shadow-[0_2px_20px_rgba(255,255,255,0.15)] active:scale-[0.97] disabled:opacity-50"
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {portalLoading ? "Carregando..." : "Gerenciar no Stripe"}
          </button>

          <Link
            href="/dashboard/songs"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/[0.06] border border-white/[0.08] rounded-xl transition-all duration-300 hover:bg-white/[0.1] active:scale-[0.97]"
          >
            <Music className="w-4 h-4" />
            Ir para Músicas
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
