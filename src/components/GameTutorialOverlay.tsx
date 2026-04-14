"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "pianokids_game_tutorial_seen_v1";

type TutorialStep = {
  title: string;
  description: string;
  badge: string;
  desktopCardClassName: string;
  mobileCardClassName: string;
  desktopSpotlightClassName: string;
  mobileSpotlightClassName: string;
  desktopLabelClassName?: string;
  mobileLabelClassName?: string;
};

const STEPS: TutorialStep[] = [
  {
    badge: "Controles",
    title: "Velocidade da musica",
    description: "Use menos e mais para adaptar a queda das notas ao nivel do aluno. Em trechos novos, reduzir a velocidade costuma acelerar o aprendizado.",
    desktopCardClassName: "top-20 right-52",
    mobileCardClassName: "top-20 left-4 right-4",
    desktopSpotlightClassName: "top-2 right-[14.5rem] h-10 w-36 rounded-2xl",
    mobileSpotlightClassName: "top-[4.25rem] left-[54%] h-10 w-36 -translate-x-1/2 rounded-2xl",
    desktopLabelClassName: "top-14 right-[15rem]",
    mobileLabelClassName: "top-[3.2rem] left-1/2 -translate-x-1/2",
  },
  {
    badge: "Atalho",
    title: "Pause e retomada",
    description: "A barra de espaco pausa e retoma a musica. Isso e ideal para corrigir postura, revisar um compasso ou explicar um acorde sem sair da tela.",
    desktopCardClassName: "top-20 right-4",
    mobileCardClassName: "top-32 left-4 right-4",
    desktopSpotlightClassName: "top-2 right-0 h-10 w-28 rounded-2xl",
    mobileSpotlightClassName: "top-[4.25rem] right-4 h-10 w-28 rounded-2xl",
    desktopLabelClassName: "top-14 right-3",
    mobileLabelClassName: "top-[7.2rem] right-4",
  },
  {
    badge: "Acao",
    title: "Reiniciar rapidamente",
    description: "O botao Reiniciar volta ao inicio da musica sem trocar de tela. Bom para repetir passagens dificeis e recomecar a pratica em segundos.",
    desktopCardClassName: "top-24 right-4",
    mobileCardClassName: "top-44 left-4 right-4",
    desktopSpotlightClassName: "top-2 right-[-0.25rem] h-10 w-28 rounded-2xl lg:w-36",
    mobileSpotlightClassName: "top-[4.25rem] right-4 h-10 w-28 rounded-2xl",
    desktopLabelClassName: "top-14 right-4",
    mobileLabelClassName: "top-[11rem] right-4",
  },
  {
    badge: "HUD",
    title: "Pontuacao total",
    description: "Aqui o aluno acompanha os pontos acumulados. Quanto mais notas e acordes corretos em sequencia, maior a pontuacao final.",
    desktopCardClassName: "top-28 left-6",
    mobileCardClassName: "top-56 left-4 right-4",
    desktopSpotlightClassName: "top-16 left-6 h-20 w-32 rounded-3xl",
    mobileSpotlightClassName: "top-24 left-3 h-16 w-28 rounded-2xl",
    desktopLabelClassName: "top-11 left-8",
    mobileLabelClassName: "top-[9.2rem] left-4",
  },
  {
    badge: "Desempenho",
    title: "Combo e precisao",
    description: "O combo mostra consistencia e a precisao resume a qualidade da execucao. Esses dois indicadores ajudam a medir a evolucao do aluno na hora.",
    desktopCardClassName: "top-24 left-1/2 -translate-x-1/2",
    mobileCardClassName: "top-[19rem] left-4 right-4",
    desktopSpotlightClassName: "top-16 left-1/2 h-20 w-[21rem] -translate-x-1/2 rounded-3xl",
    mobileSpotlightClassName: "top-24 left-1/2 h-16 w-[17rem] -translate-x-1/2 rounded-2xl",
    desktopLabelClassName: "top-11 left-1/2 -translate-x-1/2",
    mobileLabelClassName: "top-[15.2rem] left-1/2 -translate-x-1/2",
  },
  {
    badge: "Fluxo",
    title: "Progresso e teclado virtual",
    description: "A barra superior mostra onde a musica esta, e o teclado na base ajuda a visualizar a regiao e o desenho de cada nota ou acorde.",
    desktopCardClassName: "bottom-32 left-1/2 -translate-x-1/2",
    mobileCardClassName: "bottom-36 left-4 right-4",
    desktopSpotlightClassName: "bottom-0 left-0 right-0 h-[34%] rounded-t-[2rem]",
    mobileSpotlightClassName: "bottom-0 left-0 right-0 h-[32%] rounded-t-[2rem]",
    desktopLabelClassName: "bottom-[34%] left-1/2 -translate-x-1/2",
    mobileLabelClassName: "bottom-[32%] left-1/2 -translate-x-1/2",
  },
];

