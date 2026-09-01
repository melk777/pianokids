import { AlertCircle, CheckCircle2, FileText, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    icon: <UserCheck className="h-5 w-5 text-cyan" />,
    title: "Uso da plataforma",
    body: "A Pianify oferece aulas interativas, biblioteca musical, reconhecimento de notas por microfone e ferramentas de acompanhamento de progresso. O usuario deve utilizar a plataforma de forma licita, respeitosa e compatível com a finalidade educacional do servico.",
  },
  {
    icon: <UserCheck className="h-5 w-5 text-magenta" />,
    title: "Idade mínima no lançamento",
    body: "O cadastro de conta está disponível somente para pessoas com 18 anos ou mais. Contas para menores serão disponibilizadas apenas após a implantação de mecanismos adequados de aferição de idade, supervisão e consentimento do responsável quando aplicável.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5 text-magenta" />,
    title: "Conta, acesso e assinatura",
    body: "Alguns recursos podem exigir cadastro, login e assinatura ativa. O acesso Pro e liberado conforme o plano contratado e o processamento do pagamento. O usuario e responsavel por manter seus dados de acesso em seguranca.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5 text-cyan" />,
    title: "Renovação e cancelamento",
    body: "Os planos pagos são renovados automaticamente no período mensal ou anual escolhido, até o cancelamento. O preço e a periodicidade são informados antes do pagamento. O cancelamento pode ser feito no portal de cobrança e impede a renovação seguinte, mantendo o acesso até o fim do período pago, salvo reembolso ou determinação legal.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-cyan" />,
    title: "Microfone e experiencia musical",
    body: "O reconhecimento por microfone depende do aparelho, navegador, permissao concedida, qualidade do instrumento e ruido do ambiente. A Pianify tambem pode oferecer modos sem microfone para estudo guiado quando aplicavel.",
  },
  {
    icon: <AlertCircle className="h-5 w-5 text-magenta" />,
    title: "Limitacao educacional",
    body: "A Pianify e uma ferramenta de ensino e pratica. Ela nao substitui, em todos os casos, avaliacao individual de um professor, acompanhamento presencial ou orientacao tecnica personalizada.",
  },
];

export default function TermosPage() {
  const providerName = process.env.COMPANY_LEGAL_NAME || "Identificação empresarial pendente";
  const providerTaxId = process.env.COMPANY_TAX_ID || "CNPJ pendente";
  const providerAddress = process.env.COMPANY_ADDRESS || "Endereço pendente";

  return (
    <main className="relative min-h-screen overflow-hidden px-6 pb-24 pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/5 px-4 py-2 text-sm font-semibold text-cyan">
            <FileText className="h-4 w-4" />
            Regras de uso da Pianify
          </div>
          <h1 className="mb-6 text-4xl font-black text-white md:text-6xl">
            Termos de <span className="text-cyan">Uso</span>
          </h1>
          <p className="text-lg text-white/60">Versão 2026-09-01</p>
        </div>

        <div className="glass space-y-10 rounded-[2.5rem] border border-white/10 p-8 md:p-12">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-base leading-relaxed text-white/70">
              Ao acessar ou usar a Pianify, voce concorda com estes termos. Se nao concordar com alguma condicao,
              interrompa o uso da plataforma e entre em contato com nosso suporte.
            </p>
          </section>

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
                {section.icon}
                {section.title}
              </h2>
              <p className="leading-relaxed text-white/60">{section.body}</p>
            </section>
          ))}

          <section>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
              <FileText className="h-5 w-5 text-cyan" />
              Pagamentos, cancelamentos e reembolsos
            </h2>
            <p className="leading-relaxed text-white/60">
              As regras de cancelamento e reembolso estao descritas em nossa politica especifica. Consulte a pagina de
              reembolso antes de contratar ou cancelar um plano.
            </p>
            <Link href="/reembolso" className="mt-4 inline-flex text-sm font-bold text-cyan hover:text-cyan/80">
              Ver politica de reembolso e cancelamento
            </Link>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">Contato</h2>
            <p className="leading-relaxed text-white/60">
              Para duvidas sobre estes termos, suporte ou solicitacoes relacionadas a conta, fale conosco em
              contato@pianify.com.br.
            </p>
            <div className="mt-4 space-y-1 text-sm leading-relaxed text-white/45">
              <p>Fornecedor: {providerName} — {providerTaxId}</p>
              <p>{providerAddress}</p>
            </div>
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
