"use client";

import AudioEngine from "@/components/AudioEngine";
import { motion } from "framer-motion";

export default function TestAudioPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-32">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-16 text-center">
          <h1 className="mb-6 bg-gradient-to-r from-cyan to-pink-500 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            Afinador, Acordes e Calibracao
          </h1>
          <p className="mx-auto max-w-2xl text-white/40">
            Teste o microfone, veja se as notas e acordes estao sendo reconhecidos corretamente e salve uma
            calibracao personalizada para deixar o jogo mais preciso no dispositivo do aluno.
          </p>
        </motion.div>

        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
          <AudioEngine />
        </motion.div>

        <div className="mt-20 grid w-full gap-8 md:grid-cols-3">
          {[
            {
              title: "Ajuste por Ambiente",
              text: "A calibracao mede o ruido do local e adapta a sensibilidade do reconhecimento para cada aluno.",
            },
            {
              title: "Acordes Reais",
              text: "O sistema agora tenta reconhecer varias notas ao mesmo tempo para acompanhar acordes completos.",
            },
            {
              title: "Compatibilidade",
              text: "Funciona em qualquer navegador moderno no Mac, Windows, iOS ou Android.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="glass rounded-2xl border border-white/5 p-8"
            >
              <h4 className="mb-3 font-black text-cyan">{item.title}</h4>
              <p className="text-sm leading-relaxed text-white/40">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
