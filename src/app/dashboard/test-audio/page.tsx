"use client";

import AudioEngine from "@/components/AudioEngine";
import Header from "@/components/Header";
import { motion } from "framer-motion";

export default function TestAudioPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent mb-6">
            Afinador e Reconhecimento
          </h1>
          <p className="text-white/40 max-w-xl mx-auto">
            Toque o seu piano real. O microfone do seu dispositivo identificará a nota musical 
            instantaneamente, permitindo que você toque suas músicas favoritas sem cabos!
          </p>
        </motion.div>

        {/* O Motor de Áudio (Pitch Detection) */}
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.2 }}
        >
          <AudioEngine />
        </motion.div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 w-full">
           {[
             { title: "Precisão Cristalina", text: "Usamos o algoritmo YIN para garantir que as notas sejam detectadas mesmo em ambientes com reverbação." },
             { title: "Filtro de Ruído", text: "O sistema ignora barulhos de fundo e só exibe a nota quando a clareza do som musical é superior a 85%." },
             { title: "Compatibilidade", text: "Funciona em qualquer navegador moderno no Mac, Windows, iOS ou Android." }
           ].map((item, i) => (
             <motion.div
               key={item.title}
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4 + (i * 0.1) }}
               className="glass p-8 rounded-2xl border border-white/5"
             >
               <h4 className="text-cyan font-bold mb-3">{item.title}</h4>
               <p className="text-sm text-white/40 leading-relaxed">{item.text}</p>
             </motion.div>
           ))}
        </div>
      </section>
    </main>
  );
}
