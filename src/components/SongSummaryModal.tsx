"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Hand, 
  Play,
  ArrowLeft
} from "lucide-react";
import Image from "next/image";
import { Song } from "@/lib/songs";
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX";

interface SongSummaryModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SongSummaryModal({ song, isOpen, onClose }: SongSummaryModalProps) {
  const router = useRouter();
  const { playClick } = useSFX();
  
  // States based on logic from Image_2
  const [leftHand, setLeftHand] = useState(false);
  const [rightHand, setRightHand] = useState(true); // Default one hand
  const [micEnabled, setMicEnabled] = useState(false);

  // Difficulty Logic: 1 Hand = Fácil (Verde), 2 Hands = Difícil (Vermelho)
  const activeHandsCount = (leftHand ? 1 : 0) + (rightHand ? 1 : 0);
  const isHard = activeHandsCount === 2;
  const difficultyLabel = isHard ? "DIFÍCIL" : "FÁCIL";


  // Reset state when opening a new song
  useEffect(() => {
    if (isOpen) {
      setLeftHand(false);
      setRightHand(true);
      setMicEnabled(false);
    }
  }, [isOpen]);

  if (!song) return null;

  const handleStart = () => {
    playClick();
    // Navigate to play page with settings
    const params = new URLSearchParams();
    params.set("leftHand", leftHand.toString());
    params.set("rightHand", rightHand.toString());
    params.set("mic", micEnabled.toString());
    
    router.push(`/dashboard/play/${song.id}?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
        >
          {/* Overlay Escuro com Estrelas (Inspirado no Game Engine) */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          >
             {/* Starry Effect Background Overlay */}
             <div className="absolute inset-0 opacity-40 pointer-events-none" 
               style={{ 
                 backgroundImage: `radial-gradient(1px 1px at 20px 30px, white, rgba(0,0,0,0)), 
                                   radial-gradient(1px 1px at 40px 70px, white, rgba(0,0,0,0)),
                                   radial-gradient(2px 2px at 50px 160px, white, rgba(0,0,0,0)),
                                   radial-gradient(2px 2px at 90px 40px, white, rgba(0,0,0,0)),
                                   radial-gradient(1px 1px at 130px 80px, white, rgba(0,0,0,0))`,
                 backgroundSize: '200px 200px'
               }}
             />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-4xl flex flex-col md:flex-row gap-6 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── BOTÃO VOLTAR (Canto Superior Esquerdo) ── */}
            <button 
              onClick={onClose}
              className="absolute -top-12 left-0 md:top-0 md:-left-16 text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={32} />
            </button>

            {/* ── SEÇÃO ESQUERDA: MEDALHÃO (Image_2 Style) ── */}
            <div className="relative group perspective-1000">
               {/* Moldura Ornamentada (CSS Rings) */}
               <div className="absolute -inset-4 border border-white/5 rounded-full animate-pulse-slow" />
               <div className="absolute -inset-8 border border-white/5 rounded-full opacity-50" />
               
               <div className="relative w-48 h-48 md:w-72 md:h-72 rounded-full overflow-hidden border-8 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)] ring-2 ring-white/10 group-hover:scale-[1.02] transition-transform duration-500">
                  <Image 
                    src={song.coverUrl || "/images/covers/default.png"} 
                    alt={song.title}
                    fill
                    className="object-cover brightness-75 group-hover:brightness-100 transition-all duration-700"
                  />
                  {/* Overlay Gradiente Pós-Capa */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               </div>

               {/* Ornamentos Laterais (Símbolo de Estrelas / Pontos) */}
               <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                 {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
               </div>
            </div>

            {/* ── SEÇÃO DIREITA: PAINEL DE INFORMAÇÕES (Image_2 Style) ── */}
            <div className="flex-1 w-full bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl flex flex-col gap-6">
              
              {/* Título e Compositor */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-cyan/60 tracking-widest uppercase mb-2 block">{song.category}</span>
                <h2 className="text-3xl md:text-4xl font-black text-[#FDFCF0] drop-shadow-lg">{song.title}</h2>
                <p className="text-lg text-white/40 font-medium">{song.artist}</p>
              </div>

              {/* Seleção de Mãos de Prática */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white/30 uppercase tracking-[4px]">Selecionar mãos de prática</h3>
                  
                  {/* Barra de Dificuldade Dinâmica */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black tracking-widest ${isHard ? 'text-red-400' : 'text-emerald-400'}`}>
                      NÍVEL {difficultyLabel}
                    </span>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ 
                          width: isHard ? '100%' : '50%',
                          backgroundColor: isHard ? '#EF4444' : '#10B981'
                        }}
                        className="h-full rounded-full" 
                        style={{ boxShadow: isHard ? '0 0 10px rgba(239,68,68,0.5)' : '0 0 10px rgba(16,185,129,0.5)' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  {/* Botão Mão Esquerda (Opcional) */}
                  <button 
                    onClick={() => { playClick(); setLeftHand(!leftHand); }}
                    className={`flex-1 h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group ${
                      leftHand 
                        ? "bg-zinc-100 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)] outline outline-4 outline-white/10" 
                        : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                    }`}
                  >
                    <Hand 
                      size={28} 
                      className={`transition-all duration-500 ${leftHand ? "text-zinc-900 scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)]" : "text-white/20"}`} 
                    />
                    <span className={`text-[9px] font-black tracking-widest uppercase ${leftHand ? "text-zinc-900" : "text-white/20"}`}>Mão Esquerda</span>
                    
                    {/* Status Dot */}
                    <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full transition-all duration-500 ${leftHand ? "bg-emerald-500 shadow-[0_0_8px_#10B981]" : "bg-white/5"}`} />
                  </button>

                  {/* Painel Mão Direita (Obrigatória) */}
                  <div 
                    className="flex-1 h-24 rounded-2xl border-2 bg-zinc-100 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)] outline outline-4 outline-white/10 flex flex-col items-center justify-center gap-2 relative transition-all duration-300"
                  >
                    <Hand 
                      size={28} 
                      className="text-zinc-900 scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)] transform -scale-x-100" 
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black tracking-widest uppercase text-zinc-900">Mão Direita</span>
                      <span className="text-[7px] font-bold text-zinc-900/40 uppercase">Obrigatória</span>
                    </div>
                    
                    {/* Active Dot */}
                    <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                  </div>
                </div>
              </div>

              {/* Ativação do Microfone */}
              <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:bg-white/[0.05] transition-all cursor-pointer"
                onClick={() => { playClick(); setMicEnabled(!micEnabled); }}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    micEnabled ? "bg-cyan shadow-[0_0_20px_rgba(0,234,255,0.4)] text-black" : "bg-white/5 text-white/20"
                  }`}>
                    {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Modo Reconhecimento</h4>
                    <p className="text-sm text-white/30">Usar microfone para validar notas</p>
                  </div>
                </div>
                
                {/* Custom Toggle Switch */}
                <div className={`w-12 h-6 rounded-full transition-all duration-300 relative p-1 ${micEnabled ? "bg-cyan" : "bg-red-500/20"}`}>
                  <motion.div 
                    animate={{ x: micEnabled ? 24 : 0 }}
                    className={`w-4 h-4 rounded-full shadow-lg ${micEnabled ? "bg-white" : "bg-red-500"}`} 
                  />
                </div>
              </div>

              {/* Botão Começar o Jogo (Image_2 Gradient Style) */}
              <button
                onClick={handleStart}
                disabled={!micEnabled}
                className={`group relative w-full h-16 rounded-full overflow-hidden transition-all duration-500 mt-2 ${
                  micEnabled 
                    ? "hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(239,68,68,0.4)] opacity-100" 
                    : "opacity-40 cursor-not-allowed filter grayscale-[0.5]"
                }`}
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r from-[#F97316] via-[#EF4444] to-[#F97316] bg-[length:200%_100%] ${micEnabled ? "animate-gradient-slow" : ""}`} />
                
                <div className="relative h-full flex items-center justify-between px-8">
                  <span className="text-lg font-black uppercase text-white tracking-[2px]">
                    {micEnabled ? "Começar o Jogo" : "Ative o Microfone"}
                  </span>
                  
                  <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-all ${micEnabled ? "group-hover:bg-white/40" : ""}`}>
                    {micEnabled ? (
                      <Play size={20} fill="currentColor" className="ml-1 text-white" />
                    ) : (
                      <MicOff size={20} className="text-white/60" />
                    )}
                  </div>
                </div>
              </button>

              {/* Footer text based on Image_2 UI hints */}
              <div className="flex justify-center gap-8 text-[10px] font-black text-white/10 uppercase tracking-widest">
                <span>MIDI SUPPORT: ON</span>
                <span>BPM: {song.bpm}</span>
                <span>ESTIMATED: {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
