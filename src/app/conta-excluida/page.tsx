import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Conta excluída",
  robots: { index: false, follow: false },
};

export default function ContaExcluidaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-28">
      <section className="glass w-full max-w-xl rounded-[2.5rem] border border-white/10 p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan/10 text-cyan">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-white md:text-4xl">Sua conta foi excluída</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/60">
          Apagamos seu perfil e seu histórico de prática. Se você tinha assinatura, ela foi cancelada e não haverá novas
          cobranças. Registros fiscais de pagamentos são guardados pelo prazo exigido em lei, sem vínculo com o seu perfil.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/40">
          Dúvidas: <a className="font-bold text-cyan hover:underline" href="mailto:contato@pianify.com.br">contato@pianify.com.br</a>
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex items-center justify-center rounded-full px-6 py-3">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
