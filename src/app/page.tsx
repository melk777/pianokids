"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music, Star, BarChart3, ChevronDown } from "lucide-react";

import Header from "@/components/Header";
import HeroAnimation from "@/components/HeroAnimation";
import PartnerMarquee from "@/components/PartnerMarquee";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import FAQ from "@/components/FAQ";
import PricingCard from "@/components/PricingCard";
import { useMIDI } from "@/hooks/useMIDI";
import { useJoseAudio } from "@/hooks/useJoseAudio";
import GalaxyBackground from "@/components/GalaxyBackground";




/* ──────────────────────────────────────────────────────
   Plan data (client-safe: no price IDs exposed)
   ────────────────────────────────────────────────────── */
const CLIENT_PLANS = {
  monthly: {
    name: "Mensal",
    price: "R$ 29,90",
    period: "/mês",
    features: [
      "Acesso a todas as músicas",
      "Prática livre ilimitada",
      "Reconhecimento via Microfone",
      "Progresso salvo",
    ],
  },
  yearly: {
    name: "Anual",
    price: "R$ 239,90",
    period: "/ano",
    features: [
      "Tudo do plano mensal",
      "2 meses grátis",
      "Músicas exclusivas",
      "Suporte prioritário",
    ],
    badge: "Mais popular",
  },
} as const;

