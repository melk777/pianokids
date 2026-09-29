"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Download, Laptop, MoreVertical, Share, Smartphone, SquarePlus } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { type BeforeInstallPromptEvent, type InstallPlatform, detectInstallPlatform, isStandalone } from "@/lib/pwaInstall";

const PLATFORMS: { id: InstallPlatform; title: string; icon: React.ReactNode; steps: React.ReactNode[] }[] = [
  {
    id: "android",
    title: "Android",
    icon: <Smartphone className="h-5 w-5" />,
    steps: [
      <>Abra pianify.com.br no <strong className="text-white/85">Chrome</strong>.</>,
      <>
        Toque em <MoreVertical className="inline h-4 w-4" aria-label="menu" /> e depois em{" "}
        <strong className="text-white/85">Instalar app</strong>.
      </>,
    ],
  },
  {
    id: "ios",
    title: "iPhone e iPad",
    icon: <Smartphone className="h-5 w-5" />,
    steps: [
      <>Abra pianify.com.br no <strong className="text-white/85">Safari</strong>.</>,
      <>
        Toque em <Share className="inline h-4 w-4" aria-label="Compartilhar" /> Compartilhar e depois em{" "}
        <strong className="text-white/85">Adicionar à Tela de Início</strong>.
      </>,
    ],
  },
  {
    id: "desktop",
    title: "Computador",
    icon: <Laptop className="h-5 w-5" />,
    steps: [
      <>Abra pianify.com.br no <strong className="text-white/85">Chrome</strong> ou no <strong className="text-white/85">Edge</strong>.</>,
      <>
        Clique no ícone <SquarePlus className="inline h-4 w-4" aria-label="instalar" /> na barra de endereço e em{" "}
        <strong className="text-white/85">Instalar</strong>.
      </>,
    ],
  },
];

/** Seção da página inicial que explica como instalar a Pianify como app, sem loja. */
export default function HomeInstallApp() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- platform detection runs in the browser only.
    setPlatform(detectInstallPlatform());
    setInstalled(isStandalone());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    trackEvent("landing_cta_clicked", { source: "install_app", target: "install_prompt" });
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  }

  return (
    <section id="app" className="scroll-mt-20 px-6 py-28 lg:px-12 lg:py-36">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Celular com a Pianify na tela de início */}
        <div className="relative mx-auto w-full max-w-[300px]">
          <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(0,234,255,0.18),rgba(255,0,229,0.12)_45%,transparent_70%)] blur-2xl" />
          <div className="relative rounded-[3rem] border border-white/15 bg-zinc-950 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="relative overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#141827] via-[#0c0d16] to-[#1a0c1f] px-6 pb-10 pt-12">
              <div className="mx-auto mb-10 h-5 w-24 rounded-full bg-black/70" />
              <div className="grid grid-cols-4 gap-x-4 gap-y-6">
                {Array.from({ length: 7 }, (_, index) => (
                  <div key={index} className="aspect-square rounded-2xl bg-white/[0.07]" />
                ))}
                <div className="flex flex-col items-center gap-1.5">
                  <Image
                    src="/icons/icon-192.png"
                    alt="Ícone da Pianify"
                    width={96}
                    height={96}
                    className="aspect-square w-full rounded-2xl shadow-[0_0_24px_rgba(0,234,255,0.45)]"
                  />
                  <span className="text-[10px] font-bold text-white/85">Pianify</span>
                </div>
              </div>
              <div className="mt-12 rounded-2xl border border-white/10 bg-black/40 p-4 text-center backdrop-blur">
                <p className="text-xs font-bold text-white">Abre com um toque</p>
                <p className="mt-1 text-[11px] text-white/55">Tela cheia, direto nas suas aulas</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan/70">App no celular</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            Leve a <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">Pianify</span> no bolso
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/55">
            Instale direto do site, sem loja e sem ocupar espaço. O app abre em tela cheia no celular, no tablet ou no
            computador, e você pratica com o teclado ao lado.
          </p>

          <div className="mt-8">
            {installed ? (
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-300">
                <CheckCircle2 className="h-5 w-5" /> A Pianify já está instalada neste aparelho
              </p>
            ) : installEvent ? (
              <button
                type="button"
                onClick={install}
                className="btn-primary inline-flex items-center gap-3 rounded-full px-7 py-4 text-base shadow-2xl shadow-cyan/30"
              >
                <Download className="h-5 w-5" /> Instalar agora
              </button>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PLATFORMS.map((item) => {
              const current = item.id === platform;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition ${
                    current ? "border-cyan/40 bg-cyan/[0.06] shadow-[0_0_30px_rgba(0,234,255,0.12)]" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-white">
                    <span className={current ? "text-cyan" : "text-white/60"}>{item.icon}</span>
                    <p className="text-sm font-black">{item.title}</p>
                  </div>
                  {current ? <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-cyan/80">Seu aparelho</p> : null}
                  <ol className="mt-3 space-y-2 text-xs leading-relaxed text-white/55">
                    {item.steps.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-black text-white/35">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