interface GameTutorialOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function GameTutorialOverlay({ open, onClose }: GameTutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setDontShowAgain(false);
    }
  }, [open]);

  const handleFinish = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose();
  };

  const handleNext = () => {
    if (stepIndex === STEPS.length - 1) {
      handleFinish();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40">
        <div className="absolute inset-0 bg-black/76 backdrop-blur-[2px]" />

        <Spotlight
          desktopClassName={currentStep.desktopSpotlightClassName}
          mobileClassName={currentStep.mobileSpotlightClassName}
        />

        <SpotlightLabel
          badge={currentStep.badge}
          desktopClassName={currentStep.desktopLabelClassName}
          mobileClassName={currentStep.mobileLabelClassName}
        />

        <div className={`absolute hidden max-w-sm md:block ${currentStep.desktopCardClassName}`}>
          <TutorialCard
            badge={currentStep.badge}
            title={currentStep.title}
            description={currentStep.description}
            stepIndex={stepIndex}
            totalSteps={STEPS.length}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
            onSkip={handleFinish}
            onNext={handleNext}
          />
        </div>

        <div className={`absolute md:hidden ${currentStep.mobileCardClassName}`}>
          <TutorialCard
            badge={currentStep.badge}
            title={currentStep.title}
            description={currentStep.description}
            stepIndex={stepIndex}
            totalSteps={STEPS.length}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
            onSkip={handleFinish}
            onNext={handleNext}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Spotlight({
  desktopClassName,
  mobileClassName,
}: {
  desktopClassName: string;
  mobileClassName: string;
}) {
  const spotlightClasses =
    "absolute border border-cyan/60 bg-white/[0.02] shadow-[0_0_0_9999px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.1),0_0_30px_rgba(34,211,238,0.28)]";

  return (
    <>
      <motion.div
        key={`desktop-${desktopClassName}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className={`hidden md:block ${spotlightClasses} ${desktopClassName}`}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.98, 1.01, 0.98] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[inherit] border border-cyan/70"
        />
      </motion.div>

      <motion.div
        key={`mobile-${mobileClassName}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className={`md:hidden ${spotlightClasses} ${mobileClassName}`}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.98, 1.01, 0.98] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[inherit] border border-cyan/70"
        />
      </motion.div>
    </>
  );
}

function SpotlightLabel({
  badge,
  desktopClassName,
  mobileClassName,
}: {
  badge: string;
  desktopClassName?: string;
  mobileClassName?: string;
}) {
  const baseClassName =
    "absolute rounded-full border border-cyan/25 bg-cyan/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-cyan backdrop-blur-md";

  return (
    <>
      {desktopClassName && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`hidden md:block ${baseClassName} ${desktopClassName}`}
        >
          {badge}
        </motion.div>
      )}

      {mobileClassName && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`md:hidden ${baseClassName} ${mobileClassName}`}
        >
          {badge}
        </motion.div>
      )}
    </>
  );
}

function TutorialCard({
  badge,
  title,
  description,
  stepIndex,
  totalSteps,
  dontShowAgain,
  setDontShowAgain,
  onSkip,
  onNext,
}: {
  badge: string;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  dontShowAgain: boolean;
  setDontShowAgain: (value: boolean) => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-3xl border border-white/10 bg-zinc-950/96 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan">{badge}</p>
      <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>

      <div className="mt-4 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span key={index} className={`h-1.5 flex-1 rounded-full ${index === stepIndex ? "bg-cyan" : "bg-white/10"}`} />
        ))}
      </div>

      <label className="mt-4 flex items-center gap-2 text-xs text-white/55">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(event) => setDontShowAgain(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan"
        />
        Nao mostrar novamente
      </label>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={onSkip}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition hover:border-white/20 hover:text-white"
        >
          Fechar
        </button>
        <button
          onClick={onNext}
          className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
        >
          {stepIndex === totalSteps - 1 ? "Concluir" : "Proximo"}
        </button>
      </div>
    </motion.div>
  );
}

export function shouldAutoOpenGameTutorial() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== "true";
}
