import Link from "next/link";
import { Home, Library, Music2 } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-28">
      <section className="glass w-full max-w-2xl rounded-[2.5rem] border border-white/10 p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan/10 text-cyan">
          <Music2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan/70">Erro 404</p>
        <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">Essa página saiu do compasso.</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/60">
          O endereço informado não existe ou foi movido. Você pode voltar ao início ou continuar pela biblioteca musical.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3">
            <Home className="h-4 w-4" aria-hidden="true" />
            Voltar ao início
          </Link>
          <Link
            href="/dashboard/songs"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Library className="h-4 w-4" aria-hidden="true" />
            Abrir biblioteca
          </Link>
        </div>
      </section>
    </main>
  );
}
