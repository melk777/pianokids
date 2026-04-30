"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import {
  Play,
  Lock,
  Crown,
  ChevronRight,
  Music,
  Star,
  Loader2,
  Mic,
  MicOff,
  CreditCard,
  Clock,
  Gauge,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAudioInput } from "@/hooks/useAudioInput";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useSFX } from "@/hooks/useSFX";
import { createClientComponent } from "@/lib/supabase";
import { loadSongs } from "@/lib/songCatalog";
import type { PracticeSession } from "@/lib/types";
import {
  buildPracticeAchievements,
  buildPracticeGoals,
  buildPracticeProgressInsight,
  buildPracticeRecommendation,
  type PracticeAchievement,
  type PracticeRecommendation,
} from "@/lib/practiceProgress";
import { trackEvent } from "@/lib/analytics";
const TeacherDashboard = dynamic(() => import("@/components/TeacherDashboard"), {
  loading: () => null,
});
const AdminDashboard = dynamic(() => import("@/components/AdminDashboard"), {
  loading: () => null,
});

export default function Dashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);
  const { playClick } = useSFX();
  const { profile, loading: profileLoading } = useProfile();
  const { status, currentPeriodEnd, isPro, hasAccess, loading: subscriptionLoading, planType } = useSubscription();
  const isSubscribed = isPro; // No Dashboard, 'isSubscribed' agora significa ter acesso PRO (pago)
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [songCount, setSongCount] = useState(0);
  const [songs, setSongs] = useState<Awaited<ReturnType<typeof loadSongs>>>([]);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const { isSupported, isListening, start: startMic, error: audioError, activeAudioNote, activeAudioNotes } = useAudioInput();
  const detectedNoteNames = activeAudioNotes.length > 0
    ? activeAudioNotes.map((note) => note.name)
    : activeAudioNote
    ? [activeAudioNote.name]
    : [];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setIsLoaded(true);
      }
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    loadSongs().then((catalog) => {
      if (!mounted) return;
      setSongs(catalog);
      setSongCount(catalog.length);
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

  // Ativação automática do microfone
  useEffect(() => {
    if (isSupported && !isListening) {
      startMic();
    }
  }, [isSupported, isListening, startMic]);

  const handleSubscribe = async (planKey: string) => {
    try {
      trackEvent("checkout_started", { source: "dashboard", planKey });
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });

      const data = await res.json();

      // Se o usuário não estiver logado no servidor, redireciona
      if (res.status === 401 && data.redirect) {
        router.push(data.redirect);
        return;
      }

      if (data.url) {
        trackEvent("checkout_redirected", { source: "dashboard", planKey });
        window.location.assign(data.url);
      } else if (data.error) {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Erro ao iniciar checkout.");
    }
  };

  const handleSubscriptionAction = async () => {
    if (hasAccess) {
      router.push("/dashboard/songs");
    } else {
      // Força o checkout do plano mensal por padrão se clicar no botão geral
      await handleSubscribe("monthly");
    }
  };

  const handlePortal = () => {
    router.push("/dashboard/subscription");
  };

  /* ── Greeting based on time of day ── */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };
  
  const getTrialDays = () => {
    if (status !== "trialing" || !currentPeriodEnd) return null;
    const now = new Date();
    const end = new Date(currentPeriodEnd);
    const diffTime = Math.max(0, end.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const diffDays = getTrialDays();

  if (profileLoading || subscriptionLoading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan/20 border-t-cyan animate-spin" />
          <p className="text-white/40 text-sm font-bold animate-pulse uppercase tracking-widest">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const firstName = (isLoaded && user) ? (user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Aluno") : "...";
  const progressInsight = buildPracticeProgressInsight(profile, recentSessions);
  const achievements = buildPracticeAchievements(profile, recentSessions);
  const goals = buildPracticeGoals(profile, recentSessions);
  const recommendation = buildPracticeRecommendation(profile, recentSessions, songs);
  const insightToneClass = {
    start: "border-cyan/20 bg-cyan/5 text-cyan",
    review: "border-amber-300/20 bg-amber-300/5 text-amber-200",
    steady: "border-emerald-300/20 bg-emerald-300/5 text-emerald-200",
    advance: "border-magenta/20 bg-magenta/5 text-magenta",
  }[progressInsight.tone];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan/30">
      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
          {/* ── Greeting ────────────────────────── */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-balance">
              {getGreeting()},{" "}
              <Link href="/dashboard/profile" className="text-gradient font-black hover:opacity-80 transition-opacity">
                {profile?.full_name?.split(" ")[0] || firstName}
              </Link>!
            </h1>
            <p className="text-white/50 text-lg max-w-2xl">
              {profile?.role === "teacher" 
                ? "Gestão Administrativa: Acompanhe o progresso de seus alunos e gerencie seu link de indicações."
                : profile?.trophies && profile.trophies > 1 
                ? "Você está indo muito bem! Continue praticando para ganhar mais troféus." 
                : "Seu primeiro troféu de boas-vindas já está na sua estante! Vamos tocar?"}
            </p>
          </div>

          {profile?.role === "admin" ? (
             <AdminDashboard />
          ) : profile?.role === "teacher" ? (
             <TeacherDashboard />
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: MIDI Status + Actions + Lessons */}
            <div className="lg:col-span-2 space-y-8">
              {/* ── MIDI Status Card (Apple-style) ── */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
                {/* Subtle gradient background */}
                <div
                  className={`absolute inset-0 transition-colors duration-700 ${
                    isListening
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
                          isListening
                            ? "bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                            : "bg-white/[0.05] text-white/30 font-bold"
                        }`}
                      >
                        {isListening ? (
                          <Mic className="w-5 h-5" />
                        ) : (
                          <MicOff className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white/90 mb-1">
                          Status Microfone
                        </h3>
                        {isListening ? (
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <p className="text-sm text-emerald-400 font-medium">
                              Microfone ligado e pronto!
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-white/40">
                            Microfone desligado
                          </p>
                        )}

                        {/* Audio Note Feedback */}
                        {isListening && detectedNoteNames.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                             <div className="text-xs px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20 text-white font-bold animate-pulse">
                               Capturando: <span className="text-gradient font-black">{detectedNoteNames.join(" + ")}</span>
                             </div>
                          </div>
                        )}

                        {/* Error message */}
                        {audioError && (
                          <p className="mt-2 text-xs text-red-400/80">
                            {audioError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Connect button */}
                    {!isListening && (
                      <button
                        onClick={() => {
                          playClick();
                          startMic();
                        }}
                        disabled={!isSupported}
                        className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Ligar Microfone
                      </button>
                    )}
                  </div>

                  {/* Recognition Info */}
                  {isListening && (
                    <p className="mt-3 text-[10px] text-white/20 border-t border-white/[0.04] pt-3 italic">
                      O chat de sugestões é um recurso exclusivo para nossa **Comunidade Premium**.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Giant Redirect Card ── */}
              <div>
                <Link 
                  href="/dashboard/songs" 
                  onClick={() => playClick()}
                  className="block group outline-none"
                >
                  <div className="relative p-8 rounded-3xl glass glass-hover transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,234,255,0.15)] flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan/20 to-magenta/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex items-center justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-cyan transition-colors duration-300">
                        <Music className="w-8 h-8" />
                      </div>
                      <ChevronRight className="w-8 h-8 text-white/20 group-hover:icon-gradient group-hover:translate-x-2 transition-all duration-300" />
                    </div>

                    <div className="relative z-10 w-full max-w-lg">
                      <h3 className="text-3xl font-bold mb-2 group-hover:text-white transition-colors">
                        Explorar Biblioteca
                      </h3>
                      <p className="text-base text-white/50 group-hover:text-white/70 transition-colors">
                        Acesse todo o nosso acervo de músicas clássicas e populares prontas para tocar. 
                        Inclui o novo modo Prática Livre!
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* ── Gamification: Meu Progresso ── */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Meu Progresso</h2>
                  <Link href="/dashboard/profile" className="text-xs font-bold text-white/40 hover:text-cyan transition-colors flex items-center gap-1">
                    Ver Perfil Completo <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass p-5 rounded-2xl flex flex-col gap-1 border border-white/5 relative overflow-hidden">
                     <div className="absolute -right-4 -bottom-4 opacity-10"><Play size={64}/></div>
                     <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Músicas Concluídas</span>
                     <span className="text-3xl font-bold text-white">{profile?.songs_completed || 0}</span>
                  </div>
                  <div className="glass p-5 rounded-2xl flex flex-col gap-1 border border-white/5 relative overflow-hidden">
                     <div className="absolute -right-4 -bottom-4 opacity-10"><Crown size={64}/></div>
                      <span className="text-xs text-white/40 uppercase tracking-widest font-semibold text-center leading-tight">
                        Sequência de dias ativos
                      </span>
                     <span className="text-3xl font-bold text-magenta">{profile?.streak_days || 0}</span>
                  </div>
                </div>

                <div className={`mb-6 rounded-2xl border p-5 ${insightToneClass}`}>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Proximo passo</p>
                      <h3 className="text-xl font-black text-white">{progressInsight.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{progressInsight.message}</p>
                    </div>
                    <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 md:flex">
                      {progressInsight.tone === "advance" ? <TrendingUp className="h-5 w-5" /> : <Gauge className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <ProgressInsightMetric label="Semana" value={`${progressInsight.weeklySessions} sessoes`} />
                    <ProgressInsightMetric label="Media recente" value={`${progressInsight.averageRecentAccuracy}%`} />
                    <ProgressInsightMetric label="Melhor" value={`${progressInsight.bestRecentAccuracy}%`} />
                  </div>

                  {progressInsight.focusSongTitle && (
                    <p className="mb-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/50">
                      Foco sugerido: <span className="font-bold text-white/75">{progressInsight.focusSongTitle}</span>
                    </p>
                  )}

                  <Link
                    href={progressInsight.actionHref}
                    onClick={() => {
                      playClick();
                      trackEvent("recommended_practice_clicked", {
                        source: "dashboard_progress_insight",
                        action: progressInsight.actionLabel,
                        href: progressInsight.actionHref,
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-white/90"
                  >
                    {progressInsight.actionLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {recommendation && (
                  <RecommendedLessonCard
                    recommendation={recommendation}
                    onClick={() => {
                      playClick();
                      trackEvent("recommended_practice_clicked", {
                        source: "dashboard_recommended_lesson",
                        songId: recommendation.songId,
                        difficulty: recommendation.difficulty,
                        handMode: recommendation.handMode,
                      });
                    }}
                  />
                )}

                <div className="mb-6 grid gap-3 md:grid-cols-3">
                  {goals.map((goal) => {
                    const percent = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
                    return (
                      <div key={goal.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{goal.title}</p>
                          <p className="text-xs font-black text-white">{goal.current}/{goal.target}{goal.unit === "%" ? "%" : ""}</p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan to-magenta transition-[width] duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {achievements.slice(0, 4).map((achievement) => (
                    <AchievementTile key={achievement.id} achievement={achievement} />
                  ))}
                </div>
                
                {/* Locked Module Suggestion */}
                {!isSubscribed && !subscriptionLoading && (
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
              </section>
            </div>

            {/* ── Right Column: Subscription + Stats ── */}
            <div className="space-y-6">
              {/* Trial Remaining Card (Static) */}
              {status === "trialing" && diffDays !== null && (
                <div className="glass rounded-2xl p-6 border border-cyan/20 bg-cyan/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock size={48} className="text-cyan" />
                  </div>
                  <div className="relative z-10 flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-cyan animate-pulse" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-cyan/80">Período de Teste</span>
                  </div>
                  <h4 className="text-xl font-bold mb-1">
                    {diffDays} {diffDays === 1 ? 'dia restante' : 'dias restantes'}
                  </h4>
                  <p className="text-xs text-white/40 mb-4">
                    Seu acesso Pro gratuito expira em breve. Aproveite todas as músicas!
                  </p>
                  <Link 
                    href="/#pricing" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-cyan transition-colors"
                  >
                    Garantir acesso vitalício <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Subscription Card */}
              <div className="glass rounded-2xl p-1 relative overflow-hidden group">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    isSubscribed
                      ? "from-magenta/20 to-cyan/20"
                      : "from-white/10 to-transparent"
                  } opacity-50 block`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${
                    isSubscribed
                      ? "from-cyan via-magenta to-cyan opacity-20 group-hover:opacity-40"
                      : "from-white/5 to-white/5 opacity-10"
                  } blur-xl transition-opacity duration-700`}
                />

                <div className="relative bg-black/80 backdrop-blur-xl rounded-[14px] p-6 h-full flex flex-col border border-white/10">
                  {subscriptionLoading ? (
                    <div className="flex flex-col items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isSubscribed
                              ? "bg-gradient-to-br from-magenta to-cyan shadow-[0_0_20px_rgba(255,0,229,0.3)]"
                              : "bg-white/10"
                          }`}
                        >
                          <Crown
                            className={`w-5 h-5 ${
                              isSubscribed
                                ? "text-white"
                                : "text-white/40"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">
                            {planType === "admin_granted" || planType === "special_access" ? "Acesso Especial" : 
                             planType === "yearly" ? "Pianify Pro (Anual)" :
                             planType === "monthly" ? "Pianify Pro (Mensal)" :
                             isSubscribed ? "Plano Pro" : "Plano Gratuito"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                hasAccess
                                  ? "bg-green-400 animate-pulse"
                                  : "bg-white/20"
                              }`}
                            />
                            <span
                              className={`text-xs font-medium uppercase tracking-widest ${
                                hasAccess
                                  ? "text-green-400"
                                  : "text-white/40"
                              }`}
                            >
                              {hasAccess ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-white/60 mb-6 leading-relaxed">
                        {hasAccess
                          ? "Você tem acesso ilimitado a todas as lições, músicas e ferramentas de prática da plataforma."
                          : "Você está no plano gratuito. Desbloqueie todo o poder do Pianify assinando o Premium."}
                      </p>

                      <button
                        onClick={() => {
                          playClick();
                          handleSubscriptionAction();
                        }}
                        className={`mt-auto w-full py-2.5 px-4 font-semibold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                          hasAccess
                            ? "bg-white text-black hover:bg-white/90"
                            : "bg-gradient-to-r from-cyan to-magenta text-white shadow-[0_0_20px_rgba(0,234,255,0.2)] hover:shadow-[0_0_30px_rgba(0,234,255,0.4)]"
                        }`}
                      >
                        {hasAccess
                          ? "Acessar Aulas"
                          : "Assinar Agora"}
                      </button>

                      {/* Gerenciar Assinatura (only if subscribed) */}
                      {isSubscribed && (
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
              </div>

              {/* ── Quick Stats Summary ── */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-6">
                  Resumo de Progresso
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex flex-col mb-2">
                      <span className="text-3xl font-bold text-white mb-1">
                        @{profile?.username || "pianify"}
                      </span>
                      <span className="text-sm text-white/50 flex items-center gap-1.5">
                        <Star className="w-4 h-4 icon-gradient" /> Troféus Ganhos
                      </span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/5" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Prática Total
                    </span>
                    <span className="text-sm font-medium text-white">
                      {Math.floor((profile?.total_practice_time || 0) / 60)}m
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Dias Seguidos
                    </span>
                    <span className="text-sm font-medium text-white flex items-center gap-1">
                      🔥 {profile?.streak_days || 0} dias
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Precisão Média
                    </span>
                    <span className="text-sm font-medium text-gradient font-bold">{profile?.average_accuracy || 0}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/50">
                      Músicas Concluídas
                    </span>
                    <span className="text-sm font-medium text-white">
                      {profile?.songs_completed || 0} / {songCount || "..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </main>
    );
}

function ProgressInsightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function AchievementTile({ achievement }: { achievement: PracticeAchievement }) {
  const toneClass = {
    gold: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    cyan: "border-cyan/30 bg-cyan/10 text-cyan",
    emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    magenta: "border-magenta/30 bg-magenta/10 text-magenta",
  }[achievement.tone];
  const percent = Math.min(100, Math.round((achievement.progress / Math.max(achievement.target, 1)) * 100));

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all ${achievement.achieved ? toneClass : "border-white/5 bg-black/40 text-white/25"}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${achievement.achieved ? "bg-white/15" : "bg-white/5"}`}>
        {achievement.id === "five-day-streak" ? <Crown className="h-5 w-5" /> : achievement.id === "precision-90" ? <Gauge className="h-5 w-5" /> : <Star className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-white">{achievement.title}</p>
        <p className="mt-1 text-[10px] leading-snug text-white/45">{achievement.description}</p>
      </div>
      <div className="mt-auto">
        <div className="mb-1 flex justify-between text-[9px] font-bold text-white/35">
          <span>{achievement.progress}</span>
          <span>{achievement.target}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-current transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

function RecommendedLessonCard({ recommendation, onClick }: { recommendation: PracticeRecommendation; onClick: () => void }) {
  const handLabel = recommendation.handMode === "both" ? "Duas maos" : recommendation.handMode === "left" ? "Mao esquerda" : "Mao direita";
  const difficultyLabel = recommendation.difficulty === "pro" ? "Profissional" : recommendation.difficulty === "medium" ? "Intermediario" : "Iniciante";

  return (
    <div className="mb-6 rounded-2xl border border-magenta/20 bg-magenta/5 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-magenta">
            <Sparkles className="h-3.5 w-3.5" />
            Aula recomendada
          </p>
          <h3 className="text-xl font-black text-white">{recommendation.songTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{recommendation.reason}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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

      <Link
        href={recommendation.href}
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-magenta px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:opacity-90"
      >
        Comecar agora
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
