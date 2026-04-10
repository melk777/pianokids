"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useSFX } from "@/hooks/useSFX";

export default function TeacherAffiliateSection() {
  const { playClick } = useSFX();
  const [students, setStudents] = useState<number | "">(""); 


  // Real-time calculation logic
  const handleStudentsChange = (val: string) => {
    const num = val === "" ? "" : Number(val);
    setStudents(num);
  };

  const safeStudents = students === "" ? 0 : students;

  return (
    <section className="relative py-24 pb-32 overflow-hidden selection:bg-cyan/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-cyan/5 via-magenta/5 to-transparent rounded-full blur-[120px] pointer-events-none opacity-50" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight text-white"
          >
            Transforme sua Escola em um Polo de <br />
            <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent font-black">
              Tecnologia e Renda Recorrente
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-xl font-medium max-w-2xl mx-auto mb-10"
          >
            Complemente as aulas dos seus alunos com a plataforma Pianify e ganhe R$ 5,00/mês no plano mensal ou R$ 40,00 por cada assinatura anual ativa. Todo mundo ganha!
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* CALCULATOR */}
          <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,234,255,0.05)] relative overflow-hidden"
          >
            <div className="absolute -inset-24 bg-gradient-to-br from-cyan/20 to-magenta/10 blur-[60px] opacity-20 pointer-events-none" />
            
            <div className="relative">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <h3 className="text-xl font-bold mb-2">Plano Pianify Pro Mensal</h3>
                <p className="text-white/40 text-sm">O aluno paga R$ 29,90/mês e o professor recebe R$ 5,00 recorrentes enquanto a assinatura estiver ativa.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8">
                <h3 className="text-xl font-bold mb-2">Plano Pianify Pro Anual</h3>
                <p className="text-white/40 text-sm">O aluno paga R$ 239,90/ano e o professor recebe R$ 40,00 no ato da assinatura (e a cada renovação anual).</p>
              </div>

              <div className="space-y-8">
                {/* Input: Students */}
                <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 focus-within:border-cyan/50 transition-colors">
                   <label className="text-white/60 text-sm font-semibold flex items-center gap-2 mb-3 uppercase tracking-wider">
                     <Users className="w-4 h-4 text-cyan" /> Quantos alunos você indicará?
                   </label>
                   <input 
                     type="number"
                     placeholder="Ex: 50"
                     value={students}
                     onChange={(e) => handleStudentsChange(e.target.value)}
                     className="w-full bg-transparent text-3xl font-black text-white focus:outline-none placeholder:text-white/10"
                   />
                </div>

                {/* Side-by-Side Results */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Ganhos Mensais</p>
                    <div className="text-xl sm:text-2xl font-black text-white">
                      R$ {(safeStudents * 5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[9px] text-white/40 mt-1 italic">Assinaturas Mensais</p>
                  </div>

                  <div className="glass p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Bônus Anual</p>
                    <div className="text-xl sm:text-2xl font-black text-white">
                      R$ {(safeStudents * 40).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[9px] text-white/40 mt-1 italic">Cada assinatura Anual</p>
                  </div>
                </div>

                {/* Explainer */}
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[13px] text-white/50 leading-relaxed font-medium">
                    Você ganha <strong className="text-emerald-400">R$ 5,00/mês</strong> por cada aluno no plano mensal OU <strong className="text-cyan">R$ 40,00</strong> de repasse único (anual) por cada aluno no plano anual.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* EXPLANATORY TEXT */}
          <motion.div
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="flex flex-col h-full justify-center"
          >
            <h3 className="text-2xl font-black mb-8 text-white leading-tight">
              Sua autoridade como professor, aliada à tecnologia que <span className="text-cyan">escala seus ganhos</span>.
            </h3>
            
            <div className="space-y-6 text-white/70 font-medium text-lg leading-relaxed">
              <div>
                <p className="font-bold text-white mb-2 italic">Como funciona a parceria:</p>
                <ul className="space-y-3 pl-4 border-l-2 border-cyan/30">
                  <li>• Seus alunos ganham uma ferramenta poderosa de auxílio aos estudos.</li>
                  <li>• Você oferece um diferencial tecnológico exclusivo na sua região.</li>
                  <li>• Você recebe <strong className="text-white">repasse mensal vitalício</strong> por cada assinatura ativa.</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-white mb-2 italic">Modalidades de Comissão:</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> <span className="text-white">Plano Mensal (R$ 29,90) = <strong className="text-emerald-400">R$ 5,00/mês</strong></span></li>
                  <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" /> <span className="text-white">Plano Anual = <strong className="text-cyan-400">R$ 40,00 de repasse no ano</strong></span></li>
                </ul>
                <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold mt-4">
                  Sem limites de indicação. Sua rede, seu lucro.
                </p>
              </div>

                <div className="p-5 bg-gradient-to-br from-cyan/15 via-black/40 to-magenta/10 border border-white/10 rounded-2xl text-white/90 text-[15px] shadow-2xl">
                  <strong className="text-cyan">Zero Esforço Comercial:</strong> Você não vende. Você apenas compartilha uma solução que acelera o progresso do seu aluno. Nós cuidamos do resto.
                </div>

               <div>
                 <p className="font-bold text-white mb-2">É uma parceria onde todo mundo ganha:</p>
                 <ul className="space-y-2 pl-4 border-l-2 border-magenta/30">
                   <li>• O aluno aprende mais</li>
                   <li>• Você aumenta sua renda</li>
                   <li>• E ainda fortalece sua autoridade como professor</li>
                 </ul>
               </div>
            </div>

             <div className="pt-8 mt-auto">
                <Link 
                  href="/professores"
                  onClick={() => playClick()}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base text-white bg-white/10 hover:bg-white/20 transition-all active:scale-95 group border border-white/20"
                >
                  Quero saber mais
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
