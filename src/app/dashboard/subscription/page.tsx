"use client";

import { motion } from "framer-motion";
import { 
  Crown, 
  Clock, 
  CreditCard, 
  FileText, 
  ChevronLeft, 
  Download, 
  CheckCircle2, 
  Calendar,
  Loader2,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { useSFX } from "@/hooks/useSFX";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function SubscriptionPage() {
  const router = useRouter();
  const { playClick } = useSFX();
  const { 
    planType, 
    currentPeriodEnd, 
    subscriptionStart, 
    amount, 
    currency, 
    invoices, 
    isPro, 
    loading 
  } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleBack = () => {
    playClick();
    router.push("/dashboard");
  };

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      playClick();
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao acessar o portal.");
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert("Erro ao conectar com o Stripe.");
    } finally {
      setPortalLoading(false);
    }
  };

  const calculateDaysActive = () => {
    if (!subscriptionStart) return 0;
    const start = new Date(subscriptionStart);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysActive = calculateDaysActive();

  const benefits = [
    "Acesso a mais de 100 músicas",
    "Novas músicas adicionadas semanalmente",
    "Reconhecimento de áudio via inteligência artificial",
    "Relatórios detalhados de precisão e progresso",
    "Suporte prioritário via WhatsApp",
    "Peça 2 músicas pra você aprender no modo facil e dificil por mês"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-black text-white pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={handleBack}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold uppercase tracking-widest">Painel Principal</span>
          </motion.button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Main Info Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Crown size={120} className="text-magenta" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-magenta to-cyan flex items-center justify-center shadow-lg shadow-magenta/20">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Gerenciar Assinatura</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isPro ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isPro ? "text-green-400" : "text-white/40"}`}>
                          {isPro ? "Assinatura Ativa" : "Plano Gratuito"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-1">
                        Plano Atual
                      </span>
                      <span className="text-lg font-bold">
                        {planType === "yearly" ? "Pianify Pro Anual" : planType === "monthly" ? "Pianify Pro Mensal" : "Free"}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-1">
                        Dias Ativos
                      </span>
                      <span className="text-lg font-bold">{daysActive} dias</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Benefits Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-3xl p-8 border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan" />
                  Benefícios do seu Plano
                </h2>
                <div className="grid gap-4">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Invoices List */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-3xl p-8 border border-white/10"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white/60" />
                  Histórico de Faturas
                </h2>
                
                {invoices && invoices.length > 0 ? (
                  <div className="space-y-4">
                    {invoices.map((inv) => (
                      <div 
                        key={inv.id} 
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                             <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">
                              {format(new Date(inv.date), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-white/40 uppercase tracking-tighter">
                              Status: {inv.status === 'paid' ? 'Pago' : inv.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <span className="text-sm font-bold">
                             {(inv.amount / 100).toLocaleString('pt-br', { style: 'currency', currency: inv.currency || "BRL" })}
                           </span>
                           {inv.pdf_url && (
                             <a 
                               href={inv.pdf_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan hover:text-white transition-all text-white/40"
                             >
                               <Download className="w-4 h-4" />
                             </a>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-white/20 italic text-sm">
                    Nenhuma fatura encontrada.
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column: Billing & Portal */}
            <div className="space-y-8">
              {/* Billing Summary Card */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="glass rounded-3xl p-6 border border-white/10"
              >
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Dados de Cobrança
                </h3>

                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Valor</span>
                    <span className="font-bold text-gradient">
                      {amount?.toLocaleString('pt-br', { style: 'currency', currency: currency || "BRL" })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-balance">
                    <span className="text-white/50">Próxima cobrança</span>
                    <span className="font-bold">
                      {currentPeriodEnd 
                        ? format(new Date(currentPeriodEnd), "dd/MM/yyyy") 
                        : "---"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Iniciado em</span>
                    <span className="font-bold">
                      {subscriptionStart 
                        ? format(new Date(subscriptionStart), "dd/MM/yyyy") 
                        : "---"}
                    </span>
                  </div>

                  <div className="h-px bg-white/5 w-full my-4" />

                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full py-4 px-6 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-3 hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                  >
                    {portalLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Gerenciar no Stripe
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-white/30 px-4">
                    Altere seu cartão de crédito, plano ou cancele sua assinatura com segurança no portal oficial do Stripe.
                  </p>
                </div>
              </motion.div>

              {/* Need Help Card */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-3xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-cyan" />
                  </div>
                  <h4 className="font-bold">Dúvidas?</h4>
                </div>
                <p className="text-sm text-white/50 mb-4 leading-relaxed">
                  Problemas com sua fatura ou acesso? Nossa equipe de suporte está pronta para ajudar.
                </p>
                <a 
                  href="mailto:suporte@pianify.app"
                  className="text-sm font-bold text-cyan hover:underline"
                >
                  Entrar em contato
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
