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
        <p className="text-white/60 mb-6">
          Essa área é exclusiva para alunos do plano PianoKids Pro. Você será redirecionado para os planos em instantes...
        </p>

        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </motion.div>
    </div>
  );
}
