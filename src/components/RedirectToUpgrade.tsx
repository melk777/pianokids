"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function RedirectToUpgrade() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a página inicial (onde ficam os planos) após 3 segundos
    const timer = setTimeout(() => {
      router.push("/#pricing");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass p-8 rounded-3xl max-w-md w-full border border-magenta/20 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full bg-magenta/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-magenta" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">Acesso Restrito</h2>
        <p className="text-white/60 mb-8 px-4">
          Essa área é exclusiva para alunos do plano Pianify Pro. Você será redirecionado para os planos em instantes...
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/#pricing")}
          className="w-full py-3.5 bg-gradient-to-r from-cyan to-magenta text-white font-bold rounded-xl mb-6 shadow-[0_0_20px_rgba(0,234,255,0.2)] hover:shadow-[0_0_30px_rgba(0,234,255,0.4)] transition-all"
        >
          Ver Planos Premium
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Carregando...</span>
        </div>
      </motion.div>
    </div>
  );
}
