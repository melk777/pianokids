"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "pianokids_game_tutorial_seen_v3";
const SPOTLIGHT_PADDING = 8;
const CARD_GAP = 16;
const CARD_MAX_WIDTH = 340;

export type GameTutorialTargetId =
  | "volume"
  | "tutorial"
  | "mic"
  | "pauseShortcut"
  | "loop"
  | "speed"
  | "waiting"
  | "metronome"
  | "restart"
  | "score"
  | "combo"
  | "accuracy"
  | "progress"
  | "fallingNotes"
  | "hitLine"
  | "keyboard";

export type GameTutorialActionId =
  | "volume"
  | "mic"
  | "pause"
  | "loop"
  | "speed"
  | "waiting"
  | "metronome"
  | "restart"
  | "keyboard";

type TutorialStep = {
  badge: string;
  title: string;
  description: string;
  targetId: GameTutorialTargetId;
  requiredAction?: GameTutorialActionId;
  actionHint?: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
  preferredAlign?: "start" | "center" | "end";
};

type TutorialRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const STEPS: TutorialStep[] = [
  {
    badge: "Play Mode",
    title: "Notas caindo",
    description: "Cada bloco representa uma nota real da música. Blocos maiores precisam ser sustentados até terminarem de atravessar a linha de acerto.",
    targetId: "fallingNotes",
    preferredPlacement: "right",
    preferredAlign: "center",
  },
  {
    badge: "Tempo",
    title: "Linha de acerto",
    description: "Toque quando a base da nota encostar nessa linha. Se a nota for longa, continue segurando enquanto ela vai desaparecendo aos poucos.",
    targetId: "hitLine",
    preferredPlacement: "top",
    preferredAlign: "center",
  },
  {
    badge: "Audio",
    title: "Volume e retorno",
    description: "Aqui o aluno liga ou silencia o som de apoio do jogo sem sair da prática.",
    targetId: "volume",
    requiredAction: "volume",
    actionHint: "Clique no botao de volume para continuar.",
    preferredPlacement: "bottom",
  },
  {
    badge: "Captura",
    title: "Microfone do piano",
    description: "Este controle ativa a escuta do instrumento real para validar notas e acordes durante a música. Se ele já estiver ligado, este passo será liberado automaticamente.",
    targetId: "mic",
    preferredPlacement: "bottom",
  },
  {
    badge: "Atalho",
    title: "Tecla Espaço pausa",
    description: "Neste passo a simulação fica em movimento. Aperte Espaço para pausar; se ela já estiver parada, Espaço volta a tocar.",
    targetId: "pauseShortcut",
    requiredAction: "pause",
    actionHint: "Aperte Espaço e observe a simulação alternar entre pausa e reprodução.",
    preferredPlacement: "bottom",
    preferredAlign: "center",
  },
  {
    badge: "Estudo",
    title: "Loop de trecho",
    description: "Use Loop, A e B para repetir exatamente a parte em que o aluno está com dificuldade até ganhar segurança.",
    targetId: "loop",
    requiredAction: "loop",
    actionHint: "Ative Loop ou marque A/B para continuar.",
    preferredPlacement: "bottom",
  },
  {
    badge: "Ritmo",
    title: "Velocidade da música",
    description: "Diminua ou aumente a velocidade da queda das notas. A simulação fica lenta neste passo para a diferença aparecer na hora.",
    targetId: "speed",
    requiredAction: "speed",
    actionHint: "Clique em + ou - para mudar a velocidade.",
    preferredPlacement: "bottom",
  },
  {
    badge: "Didática",
    title: "Modo espera",
    description: "Quando ativado, a música segura o andamento na próxima nota pendente para o aluno enxergar que o jogo espera a resposta.",
    targetId: "waiting",
    requiredAction: "waiting",
    actionHint: "Ative o modo espera e observe as notas congelarem na linha de acerto.",
    preferredPlacement: "bottom",
  },
  {
    badge: "Referência",
    title: "Metrônomo",
    description: "Ajuste o volume do pulso para reforçar o tempo e a precisão rítmica durante o estudo.",
    targetId: "metronome",
    requiredAction: "metronome",
    actionHint: "Clique em + ou - no metrônomo.",
    preferredPlacement: "bottom",
  },
  {
    badge: "Controle",
    title: "Reiniciar rapidamente",
    description: "Recomece a música sem sair da tela. Ideal para repetir o trecho inteiro do estudo atual.",
    targetId: "restart",
    requiredAction: "restart",
    actionHint: "Clique em Reiniciar para voltar a simulação ao início.",
    preferredPlacement: "bottom",
  },
  {
    badge: "Resultado",
    title: "Pontuação",
    description: "Mostra os pontos acumulados ao longo da execução.",
    targetId: "score",
    preferredPlacement: "bottom",
    preferredAlign: "start",
  },
  {
    badge: "Desempenho",
    title: "Combo",
    description: "O combo revela constância. Quanto mais acertos seguidos, maior o impacto na evolução do aluno.",
    targetId: "combo",
    preferredPlacement: "bottom",
    preferredAlign: "center",
  },
  {
    badge: "Análise",
    title: "Precisão",
    description: "Aqui o aluno acompanha a qualidade da execução em tempo real.",
    targetId: "accuracy",
    preferredPlacement: "bottom",
    preferredAlign: "end",
  },
  {
    badge: "Fluxo",
    title: "Progresso da música",
    description: "A barra superior mostra a posição atual da música e ajuda a localizar rapidamente o trecho estudado.",
    targetId: "progress",
    preferredPlacement: "bottom",
    preferredAlign: "center",
  },
  {
    badge: "Teclado",
    title: "Mapa visual das notas",
    description: "O teclado na base mostra a região tocada e ajuda a enxergar a distribuição das notas e acordes.",
    targetId: "keyboard",
    requiredAction: "keyboard",
    actionHint: "Toque C4 no piano da tela, no teclado do computador ou no seu MIDI para liberar a música.",
    preferredPlacement: "top",
    preferredAlign: "center",
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
  preferredAlign: TutorialStep["preferredAlign"],
) {
  const cardWidth = Math.min(CARD_MAX_WIDTH, containerWidth - 24);
  const cardHeight = 280;
  const alignedLeft =
    preferredAlign === "start"
      ? rect.left
      : preferredAlign === "end"
        ? rect.left + rect.width - cardWidth
        : rect.left + rect.width / 2 - cardWidth / 2;
  const centerX = alignedLeft;
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
    left = alignedLeft;
    top = rect.top + rect.height + CARD_GAP;
  } else if (placement === "top") {
    left = alignedLeft;
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
  completedActions?: Partial<Record<GameTutorialActionId, boolean>>;
  onStepChange?: (step: TutorialStep, index: number) => void;
  onComplete?: () => void;
}

export default function GameTutorialOverlay({
  open,
  onClose,
  containerRef,
  targets,
  completedActions = {},
  onStepChange,
  onComplete,
}: GameTutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<TutorialRect | null>(null);
  const [cardRect, setCardRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const onStepChangeRef = useRef(onStepChange);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);
  const currentActionCompleted = !currentStep.requiredAction || Boolean(completedActions[currentStep.requiredAction]);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setDontShowAgain(false);
      setSpotlightRect(null);
      setCardRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    onStepChangeRef.current?.(currentStep, stepIndex);
  }, [currentStep, open, stepIndex]);

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
      setCardRect(
        getCardPosition(
          paddedRect,
          container.clientWidth,
          container.clientHeight,
          currentStep.preferredPlacement,
          currentStep.preferredAlign,
        ),
      );
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

  const handleFinish = useCallback(() => {
    if (dontShowAgain && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    onComplete?.();
    onClose();
  }, [dontShowAgain, onClose, onComplete]);

  useEffect(() => {
    if (!open || stepIndex !== STEPS.length - 1 || !currentActionCompleted) return;

    const finishTimer = window.setTimeout(() => {
      handleFinish();
    }, 700);

    return () => window.clearTimeout(finishTimer);
  }, [currentActionCompleted, handleFinish, open, stepIndex]);

  const handleDismiss = () => {
    onClose();
  };

  const handleNext = () => {
    if (!currentActionCompleted) return;

    if (stepIndex === STEPS.length - 1) {
      handleFinish();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const handlePrevious = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  if (!open || !spotlightRect || !cardRect) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-50">
        <div
          className="absolute left-0 top-0 bg-black/74 backdrop-blur-[3px]"
          style={{
            width: "100%",
            height: Math.max(0, spotlightRect.top),
          }}
        />
        <div
          className="absolute left-0 bg-black/74 backdrop-blur-[3px]"
          style={{
            top: spotlightRect.top,
            width: Math.max(0, spotlightRect.left),
            height: spotlightRect.height,
          }}
        />
        <div
          className="absolute bg-black/74 backdrop-blur-[3px]"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left + spotlightRect.width,
            right: 0,
            height: spotlightRect.height,
          }}
        />
        <div
          className="absolute left-0 bg-black/74 backdrop-blur-[3px]"
          style={{
            top: spotlightRect.top + spotlightRect.height,
            width: "100%",
            bottom: 0,
          }}
        />

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
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.65, 0.25] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-1 rounded-[inherit] bg-cyan/10"
          />
        </motion.div>

        <motion.div
          key={currentStep.title}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          data-testid="game-tutorial-card"
          className="pointer-events-auto absolute overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-5"
          style={{
            left: cardRect.left,
            top: cardRect.top,
            width: cardRect.width,
            maxHeight: "min(280px, calc(70vh - 64px))",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan">{currentStep.badge}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
              Ao vivo {stepIndex + 1}/{STEPS.length}
            </span>
          </div>
          <h3 className="mt-2 text-xl font-black text-white">{currentStep.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{currentStep.description}</p>

          {currentStep.actionHint && (
            <div
              className={`mt-4 rounded-2xl border px-3 py-2 text-xs font-bold leading-relaxed ${
                currentActionCompleted
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                  : "border-cyan/25 bg-cyan/10 text-cyan"
              }`}
            >
              {currentActionCompleted ? "Acao concluida. Pode avancar." : currentStep.actionHint}
            </div>
          )}

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
            Não mostrar novamente
          </label>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition hover:border-white/20 hover:text-white"
              >
                Fechar
              </button>
              {stepIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Voltar
                </button>
              )}
            </div>
            <button
              onClick={handleNext}
              disabled={!currentActionCompleted}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition ${
                currentActionCompleted
                  ? "bg-white text-black hover:bg-white/90"
                  : "cursor-not-allowed border border-white/10 bg-white/10 text-white/35"
              }`}
            >
              {stepIndex === STEPS.length - 1 ? "Concluir" : "Próximo"}
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
