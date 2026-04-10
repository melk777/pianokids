import { Shield, Lock, Eye, Users, FileText } from "lucide-react";
import Link from "next/link";

export default function PrivacidadePage() {
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
          <p className="text-white/60 text-lg">Atualizado em 9 de Abril de 2026</p>
        </div>

        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 space-y-12">
          {/* Seção LGPD em destaque conforme exigência */}
          <section className="p-8 rounded-3xl bg-cyan/10 border border-cyan/20">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-cyan" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Transparência de Dados (LGPD)</h2>
            </div>
            <p className="text-white/80 text-lg leading-relaxed">
              Os dados de progressão nas aulas e o status da assinatura serão compartilhados exclusivamente com o professor parceiro que realizou a indicação do link, para fins estritos de acompanhamento pedagógico.
            </p>
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
                <li>E-mail do responsável legal (para usuários menores de 18 anos);</li>
                <li>Dados de progresso e performance musical;</li>
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
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-magenta" />
              Seus Direitos
            </h2>
            <p className="text-white/60 leading-relaxed">
              De acordo com a LGPD, você tem direito a acessar, corrigir, portar ou solicitar a exclusão de seus dados a qualquer momento através de nossa central de suporte.
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
