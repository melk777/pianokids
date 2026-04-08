"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music, Star, BarChart3, ChevronDown } from "lucide-react";

import HeroVideo from "@/components/HeroVideo";
import PartnerMarquee from "@/components/PartnerMarquee";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import FAQ from "@/components/FAQ";
import PricingCard from "@/components/PricingCard";




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
      <main className="min-h-screen">
        {/* ── Hero Section ──────────────────────────── */}
        <section className="relative min-h-screen px-6 py-24 lg:py-32 overflow-hidden flex items-center justify-center">
          {/* Background Video (Optimized) */}
          <HeroVideo />


          <div className="relative z-10 max-w-7xl mx-auto w-full">
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center max-w-4xl mx-auto"
            >

            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tight mb-8 leading-[1.1]">
              <span className="text-white">Aprenda piano</span>
              <br />
              <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
                brincando.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Toque no seu piano real e nós ouviremos cada nota. 
            </p>


            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="btn-primary rounded-full px-10 py-5 text-lg flex items-center gap-3 shadow-2xl shadow-cyan/30"
              >
                <Music className="w-6 h-6" />
                Iniciar teste de 7 dias gratuitos
              </motion.button>
            </div>
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
                Por que <span className="text-gradient font-black">PianoKids</span>?
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
                  title: "Reconhecimento de Áudio",
                  desc: "Toque as notas no seu piano real e nossa IA reconhece instantaneamente via microfone.",
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
                  <div className="w-14 h-14 rounded-2xl bg-cyan/10 flex items-center justify-center icon-gradient mb-8 transition-all duration-300 group-hover:bg-cyan/20 group-hover:shadow-[0_0_20px_rgba(255,0,229,0.3)]">
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
