"use client";

import { useRef, useCallback } from "react";

export function useJoseAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((src: string) => {
    // 1. Parar o áudio anterior se houver
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 2. Criar e tocar o novo áudio
    const audio = new Audio(src);
    audioRef.current = audio;
    
    // Configurar volume para 100%
    audio.volume = 1;

    // Tocar
    audio.play().catch((err) => {
      console.error("[USE_JOSE_AUDIO]: Erro ao reproduzir áudio:", src, err);
    });
  }, []);

  const playIntro = useCallback(() => {
    playAudio("/audios/intro-jose.mp3");
  }, [playAudio]);

  const playSuccess = useCallback(() => {
    playAudio("/audios/acerto-jose.mp3");
  }, [playAudio]);

  const playError = useCallback(() => {
    playAudio("/audios/erro-jose.mp3");
  }, [playAudio]);

  return { playIntro, playSuccess, playError };
}
