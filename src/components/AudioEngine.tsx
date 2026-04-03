"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Activity } from "lucide-react";
import { PitchDetector } from "pitchy";

/* ──────────────────────────────────────────────────────
   Utilitários de conversão de Frequência para Nota
   ────────────────────────────────────────────────────── */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNote(frequency: number): string {
  const n = Math.round(12 * Math.log2(frequency / 440) + 69);
  const name = NOTE_NAMES[n % 12];
  const octave = Math.floor(n / 12) - 1;
  return `${name}${octave}`;
}

export default function AudioEngine() {
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<number>(0);
  const [clarity, setClarity] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      const audioContext = new AudioContextClass();

      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const input = new Float32Array(detector.inputLength);

      setIsListening(true);

      const updatePitch = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(input);
        
        // Calcular Volume (RMS)
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);
        setVolume(rms);

        // Detectar Pitch
        const [pitch, clarityValue] = detector.findPitch(input, audioContext.sampleRate);
        
        setClarity(clarityValue);

        // Filtro de Ruído: Só exibe se o volume for audível e a nota for clara
        if (rms > 0.01 && clarityValue > 0.85) {
          setFrequency(pitch);
          setCurrentNote(frequencyToNote(pitch));
        } else if (rms < 0.005) {
          setCurrentNote(null);
        }

        animationFrameRef.current = requestAnimationFrame(updatePitch);
      };

      updatePitch();
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Por favor, permita o acesso ao microfone para usar o reconhecimento de notas.");
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setCurrentNote(null);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 glass rounded-3xl border border-white/10 w-full max-w-sm mx-auto overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-3 rounded-full ${isListening ? 'bg-cyan/20 text-cyan animate-pulse' : 'bg-white/5 text-white/40'}`}>
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </div>
        <h3 className="text-xl font-bold text-white">Reconhecimento</h3>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        {/* Anéis de Pulsação de Áudio */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1 + volume * 2, opacity: 0.1 }}
                className="absolute inset-0 bg-cyan rounded-full"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1 + volume * 4, opacity: 0.05 }}
                className="absolute inset-0 bg-cyan rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        <div className="z-10 text-center">
          <AnimatePresence mode="wait">
            {currentNote ? (
              <motion.div
                key={currentNote}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              >
                {currentNote}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="text-white flex flex-col items-center gap-2"
              >
                <Activity className="w-12 h-12" />
                <span className="text-xs uppercase tracking-widest">Silêncio</span>
              </motion.div>
            )}
          </AnimatePresence>
          {currentNote && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-cyan text-sm font-mono mt-2"
            >
              {Math.round(frequency)} Hz
            </motion.div>
          )}
        </div>
      </div>

      {/* Barra de Clareza/Confiança */}
      {isListening && (
        <div className="w-full mb-8">
          <div className="flex justify-between text-[10px] text-white/40 mb-1 uppercase tracking-tighter">
            <span>Clareza do Som</span>
            <span>{Math.round(clarity * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${clarity * 100}%` }}
              className={`h-full ${clarity > 0.85 ? 'bg-cyan' : 'bg-magenta'}`}
            />
          </div>
        </div>
      )}

      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full py-4 rounded-2xl font-bold transition-all ${
          isListening 
            ? 'bg-magenta/20 text-magenta border border-magenta/20 hover:bg-magenta/30' 
            : 'bg-cyan text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(0,234,255,0.4)]'
        }`}
      >
        {isListening ? "Parar Reconhecimento" : "Iniciar Microfone"}
      </button>

      <p className="mt-6 text-[10px] text-white/30 text-center leading-relaxed">
        Toque uma tecla no seu piano real. O microfone identificará a nota instantaneamente.
      </p>
    </div>
  );
}
