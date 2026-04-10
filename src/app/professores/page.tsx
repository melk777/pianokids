"use client";

import { motion } from "framer-motion";
import { ChevronRight, Link as LinkIcon, DollarSign, Clock, MessageCircle, Mail, Users } from "lucide-react";
import Link from "next/link";
import { useSFX } from "@/hooks/useSFX";

export default function ProfessoresPage() {
  const { playClick } = useSFX();

  return (
    <div className="min-h-screen pt-32 pb-24 selection:bg-cyan/30">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan/10 via-transparent to-transparent pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 text-center mb-24 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/20 bg-cyan/5 text-cyan text-sm font-semibold mb-8"
        >
           Programa de Afiliados B2B
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight text-white"
        >
          Seja um parceiro e gere <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">renda recorrente</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xl font-medium max-w-2xl mx-auto mb-10"
        >
          Complemente as aulas dos seus alunos com a plataforma Pianify e ganhe R$ 5,00/mês no plano mensal ou R$ 40,00 por cada assinatura anual ativa. Todo mundo ganha!
        </motion.p>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Link 
            href="/login?role=teacher"
            onClick={() => playClick()}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-cyan to-magenta hover:shadow-[0_0_40px_rgba(0,234,255,0.4)] transition-all active:scale-95 group shadow-[0_0_20px_rgba(0,234,255,0.1)]"
          >
            Quero me Cadastrar Gratuitamente
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Dashboard Explainer Section */}
      <section className="max-w-6xl mx-auto px-6 mb-32 relative z-10">
        <div className="glass p-8 md:p-14 rounded-[3rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-magenta/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Transparência total no seu <span className="text-emerald-400">Painel Exclusivo</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Ao criar sua conta de professor, você ganha acesso a uma central de controle onde nada fica de fora. Veja como é simples gerenciar seus recebimentos:
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-5 h-5 text-cyan" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Link Único de Indicação</h4>
                    <p className="text-white/50">Você terá um link personalizado oficial. Basta copiá-arlo e enviar no WhatsApp ou colocar na bio da sua escola.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Acompanhamento dos Alunos Real-Time</h4>
                    <p className="text-white/50">Nosso sistema não esconde nada! Você verá na sua tabela os Nomes e perfis de todos os alunos que acessaram pelo seu link e se a assinatura deles está ativa ou não.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-magenta/10 border border-magenta/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-magenta" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Simulador Financeiro Nativo</h4>
                    <p className="text-white/50">Veja exatamente o quanto você tem provisionado para receber no fim do mês com base nos seus alunos Premium.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Saques Garantidos (30 dias)</h4>
                    <p className="text-white/50">Cada comissão entra na sua carteira visível imediatamente. O valor fica disponível para transferência bancária exatamente 30 dias após o pagamento do aluno compensar.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Mockup Representation */}
              <div className="w-full aspect-square md:aspect-[4/3] bg-[#0a0a0a] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                {/* Header Mockup */}
                <div className="h-14 border-b border-white/10 flex items-center px-6 gap-4 bg-white/[0.02]">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="ml-4 h-6 w-48 bg-white/5 rounded-lg" />
                </div>
                {/* Body Mockup */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-8 w-40 bg-white/10 rounded-lg" />
                    <div className="h-10 w-32 bg-cyan/20 rounded-xl border border-cyan/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="h-24 bg-white/5 rounded-2xl border border-white/10 p-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 mb-3" />
                      <div className="h-4 w-16 bg-white/20 rounded mb-2" />
                      <div className="h-6 w-24 bg-white/40 rounded" />
                    </div>
                    <div className="h-24 bg-white/5 rounded-2xl border border-white/10 p-4">
                      <div className="w-8 h-8 rounded-full bg-cyan/20 mb-3" />
                      <div className="h-4 w-16 bg-white/20 rounded mb-2" />
                      <div className="h-6 w-24 bg-white/40 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-12 w-full bg-white/[0.03] rounded-xl border border-white/5" />
                    <div className="h-12 w-full bg-white/[0.03] rounded-xl border border-white/5" />
                    <div className="h-12 w-full bg-white/[0.03] rounded-xl border border-white/5" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 -bottom-6 glass px-6 py-4 rounded-2xl border border-emerald-500/30 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-bold">R$ 500,00 Liberados</span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="max-w-4xl mx-auto px-6 mb-32 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Você não está sozinho</h2>
        <p className="text-white/60 text-lg mb-10">
          Nossa equipe de suporte trata nossos professores parceiros como prioridade VIP. Sempre que precisar de ajuda com repasses, links ou dúvidas de alunos, estaremos à disposição rapidamente via:
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <div className="glass px-8 py-6 rounded-2xl border border-white/10 flex items-center justify-center gap-4">
            <Mail className="w-6 h-6 text-cyan" />
            <span className="text-white font-bold">E-mail Direto</span>
          </div>
          <div className="glass px-8 py-6 rounded-2xl border border-white/10 flex items-center justify-center gap-4">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
            <span className="text-white font-bold">Suporte via WhatsApp</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="glass rounded-3xl p-12 text-center border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-magenta/10 opacity-50" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Pronto para aumentar sua renda?</h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Seja para gerar uma grana extra no fim do mês ou transformar as indicações numa mensalidade sólida, acesse agora e garanta seu link especial.
            </p>
            <Link 
              href="/login?role=teacher"
              onClick={() => playClick()}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-cyan to-magenta hover:shadow-[0_0_40px_rgba(0,234,255,0.4)] transition-all active:scale-95 group"
            >
              Acessar / Cadastrar minha Conta
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
