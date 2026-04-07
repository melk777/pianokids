"use client";

import { useSFX } from "@/hooks/useSFX";
import { useBackgroundMusic } from "@/contexts/AudioContext";
import { Play, Pause, Music, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SoundButton() {
  const { playClick } = useSFX();
  const { isPlaying, toggleBackgroundMusic, playBackgroundMusic } = useBackgroundMusic();

  const handleInteraction = () => {
    playClick();
    // Ativa a música na primeira interação, pois browsers bloqueiam autoplay
    if (!isPlaying) playBackgroundMusic();
  };

  return (
    <div className="flex flex-col gap-4 p-6 glass rounded-2xl border border-white/10 max-w-xs transition-all hover:border-cyan/30">
      <h4 className="text-sm font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
        <Volume2 className="w-4 h-4 icon-gradient" />
        Controles de Áudio
      </h4>

      <div className="flex gap-3">
        {/* Botão de SFX */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInteraction}
          className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          Teste SFX
        </motion.button>

        {/* Botão de Música de Fundo */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleBackgroundMusic}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isPlaying 
              ? "bg-cyan text-black shadow-[0_0_15px_rgba(0,234,255,0.3)]" 
              : "bg-white/5 text-white/50 border border-white/10"
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Music className="w-4 h-4" />}
          {isPlaying ? "Pausar BGM" : "Tocar BGM"}
        </motion.button>
      </div>

      <p className="text-[10px] text-white/30 italic text-center">
        Dica: Clique em "Teste SFX" para ouvir o clique e ativar a música de fundo.
      </p>
    </div>
  );
}
