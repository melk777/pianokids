"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Usb, Activity, CheckCircle2, ChevronRight, X } from "lucide-react";

interface MidiSetupProps {
  isOpen: boolean;
  isConnected: boolean;
  onConnect: () => Promise<boolean>;
  onClose: () => void;
}

export default function MidiSetup({ isOpen, isConnected, onConnect, onClose }: MidiSetupProps) {
  const [hasRequested, setHasRequested] = useState(false);

  // Solicita automaticamente permissão MIDI assim que o Componente abrir
  useEffect(() => {
    if (isOpen && !isConnected && !hasRequested) {
      setHasRequested(true);
      // Tentativa silenciosa de pedir permissão do navegador
      onConnect();
    }
  }, [isOpen, isConnected, hasRequested, onConnect]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-hide bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 relative shadow-2xl"
        >
          {/* Brilho decorativo de fundo alterando conforme o status */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[100px] pointer-events-none transition-colors duration-1000 ${
              isConnected ? "bg-emerald-500/20" : "bg-amber-500/10"
            }`}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2">Setup do Teclado</h2>
            <p className="text-white/50 text-sm">
              Siga os passos rápidos abaixo para plugar e começar a tocar.
            </p>
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            {/* Steps Guiados */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-full bg-cyan/10 flex items-center justify-center icon-gradient shrink-0">
                <Usb size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Passo 1: Conecte o USB</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Ligue seu teclado musical na porta USB do computador usando um cabo compatível.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-full bg-cyan/10 flex items-center justify-center icon-gradient shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Passo 2: Ligue o Aparelho</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Certifique-se de que o teclado está ligado na tomada. Se o navegador pedir permissão de Dispositivos MIDI, clique em &quot;Permitir&quot;.
                </p>
              </div>
            </div>

            {/* Painel Dinâmico de Status (Pulsante) */}
            <div
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 mt-2 ${
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-amber-500/5 border-amber-500/20"
              }`}
            >
              <div className="relative shrink-0">
                {isConnected ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                  >
                    <CheckCircle2 size={24} />
                  </motion.div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    {/* Anel Amarelo Expansivo */}
                    <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
                  </>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold transition-colors duration-500 ${
                    isConnected ? "text-emerald-400" : "text-amber-500"
                  }`}
                >
                  {isConnected ? "Teclado Detectado - Pronto para Tocar!" : "Aguardando Conexão..."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4 relative z-10">
            {!isConnected ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-4 rounded-xl text-white/50 hover:text-white transition-colors"
                >
                  Jogar sem teclado
                </button>
                <div className="flex-1" />
                <button
                  onClick={onConnect}
                  className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Tentar Novamente
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500 text-black font-bold text-lg hover:bg-emerald-400 transition-all active:scale-[0.98]"
              >
                Tudo Certo, Vamos Tocar!
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