export default function Home() {
  const router = useRouter();
  const { isSupported, connect, error } = useMIDI();

  const { playIntro, playSuccess, playError } = useJoseAudio();

  const [midiStatus, setMidiStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");


  const handleConnect = async () => {
    setMidiStatus("connecting");
    const success = await connect();
    setMidiStatus(success ? "connected" : "error");
  };

  /* ── Stripe checkout (com redirect p/ login se não autenticado) ── */
  const handleSubscribe = async (planKey: string) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });

    const data = await res.json();

    // Usuário não autenticado → redireciona para cadastro
    if (res.status === 401 && data.redirect) {
      router.push(data.redirect);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
    } else if (data.error) {
      alert(`Erro: ${data.error}`);
      console.error("Checkout error:", data.error);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-black">
        {/* ── Hero Section ──────────────────────────── */}
        <section className="relative min-h-screen px-6 py-24 lg:py-32 overflow-hidden flex items-center">
          {/* Animated Galaxy Background (Stars, Nebulas, Space Dust) */}
          <GalaxyBackground />


          <div className="relative z-10 max-w-7xl mx-auto w-full lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >

            {/* Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-xs text-white/60"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-glow-pulse" />
              Educação musical gamificada
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
              <span className="text-white">Aprenda piano</span>
              <br />
              <span className="bg-gradient-to-r from-cyan to-cyan/60 bg-clip-text text-transparent">
                brincando.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/50 max-w-2xl lg:max-w-none mx-auto lg:mx-0 mb-12 leading-relaxed font-medium">
              Conecte seu teclado MIDI e transforme cada nota em uma aventura.
              Músicas que caem como estrelas — acerte no tempo certo.
            </p>


            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConnect}
                disabled={midiStatus === "connecting"}
                className="btn-primary rounded-full px-10 py-5 text-lg flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-cyan/20"
              >
                {/* ... (keep inside logic) */}
                {midiStatus === "connecting" ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Conectando...
                  </>
                ) : midiStatus === "connected" ? (
                  <>Conectado!</>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    Começar Agora
                  </>
                )}
              </motion.button>

              <motion.a
                href="/dashboard"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary rounded-full px-10 py-5 text-lg flex items-center gap-2 border-2"
              >
                Explorar Dashboard
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.a>
            </div>


            {/* Test Jose Audio Buttons (Static refactor) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12 flex flex-wrap justify-center gap-4"
            >
              {[
                { label: "Intro (Oi!)", icon: "👋", action: playIntro },
                { label: "Acerto (Boa!)", icon: "⭐", action: playSuccess },
                { label: "Erro (Ops!)", icon: "💡", action: playError }
              ].map((item) => (
                <motion.button
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={item.action}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:border-cyan/50 hover:text-cyan transition-all hover:shadow-[0_0_20px_rgba(0,234,255,0.1)] text-sm"
                >
                  <span className="text-lg group-hover:animate-bounce">{item.icon}</span>
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
            <p className="mt-4 text-xs text-white/20 italic">
              Certifique-se de adicionar os arquivos .mp3 na pasta /public/audios/
            </p>


            {/* MIDI Status Messages */}
            {midiStatus === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm text-magenta/80"
              >
                {error || "Não foi possível conectar. Use Chrome ou Edge."}
              </motion.p>
            )}
            {!isSupported && (
              <p className="mt-4 text-xs text-white/30">
                WebMIDI não suportado neste navegador. Recomendamos Chrome ou
                Edge.
              </p>
            )}
          </motion.div>

            {/* Piano Animation */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="relative z-10 mt-16 lg:mt-0 w-full"
            >
              <HeroAnimation />
            </motion.div>
          </div>

          {/* Scroll indicator - Only bottom for small screens or mobile */}
          <motion.div
            className="hidden lg:block absolute bottom-12 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-white/20" />
          </motion.div>
        </section>


        {/* ── Partner Logos Marquee ────────────────── */}
        <PartnerMarquee />

        {/* ── Features Section ──────────────────────── */}
        <section className="py-32 lg:py-48 px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-24"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Por que <span className="text-cyan">PianoKids</span>?
              </h2>
              <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Uma experiência projetada para manter crianças engajadas e
                aprendendo com diversão imediata.
              </p>
            </motion.div>


            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Music className="w-6 h-6" />,
                  title: "Conexão MIDI Real",
                  desc: "Conecte qualquer teclado MIDI via USB e toque de verdade.",
                },
                {
                  icon: <Star className="w-6 h-6" />,
                  title: "Aprenda com Jogos",
                  desc: "Notas caem como estrelas — acerte no tempo certo para pontuar.",
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Progresso Visual",
                  desc: "Acompanhe a evolução com feedback visual instantâneo.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass glass-hover rounded-[2.5rem] p-10 group cursor-default shadow-2xl shadow-black/40"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan/10 flex items-center justify-center text-cyan mb-8 transition-all duration-300 group-hover:bg-cyan/20 group-hover:shadow-[0_0_20px_rgba(0,234,255,0.3)]">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-base text-white/40 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>

              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials Carousel ──────────────────── */}
        <div className="py-16">
          <TestimonialsCarousel />
        </div>

        {/* ── Pricing Section ───────────────────────── */}
        <section id="pricing" className="py-32 lg:py-48 px-6 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                Planos simples,{" "}
                <br />
                <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
                  sem surpresas
                </span>
              </h2>
              <p className="text-white/40 text-lg md:text-xl">
                Comece gratuitamente. Assine quando estiver pronto.
              </p>
            </motion.div>


            <div className="grid md:grid-cols-2 gap-6">
              <PricingCard
                name={CLIENT_PLANS.monthly.name}
                price={CLIENT_PLANS.monthly.price}
                period={CLIENT_PLANS.monthly.period}
                features={[...CLIENT_PLANS.monthly.features]}
                planKey="monthly"
                onSubscribe={handleSubscribe}
              />
              <PricingCard
                name={CLIENT_PLANS.yearly.name}
                price={CLIENT_PLANS.yearly.price}
                period={CLIENT_PLANS.yearly.period}
                features={[...CLIENT_PLANS.yearly.features]}
                badge={CLIENT_PLANS.yearly.badge}
                planKey="yearly"
                popular
                onSubscribe={handleSubscribe}
              />
            </div>
          </div>
        </section>

        {/* ── FAQ Accordion ──────────────────────────── */}
        <FAQ />

        {/* ── Footer ────────────────────────────────── */}
        <footer className="border-t border-white/5 py-12 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan to-cyan/60" />
              <span>PianoKids © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <a
                href="#"
                className="hover:text-white/60 transition-colors"
              >
                Termos
              </a>
              <a
                href="#"
                className="hover:text-white/60 transition-colors"
              >
                Privacidade
              </a>
              <a
                href="#"
                className="hover:text-white/60 transition-colors"
              >
                Contato
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
