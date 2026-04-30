import { CreditCard, HelpCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ReembolsoPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 pb-24 pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-magenta/5 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-magenta/20 bg-magenta/5 px-4 py-2 text-sm font-semibold text-magenta">
            <RefreshCw className="h-4 w-4" />
            Cancelamento simples
          </div>
          <h1 className="mb-6 text-4xl font-black text-white md:text-6xl">
            Reembolso e <span className="text-magenta">Cancelamento</span>
          </h1>
          <p className="text-lg text-white/60">Atualizado em 30 de Abril de 2026</p>
        </div>

        <div className="glass space-y-10 rounded-[2.5rem] border border-white/10 p-8 md:p-12">
          <section className="rounded-3xl border border-cyan/20 bg-cyan/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-cyan" />
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">Resumo transparente</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/80">
              Voce pode cancelar a assinatura pelo portal seguro do Stripe. O acesso permanece ativo ate o fim do
              periodo ja pago.
            </p>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
              <CreditCard className="h-5 w-5 text-magenta" />
              Cancelamento
            </h2>
            <p className="leading-relaxed text-white/60">
              O cancelamento impede novas cobrancas futuras. Ele nao apaga sua conta automaticamente e nao remove seu
              progresso salvo. Se voce tiver acesso ao painel, use a area de assinatura para gerenciar o plano.
            </p>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
              <RefreshCw className="h-5 w-5 text-cyan" />
              Reembolsos
            </h2>
            <div className="space-y-4 leading-relaxed text-white/60">
              <p>
                Pedidos de reembolso podem ser analisados quando houver cobranca duplicada, erro tecnico comprovado de
                acesso ou solicitacao feita logo apos a compra sem uso relevante da plataforma.
              </p>
              <p>
                A analise considera historico de acesso, inicio de aulas, uso do PianoEngine, periodo contratado e
                regras do processador de pagamento.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
              <HelpCircle className="h-5 w-5 text-magenta" />
              Como solicitar ajuda
            </h2>
            <p className="leading-relaxed text-white/60">
              Envie uma mensagem para contato@pianify.com.br com o e-mail da conta, data aproximada da compra e motivo
              da solicitacao. Responderemos com os proximos passos.
            </p>
          </section>
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
