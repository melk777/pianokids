"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Check, ScrollText } from "lucide-react";

interface TeacherTermsModalProps {
  onAccept: () => void;
  isOpen: boolean;
}

export default function TeacherTermsModal({ onAccept, isOpen }: TeacherTermsModalProps) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Use a tolerance of 10px to account for rounding errors
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasReadToBottom(true);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasReadToBottom(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-cyan" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Termo de Adesão ao Programa</h2>
            </div>
            <p className="text-white/40 text-sm">Leia atentamente os termos de parceria independente antes de prosseguir.</p>
          </div>

          {/* Body with scroll tracking */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="p-8 overflow-y-auto text-white/70 leading-relaxed font-medium space-y-6 custom-scrollbar"
          >
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/[0.03] border border-white/5">
              <ScrollText className="w-6 h-6 text-cyan shrink-0" />
              <p className="text-lg">
                A relação estabelecida neste programa é de <span className="text-white font-bold">parceria comercial independente</span>.
              </p>
            </div>

            <p>
              Fica expressamente declarado que <span className="text-cyan underline decoration-cyan/30 underline-offset-4">não há vínculo empregatício</span> sob as regras da CLT, subordinação jurídica ou controle de jornada entre a Pianify e o parceiro.
            </p>

            <p>
              O parceiro utiliza a plataforma como ferramenta terceirizada para complementar suas atividades pedagógicas ou profissionais, recebendo <span className="text-magenta font-bold">comissões/royalties exclusivas</span> pelas indicações ativas que resultarem em assinaturas confirmadas.
            </p>

            <p>
              A Pianify reserva-se o direito de rescindir a parceria caso sejam detectadas práticas abusivas, spam ou uso indevido da marca sem autorização prévia por escrito.
            </p>

            <div className="h-20 flex items-center justify-center border-t border-white/5 mt-8">
              {!hasReadToBottom && (
                <p className="text-cyan text-sm animate-pulse flex items-center gap-2">
                  <span>&darr;</span> Continue rolando para habilitar o aceite
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/30 uppercase tracking-widest font-bold">
              {hasReadToBottom ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Leitura Concluída
                </span>
              ) : (
                <span>Aguardando Leitura</span>
              )}
            </div>

            <button
              onClick={() => {
                if (hasReadToBottom) onAccept();
              }}
              disabled={!hasReadToBottom}
              className={`px-8 py-4 rounded-2xl font-bold transition-all ${
                hasReadToBottom 
                  ? "bg-white text-black hover:bg-white/90 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
              }`}
            >
              Li e Aceito os Termos
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
