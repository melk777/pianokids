"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Music, Star, BarChart3, ChevronDown, Piano, Library, AudioWaveform, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import HeroVideo from "@/components/HeroVideo";
const PricingCard = dynamic(() => import("@/components/PricingCard"), {
  loading: () => <div className="h-[32rem] rounded-2xl border border-white/10 bg-white/[0.03]" />,
});
const SupportedVideo = dynamic(() => import("@/components/SupportedVideo"), {
  loading: () => <div className="relative aspect-[16/10] w-full bg-black/60" />,
});
const PartnerMarquee = dynamic(() => import("@/components/PartnerMarquee"), { loading: () => null });
const TestimonialsCarousel = dynamic(() => import("@/components/TestimonialsCarousel"), { loading: () => null });
const FAQ = dynamic(() => import("@/components/FAQ"), { loading: () => null });




/* ──────────────────────────────────────────────────────
   Plan data (client-safe: no price IDs exposed)
   ────────────────────────────────────────────────────── */
const CLIENT_PLANS = {
  monthly: {
    name: "Pianify Pro Mensal",
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
    name: "Pianify Pro Anual",
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

const LIBRARY_PREVIEW = [
  {
    title: "Para Elisa",
    composer: "Ludwig van Beethoven",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg",
  },
  {
    title: "Marcha Turca",
    composer: "Wolfgang Amadeus Mozart",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Barbara_Krafft_-_Portr%C3%A4t_Wolfgang_Amadeus_Mozart_%281819%29.jpg",
  },
  {
    title: "Minueto em Sol",
    composer: "Johann Sebastian Bach",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Johann_Sebastian_Bach.jpg",
  },
] as const;

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
            
            <div className="text-center max-w-4xl mx-auto">

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
              <span className="text-white">Sua Jornada Musical </span>
              <br />
              <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
                Começa Aqui.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Toque no seu piano real e nós ouviremos cada nota. 
            </p>


            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-primary rounded-full px-8 py-4 text-base flex items-center gap-3 shadow-2xl shadow-cyan/30 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Music className="w-6 h-6" />
                Iniciar teste de 7 dias gratuitos
              </button>

              <div className="flex items-center gap-4 px-2 py-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-black shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_28px_rgba(0,0,0,0.38)]"
                    >
                      <Image
                        src={`/images/avatars/avatar-${index}.png`}
                        alt={`Aluno ativo ${index}`}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                  ))}
                </div>

                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-white">+1000 alunos ativos</p>
                  <p className="text-xs text-white/55">Aprendendo piano de forma interativa todos os dias</p>
                </div>
              </div>
            </div>
            </div>
          </div>
          {/* Scroll indicator - Only bottom for small screens or mobile */}
          <div
            className="hidden lg:block absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-6 h-6 text-white/20 animate-bounce" />
          </div>
        </section>


        {/* ── Partner Logos Marquee ────────────────── */}
        <section className="px-6 py-28 lg:px-12 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan/70">Como Funciona</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
                A <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">Pianify</span> transforma o
                teclado real em uma aula interativa.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/55 md:text-xl">
                O aluno aprende tocando no próprio piano enquanto a plataforma reconhece cada tecla em tempo real, confirma os
                acertos, mostra a evolução da música e deixa o progresso visual para o estudo ficar mais claro, divertido e
                consistente.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.14),transparent_35%)]" />
                <div className="relative rounded-[1.5rem] border border-white/10 bg-black/65 p-3 backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan/70">Gameplay Pianify</p>
                      <p className="mt-1 text-sm font-semibold text-white/80">Prévia visual da experiência com notas caindo e acompanhamento do jogo</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black">
                    <SupportedVideo
                      src="/videos/hero-bg.webm"
                      type="video/webm"
                      poster="/images/covers/golden_hour_cover.png"
                      alt="Prévia do jogo Pianify com notas caindo"
                      className="aspect-[16/10] w-full object-cover"
                      fallbackClassName="relative aspect-[16/10] w-full"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                    <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between">
                      <div className="rounded-full border border-cyan/25 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan backdrop-blur-md">
                        Notas Caindo
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur-md">
                        Interface do jogo
                      </div>
                    </div>
                    <div className="pointer-events-none absolute bottom-4 left-4 right-4">
                      <div className="inline-flex rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-md">
                        O aluno vê as notas, toca no teclado real e recebe feedback durante a execução.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        icon: <Piano className="w-5 h-5" />,
                        title: "Teclado real",
                        description: "O aluno toca no instrumento de verdade enquanto acompanha a tela.",
                      },
                      {
                        icon: <AudioWaveform className="w-5 h-5" />,
                        title: "Reconhecimento ao vivo",
                        description: "As notas e acordes são identificados e validados durante a execução.",
                      },
                      {
                        icon: <Trophy className="w-5 h-5" />,
                        title: "Feedback imediato",
                        description: "Pontuação, precisão e progresso ajudam a enxergar a evolução no mesmo instante.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 inline-flex rounded-xl bg-cyan/10 p-2 text-cyan">{item.icon}</div>
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-2xl bg-magenta/10 p-3 text-magenta">
                      <Library className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-magenta/70">Biblioteca Viva</p>
                      <h3 className="mt-1 text-2xl font-black text-white">Aprenda do infantil ao clássico</h3>
                    </div>
                  </div>

                  <p className="text-base leading-relaxed text-white/60">
                    A Pianify reúne músicas infantis, clássicas, intros marcantes e repertórios que mantêm o aluno engajado.
                    Cada faixa pode ser estudada de forma progressiva e interativa, com suporte para diferentes níveis.
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {LIBRARY_PREVIEW.map((song) => (
                      <div key={song.title} className="overflow-hidden rounded-[1.3rem] border border-white/10 bg-white/[0.03]">
                        <div className="relative aspect-[4/5]">
                          <Image src={song.image} alt={song.title} fill className="object-cover object-top" />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-black text-white">{song.title}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/40">{song.composer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan/70">Aprendizado Guiado</p>
                  <h3 className="mt-3 text-2xl font-black text-white">O aluno entende o que tocar e como está evoluindo</h3>

                  <div className="mt-6 space-y-4">
                    {[
                      "As notas caem na tela no momento certo para orientar a execução no teclado real.",
                      "O reconhecimento confirma em tempo real a quantidade de acertos e a precisão de cada trecho.",
                      "O progresso visual mostra onde o aluno está na música, facilitando repetir passagens difíceis até dominar.",
                    ].map((item) => (
                      <div key={item} className="flex gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_12px_rgba(34,211,238,0.75)]" />
                        <p className="text-sm leading-relaxed text-white/62">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing Section ───────────────────────── */}

        <PartnerMarquee />

        {/* ── Features Section ──────────────────────── */}
        <section className="py-32 lg:py-48 px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Por que <span className="text-gradient font-black">Pianify</span>?
              </h2>
              <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Uma experiência projetada para manter alunos de todas as idades engajados e
                aprendendo com diversão imediata.
              </p>
            </div>


            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Music className="w-6 h-6" />,
                  title: "Reconhecimento de Áudio",
                  desc: "Toque as notas no seu piano real e nossa IA reconhecerá instantaneamente via microfone.",
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
              ].map((feature) => (
                <div
                  key={feature.title}
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
                </div>

              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials Carousel ──────────────────── */}
        <div className="py-16">
          <TestimonialsCarousel />
        </div>

        <section id="pricing" className="py-32 lg:py-48 px-6 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                Planos simples,{" "}
                <br />
                <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
                  sem surpresas.
                </span>
              </h2>
              <p className="text-white/40 text-lg md:text-xl">
                Comece gratuitamente. Assine quando estiver pronto.
              </p>
            </div>


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
            <div className="flex items-center gap-2 text-white/40 text-[13px] font-medium tracking-tight">
              <span className="opacity-70">Pianify © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "Instagram", icon: "IG" },
                { label: "X", icon: "X" },
                { label: "Facebook", icon: "f" },
                { label: "WhatsApp", icon: "WA" },
              ].map((item) => (
                <a
                  key={item.label}
                  href="#"
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:text-white"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.16em]">
                    {item.icon}
                  </span>
                </a>
              ))}
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <a
                href="#"
                className="hover:text-white/60 transition-colors"
              >
                Termos
              </a>
              <Link
                href="/privacidade"
                className="hover:text-white/60 transition-colors"
              >
                Privacidade
              </Link>
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
