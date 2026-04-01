"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Star, RotateCcw, SkipForward, LogOut } from "lucide-react";

interface ScoreScreenProps {
  accuracy: number;
  score: number;
  combo: number;
  onRestart: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function ScoreScreen({
  accuracy,
  score,
  combo,
  onRestart,
  onNext,
  onExit,
}: ScoreScreenProps) {
  const isPerfect = accuracy >= 80;

  // Calculando quantas estrelas acender
  const activeStars =
    accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : accuracy > 0 ? 1 : 0;

  useEffect(() => {
    if (isPerfect) {
      // Disparo de Confetes Múltiplos
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#00EAFF", "#FF00E5", "#34D399", "#FBBF24"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#00EAFF", "#FF00E5", "#34D399", "#FBBF24"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isPerfect]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 18, bounce: 0.4 }}
        className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
      >
        {/* Efeito Glow Subjacente Atrás das Estrelas */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 blur-[80px] pointer-events-none transition-colors duration-1000 ${
            isPerfect ? "bg-amber-500/30" : "bg-cyan/20"
          }`}
        />

        <div className="flex flex-col items-center">
          {/* 1. Animação de Estrelas Douradas */}
          <div className="flex items-center gap-4 mb-6">
            {[1, 2, 3].map((starIndex) => {
              const isActive = activeStars >= starIndex;
              // Center star is slightly larger and higher
              const isCenter = starIndex === 2;

              return (
                <motion.div
                  key={starIndex}
                  initial={{ opacity: 0, scale: 0, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + starIndex * 0.15, type: "spring" }}
                  className={`${isCenter ? "-mt-6" : ""}`}
                >
                  <Star
                    size={isCenter ? 64 : 48}
                    className={`transition-colors duration-500 ${
                      isActive
                        ? "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] fill-amber-400"
                        : "text-white/10 fill-transparent"
                    }`}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* 2. Mensagem Motivacional Motivacional */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl font-bold text-white mb-2 text-center"
          >
            {isPerfect ? "Sensacional! Você é um Astro! 🌟" : "Quase lá! Vamos praticar mais? 💪"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/40 mb-8 max-w-sm text-center"
          >
            Precisão de acerto: <span className="text-white font-semibold">{Math.round(accuracy)}%</span>
            <br />
            Pontos: <span className="text-cyan font-bold">{score.toLocaleString()}</span> &bull; Máximo Combo: <span className="text-magenta font-bold">{combo}x</span>
          </motion.p>

          {/* 3. Botões de Ação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col w-full gap-3"
          >
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-cyan text-black font-bold text-lg hover:bg-cyan-400 transition-colors active:scale-[0.98]"
            >
              <RotateCcw size={20} />
              Tocar Novamente
            </button>

            <button
              onClick={onNext}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors active:scale-[0.98]"
            >
              <SkipForward size={20} />
              Próxima Música
            </button>

            <button
              onClick={onExit}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white/30 hover:text-white/60 transition-colors active:scale-[0.98]"
            >
              <LogOut size={16} />
              Sair para a Biblioteca
            </button>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
}
