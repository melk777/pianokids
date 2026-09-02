import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileCheck2, Music2, ShieldCheck } from "lucide-react";
import { getServerSongCredits } from "@/lib/server/song-catalog";

export const metadata: Metadata = {
  title: "Créditos e licenças musicais",
  description: "Fontes, autoria e licenças do repertório educacional disponível na Pianify.",
  alternates: { canonical: "/creditos" },
};

export default async function CreditosPage() {
  const songs = await getServerSongCredits();

  return (
    <main id="conteudo" className="relative min-h-dvh overflow-hidden px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-cyan/10 via-magenta/[0.03] to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/[0.07] px-4 py-2 text-sm font-semibold text-cyan">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Transparência do repertório
          </div>
          <h1 className="text-balance text-4xl font-black text-white sm:text-5xl md:text-6xl">
            Créditos e <span className="text-cyan">licenças musicais</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            A Pianify mantém a autoria, a fonte consultada e a licença de cada obra. O catálogo usa composições em
            domínio público ou materiais com licença compatível, sem redistribuir gravações de terceiros.
          </p>
        </header>

        <section aria-labelledby="resumo-direitos" className="mb-8 grid gap-4 md:grid-cols-3">
          <h2 id="resumo-direitos" className="sr-only">Resumo da verificação</h2>
          {[
            {
              icon: FileCheck2,
              value: String(songs.length),
              label: "músicas com procedência registrada",
            },
            {
              icon: Music2,
              value: "Instrumental",
              label: "sem letras ou fonogramas de terceiros",
            },
            {
              icon: ShieldCheck,
              value: "Rastreável",
              label: "fonte e licença consultáveis abaixo",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <Icon aria-hidden="true" className="h-6 w-6 text-cyan" />
                <p className="mt-5 text-2xl font-black text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{item.label}</p>
              </div>
            );
          })}
        </section>

        <section aria-labelledby="catalogo-creditos" className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-4 sm:p-7">
          <div className="mb-6 px-2 sm:px-0">
            <h2 id="catalogo-creditos" className="text-2xl font-black text-white sm:text-3xl">Catálogo documentado</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
              Abra uma música para consultar composição, edição de referência, licença e links externos usados na
              verificação. Os links abrem em uma nova aba.
            </p>
          </div>

          <ol className="space-y-3">
            {songs.map((song) => (
              <li key={song.id}>
                <details className="group rounded-2xl border border-white/10 bg-white/[0.03] open:border-cyan/25 open:bg-cyan/[0.04]">
                  <summary className="cursor-pointer list-none rounded-2xl px-4 py-4 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-cyan sm:px-5">
                    <span className="flex min-h-11 items-center justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block text-base font-bold text-white">{song.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-white/55">{song.artist}</span>
                      </span>
                      <span aria-hidden="true" className="shrink-0 text-xl text-cyan transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>

                  <div className="border-t border-white/10 px-4 pb-5 pt-4 text-sm leading-relaxed text-white/65 sm:px-5">
                    <dl className="grid gap-4 md:grid-cols-2">
                      <div>
                        <dt className="font-bold text-white">Composição/fonte</dt>
                        <dd className="mt-1">{song.source.composer || song.artist}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-white">Licença registrada</dt>
                        <dd className="mt-1">{song.source.license}</dd>
                      </div>
                      {song.source.edition && (
                        <div className="md:col-span-2">
                          <dt className="font-bold text-white">Edição ou método</dt>
                          <dd className="mt-1">{song.source.edition}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={song.source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan/25 bg-cyan/10 px-4 py-2 font-bold text-cyan transition hover:bg-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                      >
                        Ver fonte
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      </a>
                      {song.source.licenseUrl && song.source.licenseUrl !== song.source.sourceUrl && (
                        <a
                          href={song.source.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2 font-bold text-white/80 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                        >
                          Ver licença
                          <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <aside className="mt-8 rounded-3xl border border-magenta/20 bg-magenta/[0.05] p-6 text-sm leading-relaxed text-white/65">
          <h2 className="font-black text-white">Correções e solicitações</h2>
          <p className="mt-2">
            Se você representa um titular ou encontrou uma atribuição que precisa de ajuste, escreva para{" "}
            <a className="font-bold text-cyan hover:underline" href="mailto:contato@pianify.com.br">contato@pianify.com.br</a>{" "}
            indicando a música e a documentação aplicável.
          </p>
        </aside>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
            &larr; Voltar para a Home
          </Link>
        </div>
      </div>
    </main>
  );
}
