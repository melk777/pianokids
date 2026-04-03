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
import { useTutorVoice } from "@/hooks/useTutorVoice";


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
      "Conexão MIDI",
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
  const { isSupported, connect, devices, error } = useMIDI();
  const { speak, isSpeaking: tutorIsSpeaking } = useTutorVoice();
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
      window.location.href = data.url;
    } else if (data.error) {
      console.error("Checkout error:", data.error);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-black">
        {/* ── Hero Section ──────────────────────────── */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,234,255,0.05)_0%,transparent_50%)]" />

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 text-center max-w-3xl mx-auto"
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
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">Aprenda piano</span>
              <br />
              <span className="bg-gradient-to-r from-cyan to-cyan/60 bg-clip-text text-transparent">
                brincando.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
              Conecte seu teclado MIDI e transforme cada nota em uma aventura.
              Músicas que caem como estrelas — acerte no tempo certo.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConnect}
                disabled={midiStatus === "connecting"}
                className="btn-primary flex items-center gap-2.5 disabled:opacity-50"
              >
                {midiStatus === "connecting" ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    Conectando...
                  </>
                ) : midiStatus === "connected" ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path
                        d="M13.3 4.3L6.3 11.3L2.7 7.7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                    Conectado! ({devices.length} dispositivo
                    {devices.length !== 1 ? "s" : ""})
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    Conectar Teclado
                  </>
                )}
              </motion.button>

              <motion.a
                href="/dashboard"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary flex items-center gap-2"
              >
                Explorar Dashboard
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.a>
            </div>

            {/* Test Voice Button (ElevenLabs Validator) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => speak("Oi, Melk! A configuração deu certo, já estou falando e pronta para a aula!")}
                disabled={tutorIsSpeaking}
                className={`group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all ${
                  tutorIsSpeaking 
                    ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed" 
                    : "bg-white/5 text-white/80 border border-white/10 hover:border-cyan/50 hover:text-cyan hover:shadow-[0_0_30px_rgba(0,234,255,0.2)]"
                }`}
              >
                <span className={`text-xl transition-transform group-hover:scale-125 ${tutorIsSpeaking ? "animate-pulse" : ""}`}>🗣️</span>
                <span>Testar Voz da Professora</span>
                {tutorIsSpeaking && (
                    <motion.div
                      className="absolute -right-2 -top-2 w-4 h-4 bg-cyan rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                )}
              </motion.button>
              <p className="mt-4 text-xs text-white/30 italic">
                {tutorIsSpeaking ? "Professora Mel falando..." : "Clique para ouvir a Professora Mel!"}
              </p>
            </motion.div>


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
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="relative z-10 mt-12 w-full max-w-2xl"
          >
            <HeroAnimation />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-white/20" />
          </motion.div>
        </section>

        {/* ── Partner Logos Marquee ────────────────── */}
        <PartnerMarquee />

        {/* ── Features Section ──────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Por que <span className="text-cyan">PianoKids</span>?
              </h2>
              <p className="text-white/40 max-w-lg mx-auto">
                Uma experiência projetada para manter crianças engajadas e
                aprendendo.
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
                  className="glass glass-hover rounded-2xl p-8 group cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan mb-5 transition-all duration-300 group-hover:bg-cyan/20 group-hover:shadow-[0_0_20px_rgba(0,234,255,0.2)]">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials Carousel ──────────────────── */}
        <TestimonialsCarousel />

        {/* ── Pricing Section ───────────────────────── */}
        <section id="pricing" className="py-24 px-6 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Planos simples,{" "}
                <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
                  sem surpresas
                </span>
              </h2>
              <p className="text-white/40">
                Comece gratuitamente. Assine quando estiver pronto.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <PricingCard
                name={CLIENT_PLANS.monthly.name}
                price={CLIENT_PLANS.monthly.price}
                period={CLIENT_PLANS.monthly.period}
                features={[...CLIENT_PLANS.monthly.features]}
                onSubscribe={() => handleSubscribe("monthly")}
              />
              <PricingCard
                name={CLIENT_PLANS.yearly.name}
                price={CLIENT_PLANS.yearly.price}
                period={CLIENT_PLANS.yearly.period}
                features={[...CLIENT_PLANS.yearly.features]}
                badge={CLIENT_PLANS.yearly.badge}
                popular
                onSubscribe={() => handleSubscribe("yearly")}
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
