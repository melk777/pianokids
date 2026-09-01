import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 text-center">
        <AlertCircle className="mx-auto mb-5 h-12 w-12 text-amber-300" />
        <h1 className="mb-3 text-2xl font-black">Link inválido ou expirado</h1>
        <p className="mb-7 text-sm leading-relaxed text-white/55">
          Solicite um novo link de confirmação ou recuperação na tela de acesso. Links antigos deixam de funcionar por segurança.
        </p>
        <Link href="/login?realAuth=1" className="inline-flex rounded-xl bg-white px-6 py-3 font-black text-black">
          Voltar ao acesso
        </Link>
      </div>
    </main>
  );
}

