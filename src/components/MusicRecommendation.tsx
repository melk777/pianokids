"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Music, Sparkles, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { createClientComponent } from "@/lib/supabase";
import { useSFX } from "@/hooks/useSFX";

interface MusicRecommendationProps {
  hasPremium: boolean;
}

export default function MusicRecommendation({ hasPremium }: MusicRecommendationProps) {
  const [recommendation, setRecommendation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { playClick } = useSFX();
  const supabase = createClientComponent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPremium || !recommendation.trim() || isSubmitting) return;

    playClick();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("song_recommendations")
        .insert([{ recommendation: recommendation.trim() }]);

      if (error) throw error;

      setIsSuccess(true);
      setRecommendation("");
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error("Error submitting recommendation:", err);
      alert("Ocorreu um erro ao enviar sua sugestão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 mb-12 px-2">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative group"
      >
        {/* Glow Background Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan/20 via-magenta/20 to-cyan/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-gradient" />
        
        <div className="relative bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center icon-gradient shadow-[0_0_15px_rgba(255,0,229,0.2)]">
                <Music size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                  Sugestões de Músicas
                  <Sparkles size={16} className="text-amber-400" />
                </h4>
                <p className="text-white/40 text-sm">Ajude-nos a fazer a Pianify ainda melhor!</p>
              </div>
            </div>

            {!hasPremium && (
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                 <Lock size={12} />
                 Recurso Premium
               </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-bold text-white text-balance leading-tight">
              Gostaria de nos recomendar uma música para adicionarmos ao aprendizado?
            </h3>

            <form onSubmit={handleSubmit} className="relative mt-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={hasPremium ? "Ex: Let It Go - Frozen..." : "Faça o upgrade para sugerir músicas!"}
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  disabled={!hasPremium || isSubmitting || isSuccess}
                  className={`w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-5 pr-32 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50 transition-all ${
                    !hasPremium ? "cursor-not-allowed opacity-50 grayscale" : ""
                  }`}
                />
                
                <div className="absolute right-2 flex items-center gap-2">
                   <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-emerald-400 font-bold text-sm px-4"
                      >
                        <CheckCircle2 size={18} />
                        Enviado!
                      </motion.div>
                    ) : (
                      <motion.button
                        type="submit"
                        disabled={!hasPremium || !recommendation.trim() || isSubmitting}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                          hasPremium
                            ? "bg-gradient-to-r from-cyan to-magenta text-white hover:shadow-[0_0_20px_rgba(0,234,255,0.3)] active:scale-95"
                            : "bg-white/5 text-white/20 cursor-not-allowed"
                        } disabled:opacity-50`}
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        <span className="hidden md:inline">Enviar</span>
                      </motion.button>
                    )}
                   </AnimatePresence>
                </div>
              </div>
            </form>

            {!hasPremium && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 rounded-2xl bg-magenta/5 border border-magenta/20 flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-magenta/10 flex items-center justify-center text-magenta">
                    <Lock size={14} />
                  </div>
                  <p className="text-sm text-white/60">
                    O chat de sugestões é um recurso exclusivo para nossa **Comunidade Premium**.
                  </p>
                </div>
                <a 
                  href="/#pricing" 
                  className="text-sm font-bold text-magenta hover:text-magenta/80 transition-colors underline underline-offset-4"
                >
                  Ver Planos Premium
                </a>
              </motion.div>
            )}
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan/10 blur-3xl rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}
