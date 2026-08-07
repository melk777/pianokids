"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pianify route error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-28">
      <section className="glass w-full max-w-2xl rounded-[2.5rem] border border-amber-300/15 p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
          <TriangleAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-black text-white md:text-5xl">Algo desafinou por aqui.</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/60">
          Seus dados continuam protegidos. Tente carregar esta parte novamente ou volte ao início.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Voltar ao início
          </Link>
        </div>
        {error.digest ? <p className="mt-7 text-xs text-white/30">Código de suporte: {error.digest}</p> : null}
      </section>
    </main>
  );
}
