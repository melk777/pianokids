"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "pianokids_game_tutorial_seen_v2";
const SPOTLIGHT_PADDING = 8;
const CARD_GAP = 16;
const CARD_MAX_WIDTH = 340;

export type GameTutorialTargetId =
  | "volume"
  | "tutorial"
  | "mic"
  | "loop"
  | "speed"
  | "waiting"
  | "metronome"
  | "restart"
  | "score"
  | "combo"
  | "accuracy"
  | "progress"
  | "keyboard";

type TutorialStep = {
  badge: string;
  title: string;
  description: string;
  targetId: GameTutorialTargetId;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
};

type TutorialRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const STEPS: TutorialStep[] = [
  {
    badge: "Audio",
    title: "Volume e retorno",
    description: "Aqui o aluno liga ou silencia o som de apoio do jogo sem sair da pratica.",
    targetId: "volume",
    preferredPlacement: "bottom",
  },
  {
    badge: "Captura",
    title: "Microfone do piano",
    description: "Este controle ativa a escuta do instrumento real para validar notas e acordes durante a musica.",
    targetId: "mic",
    preferredPlacement: "bottom",
  },
  {
    badge: "Estudo",
    title: "Loop de trecho",
    description: "Use Loop, A e B para repetir exatamente a parte em que o aluno esta com dificuldade ate ganhar seguranca.",
    targetId: "loop",
    preferredPlacement: "bottom",
  },
  {
    badge: "Ritmo",
    title: "Velocidade da musica",
    description: "Diminua ou aumente a velocidade da queda das notas para adaptar a pratica ao nivel do aluno.",
    targetId: "speed",
    preferredPlacement: "bottom",
  },
  {
    badge: "Didatica",
    title: "Modo espera",
    description: "Quando ativado, a musica segura o andamento nos pontos importantes para ajudar o aluno a acompanhar.",
    targetId: "waiting",
    preferredPlacement: "bottom",
  },
  {
    badge: "Referencia",
    title: "Metronomo",
    description: "Ajuste o volume do pulso para reforcar o tempo e a precisao ritmica durante o estudo.",
    targetId: "metronome",
    preferredPlacement: "bottom",
  },
  {
    badge: "Controle",
    title: "Reiniciar rapidamente",
    description: "Recomece a musica sem sair da tela. Ideal para repetir o trecho inteiro do estudo atual.",
    targetId: "restart",
    preferredPlacement: "bottom",
  },
  {
    badge: "Resultado",
    title: "Pontuacao",
    description: "Mostra os pontos acumulados ao longo da execucao.",
    targetId: "score",
    preferredPlacement: "bottom",
  },
  {
    badge: "Desempenho",
    title: "Combo",
    description: "O combo revela constancia. Quanto mais acertos seguidos, maior o impacto na evolucao do aluno.",
    targetId: "combo",
    preferredPlacement: "bottom",
  },
  {
    badge: "Analise",
    title: "Precisao",
    description: "Aqui o aluno acompanha a qualidade da execucao em tempo real.",
    targetId: "accuracy",
    preferredPlacement: "bottom",
  },
  {
    badge: "Fluxo",
    title: "Progresso da musica",
    description: "A barra superior mostra a posicao atual da musica e ajuda a localizar rapidamente o trecho estudado.",
    targetId: "progress",
    preferredPlacement: "bottom",
  },
  {
    badge: "Teclado",
    title: "Mapa visual das notas",
    description: "O teclado na base mostra a regiao tocada e ajuda a enxergar a distribuicao das notas e acordes.",
    targetId: "keyboard",
    preferredPlacement: "top",
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function getRelativeRect(element: HTMLElement, container: HTMLElement): TutorialRect {
  const targetRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    left: targetRect.left - containerRect.left,
    top: targetRect.top - containerRect.top,
    width: targetRect.width,
    height: targetRect.height,
  };
}

function getCardPosition(
  rect: TutorialRect,
  containerWidth: number,
  containerHeight: number,
  preferredPlacement: TutorialStep["preferredPlacement"],
) {
  const cardWidth = Math.min(CARD_MAX_WIDTH, containerWidth - 24);
  const cardHeight = 230;
  const centerX = rect.left + rect.width / 2 - cardWidth / 2;
  const centerY = rect.top + rect.height / 2 - cardHeight / 2;
  const fitsBottom = rect.top + rect.height + CARD_GAP + cardHeight < containerHeight - 16;
  const fitsTop = rect.top - CARD_GAP - cardHeight > 16;
  const fitsRight = rect.left + rect.width + CARD_GAP + cardWidth < containerWidth - 16;
  const fitsLeft = rect.left - CARD_GAP - cardWidth > 16;

  let left = centerX;
  let top = centerY;
  let placement = preferredPlacement ?? "bottom";

  if (placement === "bottom" && !fitsBottom) placement = fitsTop ? "top" : fitsRight ? "right" : fitsLeft ? "left" : "bottom";
  if (placement === "top" && !fitsTop) placement = fitsBottom ? "bottom" : fitsRight ? "right" : fitsLeft ? "left" : "top";
  if (placement === "right" && !fitsRight) placement = fitsBottom ? "bottom" : fitsTop ? "top" : fitsLeft ? "left" : "right";
  if (placement === "left" && !fitsLeft) placement = fitsBottom ? "bottom" : fitsTop ? "top" : fitsRight ? "right" : "left";

  if (placement === "bottom") {
    left = rect.left + rect.width / 2 - cardWidth / 2;
    top = rect.top + rect.height + CARD_GAP;
  } else if (placement === "top") {
    left = rect.left + rect.width / 2 - cardWidth / 2;
    top = rect.top - cardHeight - CARD_GAP;
  } else if (placement === "right") {
    left = rect.left + rect.width + CARD_GAP;
    top = rect.top + rect.height / 2 - cardHeight / 2;
  } else {
    left = rect.left - cardWidth - CARD_GAP;
    top = rect.top + rect.height / 2 - cardHeight / 2;
  }

  return {
    width: cardWidth,
    left: clamp(left, 12, containerWidth - cardWidth - 12),
    top: clamp(top, 12, containerHeight - cardHeight - 12),
  };
}

interface GameTutorialOverlayProps {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  targets: Partial<Record<GameTutorialTargetId, RefObject<HTMLElement | null>>>;
}

export default function GameTutorialOverlay({ open, onClose, containerRef, targets }: GameTutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<TutorialRect | null>(null);
  const [cardRect, setCardRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setDontShowAgain(false);
      setSpotlightRect(null);
      setCardRect(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const container = containerRef.current;
      const target = targets[currentStep.targetId]?.current;
      if (!container || !target) return;

      const rect = getRelativeRect(target, container);
      const paddedRect = {
        left: rect.left - SPOTLIGHT_PADDING,
        top: rect.top - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      };

      setSpotlightRect(paddedRect);
      setCardRect(getCardPosition(paddedRect, container.clientWidth, container.clientHeight, currentStep.preferredPlacement));
    };

    measure();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measure();
          })
        : null;

    if (observer) {
      if (containerRef.current) observer.observe(containerRef.current);
      const target = targets[currentStep.targetId]?.current;
      if (target) observer.observe(target);
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [containerRef, currentStep, open, targets]);

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

  if (!open || !spotlightRect || !cardRect) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50">
        <div className="absolute inset-0 bg-black/74 backdrop-blur-[3px]" />

        <motion.div
          key={`${currentStep.targetId}-spotlight`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute rounded-2xl border border-cyan/70 bg-cyan/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.74),0_0_0_1px_rgba(255,255,255,0.08),0_0_36px_rgba(34,211,238,0.28)]"
          style={{
            left: spotlightRect.left,
            top: spotlightRect.top,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        >
          <motion.div
            animate={{ opacity: [0.35, 0.85, 0.35] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[inherit] border border-cyan/60"
          />
          <div className="absolute -top-10 left-0 rounded-full border border-cyan/25 bg-cyan/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan backdrop-blur-md">
            {currentStep.badge}
          </div>
        </motion.div>

        <motion.div
          key={currentStep.title}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute rounded-3xl border border-white/10 bg-zinc-950/96 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          style={{ left: cardRect.left, top: cardRect.top, width: cardRect.width }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan">{currentStep.badge}</p>
          <h3 className="mt-2 text-xl font-black text-white">{currentStep.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{currentStep.description}</p>

          <div className="mt-4 flex gap-2">
            {Array.from({ length: STEPS.length }).map((_, index) => (
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
              onClick={handleFinish}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Fechar
            </button>
            <button
              onClick={handleNext}
              className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
            >
              {stepIndex === STEPS.length - 1 ? "Concluir" : "Proximo"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function shouldAutoOpenGameTutorial() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== "true";
}
