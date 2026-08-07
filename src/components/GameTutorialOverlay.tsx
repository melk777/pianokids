"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gauge,
  Hand,
  Infinity as InfinityIcon,
  Music2,
  Sparkles,
  TimerReset,
  X,
  type LucideIcon,
} from "lucide-react";

const STORAGE_KEY = "pianokids_game_tutorial_seen_v4";
const SPOTLIGHT_PADDING = 12;
const CARD_GAP = 18;
const CARD_MAX_WIDTH = 390;
const CARD_ESTIMATED_HEIGHT = 338;
const TUTORIAL_HEADER_CLEARANCE = 132;

export type GameTutorialTargetId =
  | "fallingNotes"
  | "hitLine"
  | "keyboard"
  | "speed"
  | "loop"
  | "waiting";

export type GameTutorialActionId = "keyboard" | "speed" | "loop" | "waiting";

type TutorialScene = "welcome" | "focus" | "celebration";
type TutorialIcon = "sparkles" | "hand" | "music" | "speed" | "loop" | "waiting" | "check";

export type GameTutorialStep = {
  id: string;
  scene: TutorialScene;
  chapter: string;
  title: string;
  description: string;
  icon: TutorialIcon;
  targetId?: GameTutorialTargetId;
  requiredAction?: GameTutorialActionId;
  actionHint?: string;
  successText?: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
};

type TutorialRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type CardRect = {
  left: number;
  top: number;
  width: number;
};

const STEPS: readonly GameTutorialStep[] = [
  {
    id: "welcome",
    scene: "welcome",
    chapter: "Primeiro voo",
    title: "Sua primeira vitória começa com uma nota.",
    description:
      "Em poucos instantes você vai encontrar o Dó central, ler as notas caindo e descobrir as três ferramentas que tornam qualquer trecho mais fácil.",
    icon: "sparkles",
  },
  {
    id: "middle-c",
    scene: "focus",
    chapter: "Missão 1 · ponto de partida",
    title: "Encontre o Dó central",
    description:
      "O C4 é o centro visual do teclado. As notas vão esperar por você: toque a tecla marcada quando ela acender.",
    icon: "hand",
    targetId: "keyboard",
    requiredAction: "keyboard",
    actionHint: "Toque C4 no teclado da tela, do computador ou no seu piano MIDI.",
    successText: "Perfeito. Você encontrou o centro do teclado.",
    preferredPlacement: "top",
  },
  {
    id: "falling-notes",
    scene: "focus",
    chapter: "Missão 2 · leitura visual",
    title: "Leia a música de cima para baixo",
    description:
      "Cada bloco é uma nota. A largura mostra a tecla; o comprimento mostra por quanto tempo ela deve permanecer pressionada.",
    icon: "music",
    targetId: "fallingNotes",
    preferredPlacement: "right",
  },
  {
    id: "tempo",
    scene: "focus",
    chapter: "Missão 3 · seu ritmo",
    title: "Faça a música caber no seu tempo",
    description:
      "Diminuir a velocidade não é tocar pior. É dar ao cérebro tempo para transformar movimento em memória.",
    icon: "speed",
    targetId: "speed",
    requiredAction: "speed",
    actionHint: "Use − ou + para experimentar outra velocidade.",
    successText: "Ótimo. Agora o andamento trabalha a seu favor.",
    preferredPlacement: "bottom",
  },
  {
    id: "loop",
    scene: "focus",
    chapter: "Missão 4 · repetição inteligente",
    title: "Isole o trecho que precisa de atenção",
    description:
      "O loop repete somente a parte difícil. Assim você pratica o problema, em vez de recomeçar a música inteira.",
    icon: "loop",
    targetId: "loop",
    requiredAction: "loop",
    actionHint: "Ative Loop. Depois você poderá ajustar os pontos A e B.",
    successText: "Trecho isolado. Repetir com intenção acelera o aprendizado.",
    preferredPlacement: "bottom",
  },
  {
    id: "wait-mode",
    scene: "focus",
    chapter: "Missão 5 · toque sem pressão",
    title: "Deixe a música esperar por você",
    description:
      "No modo espera, o andamento para na próxima nota até você acertar. Você aprende com calma, sem perseguir a música.",
    icon: "waiting",
    targetId: "waiting",
    requiredAction: "waiting",
    actionHint: "Ative Espera para assumir o controle do andamento.",
    successText: "Isso. A música só avança quando você estiver pronto.",
    preferredPlacement: "bottom",
  },
  {
    id: "ready",
    scene: "celebration",
    chapter: "Jornada liberada",
    title: "Agora o palco é seu.",
    description:
      "Você já sabe encontrar o centro, acompanhar as notas e transformar um trecho difícil em uma prática possível. Escolha uma música e construa a próxima vitória.",
    icon: "check",
  },
] as const;

