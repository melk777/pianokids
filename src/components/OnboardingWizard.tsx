"use client";

import { useState } from "react";
import { Check, KeyboardMusic, Music2, Piano, Sparkles } from "lucide-react";
import {
  saveOnboardingPreferences,
  skipOnboarding,
  type InstrumentType,
  type LearningGoal,
  type LearningLevel,
} from "@/lib/onboarding";
import { trackEvent } from "@/lib/analytics";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const levels: Array<{ id: LearningLevel; title: string; text: string }> = [
  { id: "beginner", title: "Estou começando", text: "Quero músicas fáceis e uma mão por vez." },
  { id: "medium", title: "Já toco um pouco", text: "Quero evoluir com desafios intermediários." },
  { id: "pro", title: "Quero repertório completo", text: "Quero duas mãos e versões mais avançadas." },
];

const goals: Array<{ id: LearningGoal; title: string; text: string }> = [
  { id: "kids", title: "Infantil", text: "Músicas simples para começar com confiança." },
  { id: "worship", title: "Louvor", text: "Repertório religioso e prática para tocar em casa ou igreja." },
  { id: "classic", title: "Clássico", text: "Peças tradicionais e progressão musical." },
  { id: "popular", title: "Filmes", text: "Intros e temas conhecidos para manter motivação." },
];

const instruments: Array<{ id: InstrumentType; title: string; text: string; icon: React.ReactNode }> = [
  { id: "keyboard", title: "Teclado", text: "Vou tocar em um teclado eletrônico.", icon: <KeyboardMusic size={18} /> },
  { id: "piano", title: "Piano", text: "Vou usar piano acústico ou digital.", icon: <Piano size={18} /> },
  { id: "phone", title: "Só explorando", text: "Quero conhecer antes de ligar microfone.", icon: <Music2 size={18} /> },
];

export default function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [level, setLevel] = useState<LearningLevel>("beginner");
  const [goal, setGoal] = useState<LearningGoal>("kids");
  const [instrument, setInstrument] = useState<InstrumentType>("keyboard");

  if (!open) return null;

  const finish = () => {
    saveOnboardingPreferences({ level, goal, instrument });
    trackEvent("onboarding_completed", {
      source: "onboarding_wizard",
      level,
      goal,
      instrument,
    });
    onComplete();
  };

  const skip = () => {
    skipOnboarding();
    trackEvent("onboarding_skipped", {
      source: "onboarding_wizard",
      level,
      goal,
      instrument,
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/82 p-4 backdrop-blur-md">
      <section className="w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan/15 bg-[#07090D] shadow-[0_28px_110px_rgba(0,0,0,0.72)]">
        <div className="border-b border-white/8 p-5 md:p-7">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan">
            <Sparkles size={14} />
            Primeira configuração
          </p>
          <h2 className="text-2xl font-black text-white md:text-3xl">Vamos montar sua primeira aula ideal</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Isso ajuda a Pianify escolher músicas, dificuldade e modo de prática com menos fricção.
          </p>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-3 md:p-7">
          <ChoiceGroup title="Nível" items={levels} selected={level} onSelect={setLevel} />
          <ChoiceGroup title="Objetivo" items={goals} selected={goal} onSelect={setGoal} />

          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Instrumento</p>
            <div className="space-y-2">
              {instruments.map((item) => {
                const active = instrument === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInstrument(item.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-cyan/40 bg-cyan/12 text-white"
                        : "border-white/8 bg-white/[0.03] text-white/55 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <span className={active ? "text-cyan" : "text-white/35"}>{item.icon}</span>
                    <span>
                      <span className="block text-sm font-black">{item.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-white/45">{item.text}</span>
                    </span>
                    {active && <Check className="ml-auto h-4 w-4 shrink-0 text-cyan" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between md:p-7">
          <button
            type="button"
            onClick={skip}
            className="rounded-xl px-4 py-3 text-sm font-bold text-white/45 transition hover:bg-white/6 hover:text-white/70"
          >
            Pular por enquanto
          </button>
          <button
            type="button"
            onClick={finish}
            className="rounded-xl bg-cyan px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-cyan-300 active:scale-[0.98]"
          >
            Ver minha primeira aula
          </button>
        </div>
      </section>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: Array<{ id: T; title: string; text: string }>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{title}</p>
      <div className="space-y-2">
        {items.map((item) => {
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                active
                  ? "border-magenta/40 bg-magenta/12 text-white"
                  : "border-white/8 bg-white/[0.03] text-white/55 hover:border-white/15 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm font-black">{item.title}</span>
                {active && <Check className="ml-auto h-4 w-4 text-magenta" />}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-white/45">{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
