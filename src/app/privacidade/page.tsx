import { Shield, Lock, Eye, Users, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacidadePage() {
  const controllerName = process.env.COMPANY_LEGAL_NAME || "Identificação do controlador pendente";
  const controllerTaxId = process.env.COMPANY_TAX_ID || "CPF ou CNPJ pendente";
  const controllerAddress = process.env.COMPANY_ADDRESS || "Endereço de atendimento pendente";

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-magenta/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-magenta/20 bg-magenta/5 text-magenta text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" />
            Compromisso com sua Segurança
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Política de <span className="text-magenta">Privacidade</span></h1>
          <p className="text-white/60 text-lg">Versão 2026-09-01</p>
        </div>

        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-12">
          {/* Seção LGPD em destaque conforme exigência */}
          <section className="p-8 rounded-3xl bg-cyan/10 border border-cyan/20">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-cyan" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Transparência de Dados (LGPD)</h2>
            </div>
            <p className="text-white/80 text-lg leading-relaxed">
              Tratamos apenas os dados necessários para operar a conta, entregar a experiência musical, processar a assinatura, proteger a plataforma e cumprir obrigações legais. Você pode solicitar acesso, correção, portabilidade ou eliminação pelos canais indicados abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Controlador e contato</h2>
            <div className="space-y-2 text-white/60 leading-relaxed">
              <p>{controllerName} — {controllerTaxId}</p>
              <p>{controllerAddress}</p>
              <p>Canal de privacidade: contato@pianify.com.br</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Lock className="w-5 h-5 text-magenta" />
              Coleta de Informações
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed">
              <p>Coletamos informações necessárias para proporcionar a melhor experiência de aprendizado:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dados de cadastro (e-mail, nome, data de nascimento);</li>
                <li>Dados de progresso e performance musical;</li>
                <li>Dados de cobrança e identificadores do Stripe; a Pianify não armazena o número completo do cartão;</li>
                <li>Para professores parceiros: CPF, telefone, chave PIX, indicações e repasses;</li>
                <li>Informações técnicas de acesso e uso da plataforma.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan" />
              Uso dos Dados
            </h2>
            <p className="text-white/60 leading-relaxed">
              Seus dados são utilizados para personalizar seu plano de estudos, processar pagamentos de assinatura, comunicar novidades e, no caso de alunos indicados por professores, permitir que seu tutor acompanhe seu desenvolvimento musical de forma técnica.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Microfone</h2>
            <p className="text-white/60 leading-relaxed">
              Quando você autoriza o microfone, o áudio é analisado no próprio navegador para identificar notas. A Pianify não envia nem armazena gravações de áudio nos servidores como parte do funcionamento atual do player.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Compartilhamento e operadores</h2>
            <p className="text-white/60 leading-relaxed">
              Usamos fornecedores de infraestrutura e operação, incluindo Vercel (hospedagem), Supabase (autenticação e banco), Stripe (pagamentos) e Cloudflare Turnstile (prevenção de abuso). Dados estritamente necessários podem ser processados em outros países conforme os mecanismos legais aplicáveis. Se a conta foi criada por um código de professor, indicadores de assinatura e progresso podem ser compartilhados com esse professor para comissão e acompanhamento pedagógico.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Retenção e segurança</h2>
            <p className="text-white/60 leading-relaxed">
              Mantemos dados enquanto a conta estiver ativa e pelo período necessário para cumprir o contrato, prevenir fraude, resolver disputas e atender obrigações fiscais e legais. Depois disso, os dados são eliminados ou anonimizados quando aplicável. Adotamos controle de acesso, criptografia em trânsito, registros de auditoria e segregação de credenciais, sem prometer segurança absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Pessoas menores de 18 anos</h2>
            <p className="text-white/60 leading-relaxed">
              O cadastro está temporariamente restrito a maiores de 18 anos. O recurso social e as mensagens diretas também estão desativados no lançamento. Um fluxo para menores somente será aberto depois da implantação de aferição de idade, controles do responsável e salvaguardas compatíveis com o melhor interesse de crianças e adolescentes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-magenta" />
              Seus Direitos
            </h2>
            <p className="text-white/60 leading-relaxed">
              De acordo com a LGPD, você tem direito a acessar, corrigir, portar ou solicitar a exclusão de seus dados a qualquer momento através de nossa central de suporte.
            </p>
            <p className="mt-4 text-white/60 leading-relaxed">
              Envie a solicitação para contato@pianify.com.br usando o e-mail da conta. Podemos pedir confirmação de identidade. A solicitação é gratuita; alguns registros podem ser preservados quando houver obrigação legal ou necessidade de exercício regular de direitos.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">
            &larr; Voltar para a Home
          </Link>
        </div>
      </div>
    </main>
  );
}