const STEP_ICONS: Record<TutorialIcon, LucideIcon> = {
  sparkles: Sparkles,
  hand: Hand,
  music: Music2,
  speed: Gauge,
  loop: InfinityIcon,
  waiting: TimerReset,
  check: Check,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRelativeRect(element: HTMLElement, container: HTMLElement): TutorialRect {
  const targetRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const left = clamp(targetRect.left - containerRect.left - SPOTLIGHT_PADDING, 4, container.clientWidth - 8);
  const top = clamp(targetRect.top - containerRect.top - SPOTLIGHT_PADDING, 4, container.clientHeight - 8);
  const right = clamp(
    targetRect.right - containerRect.left + SPOTLIGHT_PADDING,
    left + 1,
    container.clientWidth - 4,
  );
  const bottom = clamp(
    targetRect.bottom - containerRect.top + SPOTLIGHT_PADDING,
    top + 1,
    container.clientHeight - 4,
  );

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function getCardPosition(
  rect: TutorialRect,
  containerWidth: number,
  containerHeight: number,
  preferredPlacement: GameTutorialStep["preferredPlacement"],
): CardRect {
  const width = Math.min(CARD_MAX_WIDTH, containerWidth - 24);
  const height = Math.min(
    CARD_ESTIMATED_HEIGHT,
    Math.max(170, containerHeight * 0.7 - TUTORIAL_HEADER_CLEARANCE),
  );
  const compact = containerWidth < 1024 || containerHeight < 720;
  const safeTop = Math.min(
    TUTORIAL_HEADER_CLEARANCE,
    Math.max(12, containerHeight - height - 12),
  );

  if (compact) {
    const placeAbove = rect.top + rect.height / 2 > containerHeight / 2;
    return {
      width,
      left: (containerWidth - width) / 2,
      top: placeAbove ? safeTop : containerHeight - height - 12,
    };
  }

  const fits = {
    top: rect.top - CARD_GAP - height >= TUTORIAL_HEADER_CLEARANCE,
    bottom: rect.top + rect.height + CARD_GAP + height <= containerHeight - 16,
    left: rect.left - CARD_GAP - width >= 16,
    right: rect.left + rect.width + CARD_GAP + width <= containerWidth - 16,
  };
  const fallbackOrder: Array<NonNullable<GameTutorialStep["preferredPlacement"]>> = [
    preferredPlacement ?? "right",
    "right",
    "left",
    "bottom",
    "top",
  ];
  const placement =
    fallbackOrder.find((candidate) => fits[candidate]) ??
    (rect.top + rect.height / 2 > containerHeight / 2 ? "top" : "bottom");

  let left = rect.left + rect.width / 2 - width / 2;
  let top = rect.top + rect.height / 2 - height / 2;

  if (placement === "top") top = rect.top - height - CARD_GAP;
  if (placement === "bottom") top = rect.top + rect.height + CARD_GAP;
  if (placement === "left") left = rect.left - width - CARD_GAP;
  if (placement === "right") left = rect.left + rect.width + CARD_GAP;

  return {
    width,
    left: clamp(left, 12, containerWidth - width - 12),
    top: clamp(top, safeTop, containerHeight - height - 12),
  };
}

interface MissionRailProps {
  activeIndex: number;
}

function MissionRail({ activeIndex }: MissionRailProps) {
  return (
    <div
      data-testid="tutorial-mission-rail"
      className="pointer-events-none absolute left-1/2 top-16 z-[82] w-[min(620px,calc(100%-96px))] -translate-x-1/2"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-2 shadow-[0_16px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl md:gap-2 md:px-4">
        {STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                aria-hidden
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[8px] font-black transition-colors md:h-6 md:w-6 md:text-[9px] ${
                  isComplete
                    ? "border-emerald-300/50 bg-emerald-300 text-black"
                    : isActive
                      ? "border-cyan/70 bg-cyan text-black shadow-[0_0_18px_rgba(34,211,238,0.6)]"
                      : "border-white/10 bg-white/[0.04] text-white/30"
                }`}
              >
                {isComplete ? <Check size={11} strokeWidth={3} /> : index + 1}
              </span>
              {index < STEPS.length - 1 ? (
                <span className={`h-px flex-1 ${index < activeIndex ? "bg-emerald-300/50" : "bg-white/10"}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GameTutorialOverlayProps {
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  targets: Partial<Record<GameTutorialTargetId, RefObject<HTMLElement | null>>>;
  completedActions?: Partial<Record<GameTutorialActionId, boolean>>;
  onStepChange?: (step: GameTutorialStep, index: number) => void;
  onComplete?: () => void;
}

export default function GameTutorialOverlay({
  onClose,
  containerRef,
  targets,
  completedActions = {},
  onStepChange,
  onComplete,
}: GameTutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<TutorialRect | null>(null);
  const [cardRect, setCardRect] = useState<CardRect | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const reduceMotion = useReducedMotion();
  const currentStep = STEPS[stepIndex];
  const activeTargetRef = currentStep.targetId ? targets[currentStep.targetId] : undefined;
  const currentActionCompleted =
    !currentStep.requiredAction || Boolean(completedActions[currentStep.requiredAction]);
  const StepIcon = STEP_ICONS[currentStep.icon];
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    onStepChangeRef.current?.(currentStep, stepIndex);
  }, [currentStep, stepIndex]);

  useLayoutEffect(() => {
    if (currentStep.scene !== "focus" || !currentStep.targetId) {
      return;
    }

    const container = containerRef.current;
    const target = activeTargetRef?.current;
    if (!container || !target) return;

    const measure = () => {
      const nextRect = getRelativeRect(target, container);
      setSpotlightRect(nextRect);
      setCardRect(
        getCardPosition(
          nextRect,
          container.clientWidth,
          container.clientHeight,
          currentStep.preferredPlacement,
        ),
      );
    };

    const frame = window.requestAnimationFrame(measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(container);
    observer?.observe(target);
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeTargetRef, containerRef, currentStep]);

  const handleFinish = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    onComplete?.();
    onClose();
  }, [onClose, onComplete]);

  const handleNext = useCallback(() => {
    if (!currentActionCompleted) return;
    if (isLastStep) {
      handleFinish();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }, [currentActionCompleted, handleFinish, isLastStep]);

  const handlePrevious = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Enter" && currentActionCompleted) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentActionCompleted, handleNext, onClose]);

  const tutorialCard = (
    <motion.section
      key={currentStep.id}
      role="dialog"
      aria-modal="false"
      aria-labelledby="pianify-tutorial-title"
      aria-describedby="pianify-tutorial-description"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
      data-testid="game-tutorial-card"
      className="pointer-events-auto relative overflow-y-auto rounded-[1.75rem] border border-white/12 bg-zinc-950/94 p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.72),0_0_48px_rgba(34,211,238,0.09),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:p-6"
      style={{ maxHeight: "min(338px, calc(70vh - 132px))" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-cyan/12 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-emerald-400/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.035),transparent_38%)]" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [0, 3, -3, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                currentStep.scene === "celebration"
                  ? "border-emerald-300/30 bg-emerald-300/14 text-emerald-200"
                  : "border-cyan/25 bg-cyan/10 text-cyan"
              }`}
            >
              <StepIcon size={21} strokeWidth={2.2} />
            </motion.div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan/80">
                Pianify · jornada guiada
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">
                {currentStep.chapter}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar tutorial"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <X size={16} />
          </button>
        </div>

        {currentStep.scene === "welcome" ? (
          <div className="relative mx-auto my-5 grid h-24 w-24 place-items-center">
            <motion.span
              aria-hidden
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-cyan/30"
            />
            <motion.span
              aria-hidden
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-3 rounded-full border border-emerald-300/20"
            />
            <Music2 className="text-cyan drop-shadow-[0_0_16px_rgba(34,211,238,0.7)]" size={30} />
          </div>
        ) : null}

        {currentStep.scene === "celebration" ? (
          <div className="my-5 grid grid-cols-3 gap-2" aria-label="Resumo do tutorial">
            {[
              ["1", "ponto central"],
              ["3", "ferramentas"],
              ["∞", "novas tentativas"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.035] px-2 py-3 text-center">
                <p className="text-lg font-black text-cyan">{value}</p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.13em] text-white/38">{label}</p>
              </div>
            ))}
          </div>
        ) : null}

        <h2 id="pianify-tutorial-title" className="mt-5 text-balance text-2xl font-black leading-[1.08] tracking-tight sm:text-[1.75rem]">
          {currentStep.title}
        </h2>
        <p id="pianify-tutorial-description" className="mt-3 text-sm leading-relaxed text-white/64">
          {currentStep.description}
        </p>

        {currentStep.actionHint ? (
          <div
            aria-live="polite"
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-3.5 py-3 text-xs font-bold leading-relaxed ${
              currentActionCompleted
                ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                : "border-cyan/25 bg-cyan/10 text-cyan"
            }`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                currentActionCompleted ? "bg-emerald-300 text-black" : "border border-cyan/35 bg-black/25"
              }`}
            >
              {currentActionCompleted ? <Check size={12} strokeWidth={3} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />}
            </span>
            <span>{currentActionCompleted ? currentStep.successText : currentStep.actionHint}</span>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-white/55 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                aria-label="Voltar para a etapa anterior"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35 transition hover:text-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                Agora não
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!currentActionCompleted}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              currentActionCompleted
                ? currentStep.scene === "celebration"
                  ? "bg-emerald-300 text-black shadow-[0_0_24px_rgba(110,231,183,0.2)] hover:bg-emerald-200"
                  : "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.10)] hover:bg-cyan"
                : "cursor-not-allowed border border-white/8 bg-white/[0.04] text-white/28"
            }`}
          >
            {currentStep.scene === "welcome"
              ? "Começar missão"
              : currentStep.scene === "celebration"
                ? "Tocar minha música"
                : currentActionCompleted
                  ? "Próxima missão"
                  : "Complete a ação"}
            {currentActionCompleted ? <ArrowRight size={14} /> : null}
          </button>
        </div>

        <p className="mt-3 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white/20">
          Enter para avançar · Esc para sair
        </p>
      </div>
    </motion.section>
  );

  const centeredScene = currentStep.scene !== "focus" || !cardRect;

  return (
    <div className="pointer-events-none absolute inset-0 z-[80] overflow-hidden" data-testid="game-tutorial-overlay">
      {currentStep.scene === "focus" && spotlightRect ? null : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.09),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.82),rgba(0,0,0,0.9))]" />
      )}
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:34px_34px]" />

      <MissionRail activeIndex={stepIndex} />

      <AnimatePresence mode="wait">
        {currentStep.scene === "focus" && spotlightRect ? (
          <motion.div
            key={`${currentStep.id}-spotlight`}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
            className="absolute rounded-[1.4rem] border border-cyan/70 bg-cyan/[0.04] shadow-[0_0_0_9999px_rgba(0,0,0,0.78),0_0_0_1px_rgba(255,255,255,0.08),0_0_42px_rgba(34,211,238,0.34)]"
            style={spotlightRect}
          >
            <motion.span
              aria-hidden
              animate={reduceMotion ? undefined : { opacity: [0.28, 0.88, 0.28] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-[inherit] border border-cyan/65"
            />
            <span className="absolute -left-px -top-px h-5 w-5 rounded-tl-[1.35rem] border-l-2 border-t-2 border-white/70" />
            <span className="absolute -right-px -top-px h-5 w-5 rounded-tr-[1.35rem] border-r-2 border-t-2 border-white/70" />
            <span className="absolute -bottom-px -left-px h-5 w-5 rounded-bl-[1.35rem] border-b-2 border-l-2 border-white/70" />
            <span className="absolute -bottom-px -right-px h-5 w-5 rounded-br-[1.35rem] border-b-2 border-r-2 border-white/70" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {centeredScene ? (
          <div className="absolute inset-x-0 bottom-[calc(30%+12px)] top-28 flex items-center justify-center px-3 sm:px-5">
            <div className="max-h-full w-full max-w-[430px]">{tutorialCard}</div>
          </div>
        ) : cardRect ? (
          <div
            className="absolute"
            style={{ left: cardRect.left, top: cardRect.top, width: cardRect.width }}
          >
            {tutorialCard}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function shouldAutoOpenGameTutorial() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== "true";
}
