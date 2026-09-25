import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Church, Hand, Music2, Route, Users } from "lucide-react";
import { ALL_LESSONS, LEARNING_PATH } from "@/lib/learningPath";

export const metadata: Metadata = {
  title: "Pianify para igrejas",
  description:
    "Forme novos tecladistas para o louvor: trilha de aulas com hinos, acordes nas tonalidades mais usadas e acompanhamento do líder.",
  alternates: { canonical: "/igrejas" },
};

const STEPS = [
  {
    icon: Users,
    title: "O líder cria a conta de parceiro",
    text: "Quem ensina o ministério (líder de louvor ou professor) se cadastra como professor parceiro e recebe um link próprio.",
  },
  {
    icon: Route,
    title: "Cada músico segue a trilha em casa",
    text: "Os alunos se cadastram pelo link e fazem as aulas da trilha no próprio teclado, 10 minutos por dia.",
  },
  {
    icon: BookOpenCheck,
    title: "O líder acompanha a evolução",
    text: "No painel de parceiro, o líder vê quem está praticando. As comissões das assinaturas podem ajudar o ministério.",
  },
];

const BENEFITS = [
  {
    icon: Music2,
    title: "Hinos tradicionais",
    text: "Amazing Grace, Noite Feliz, Rocha Eterna, Santo, Santo, Santo e outros hinos em domínio público, com a fonte documentada.",
  },
  {
    icon: Hand,
    title: "Acordes para acompanhar",
    text: "Exercícios de I–IV–V–I nas 12 tonalidades, começando por Dó, Sol e Fá, as mais usadas no louvor.",
  },
  {
    icon: Church,
    title: "Do zero ao louvor",
    text: "Uma trilha com metas claras: da primeira nota a acompanhar um hino com as duas mãos, no ritmo de cada um.",
  },
];

export default function IgrejasPage() {
  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-32 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-4 py-2 text-sm font-semibold text-cyan">
            <Church size={15} /> Para igrejas e ministérios de louvor
          </p>
          <h1 className="mt-6 text-balance text-4xl font-black leading-tight sm:text-6xl">
            Forme novos tecladistas{" "}
            <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">para o louvor.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Falta gente no teclado e sobra pouco tempo para ensinar. Com a Pianify, cada músico pratica em casa com uma
            trilha guiada, e o líder acompanha a evolução de todos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?role=teacher"
              className="rounded-full bg-gradient-to-r from-cyan to-magenta px-8 py-4 text-base font-bold text-white transition hover:shadow-[0_0_40px_rgba(0,234,255,0.35)]"
            >
              Sou líder ou professor
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
            >
              Quero aprender a tocar
            </Link>
          </div>
        </header>

        <section aria-labelledby="beneficios" className="mt-24">
          <h2 id="beneficios" className="sr-only">
            O que a Pianify oferece
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan/10 text-cyan">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="como-funciona" className="mt-24">
          <h2 id="como-funciona" className="text-3xl font-black sm:text-4xl">
            Como funciona no ministério
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black">
                    {index + 1}
                  </span>
                  <Icon size={18} className="text-cyan" />
                </div>
                <h3 className="mt-4 font-black">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="trilha" className="mt-24 rounded-[2rem] border border-cyan/20 bg-cyan/[0.04] p-6 sm:p-10">
          <h2 id="trilha" className="text-3xl font-black">
            A trilha “Do zero ao louvor”
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            {ALL_LESSONS.length} aulas em {LEARNING_PATH.length} níveis. Cada aula tem uma meta de precisão e libera a
            próxima quando o aluno chega lá.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LEARNING_PATH.map((unit, index) => (
              <li key={unit.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan">Nível {index + 1}</p>
                <p className="mt-1 font-black">{unit.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/55">{unit.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="perguntas" className="mt-24">
          <h2 id="perguntas" className="text-3xl font-black">
            Perguntas frequentes
          </h2>
          <dl className="mt-8 space-y-4">
            {[
              [
                "Quais hinos estão disponíveis?",
                "Hinos tradicionais em domínio público. A lista completa, com a fonte de cada obra, está na página de créditos. Hinos e louvores com direitos autorais ativos não fazem parte do catálogo.",
              ],
              [
                "Preciso de um teclado com cabo?",
                "Não. Dá para tocar pelo microfone (piano acústico ou teclado com caixa de som), por um teclado MIDI ligado ao computador ou até pelo teclado do computador para começar.",
              ],
              [
                "Quanto custa?",
                "Cada aluno assina individualmente: R$ 29,90 por mês ou R$ 239,90 por ano, com 7 dias para experimentar. A trilha inteira usa músicas e exercícios do plano gratuito, então ninguém fica de fora.",
              ],
              [
                "Como o ministério recebe as comissões?",
                "O líder cadastrado como professor parceiro recebe R$ 5,00 por fatura mensal ou R$ 40,00 por fatura anual confirmada dos alunos indicados, por PIX, após o prazo de liberação.",
              ],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <dt className="font-bold">{question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/65">{answer}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-white/55">
            Veja o repertório em{" "}
            <Link href="/creditos" className="font-semibold text-cyan hover:underline">
              Créditos musicais
            </Link>{" "}
            ou fale com a gente pela{" "}
            <Link href="/contato" className="font-semibold text-cyan hover:underline">
              central de contato
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
