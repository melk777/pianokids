import { LifeBuoy, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ContatoPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 pb-24 pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/5 px-4 py-2 text-sm font-semibold text-cyan">
            <LifeBuoy className="h-4 w-4" />
            Suporte Pianify
          </div>
          <h1 className="mb-6 text-4xl font-black text-white md:text-6xl">
            Fale com a <span className="text-cyan">Pianify</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60">
            Use esta pagina para suporte de assinatura, acesso, pagamento, microfone, PianoEngine ou parcerias.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <a
            href="mailto:contato@pianify.com.br"
            className="glass group rounded-[2rem] border border-white/10 p-7 transition hover:border-cyan/35 hover:bg-cyan/5"
          >
            <div className="mb-5 inline-flex rounded-2xl bg-cyan/10 p-3 text-cyan">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-white">E-mail</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">contato@pianify.com.br</p>
          </a>

          <div className="glass rounded-[2rem] border border-white/10 p-7">
            <div className="mb-5 inline-flex rounded-2xl bg-magenta/10 p-3 text-magenta">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-white">Atendimento</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Informe o e-mail da conta, aparelho usado e o que aconteceu. Isso acelera o suporte.
            </p>
          </div>

          <div className="glass rounded-[2rem] border border-white/10 p-7">
            <div className="mb-5 inline-flex rounded-2xl bg-cyan/10 p-3 text-cyan">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-white">Seguranca</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Nunca envie senha, chave secreta, dados completos de cartao ou credenciais por mensagem.
            </p>
          </div>
        </div>

        <div className="glass mt-8 rounded-[2rem] border border-white/10 p-7">
          <h2 className="text-2xl font-black text-white">Antes de chamar suporte</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/58 md:grid-cols-2">
            {[
              "Se o problema for microfone, confirme a permissao do navegador.",
              "Se for pagamento, confira o e-mail usado no checkout.",
              "Se for acesso Pro, saia e entre novamente na conta.",
              "Se for uma musica, envie o nome da musica e o modo usado.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-white/40 transition-colors hover:text-white">
            &larr; Voltar para a Home
          </Link>
        </div>
      </div>
    </main>
  );
}
