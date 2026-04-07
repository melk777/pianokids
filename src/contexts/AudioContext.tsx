"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface AudioContextType {
  isPlaying: boolean;
  playBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  toggleBackgroundMusic: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializa o áudio apenas no lado do cliente
    if (typeof window !== "undefined") {
      const audio = new Audio("/audio/bg-ambient.mp3");
      audio.loop = true;
      audio.volume = 0.4;
      audioRef.current = audio;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);

      // Tenta tocar no primeiro clique ou interação (Bypass Autoplay Policy)
      const startOnInteraction = () => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              // Som começou com sucesso, removemos os listeners
              document.removeEventListener("click", startOnInteraction);
              document.removeEventListener("keydown", startOnInteraction);
              document.removeEventListener("touchstart", startOnInteraction);
            })
            .catch(() => {
              // Ainda bloqueado ou erro, mantemos os listeners para a próxima tentativa
            });
        }
      };

      document.addEventListener("click", startOnInteraction);
      document.addEventListener("keydown", startOnInteraction);
      document.addEventListener("touchstart", startOnInteraction);

      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        document.removeEventListener("click", startOnInteraction);
        document.removeEventListener("keydown", startOnInteraction);
        document.removeEventListener("touchstart", startOnInteraction);
        audio.pause();
        audioRef.current = null;
      };
    }
  }, []);

  const playBackgroundMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay bloqueado pelo navegador. Interação do usuário necessária.", err);
      });
    }
  };

  const pauseBackgroundMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleBackgroundMusic = () => {
    if (isPlaying) {
      pauseBackgroundMusic();
    } else {
      playBackgroundMusic();
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        playBackgroundMusic,
        pauseBackgroundMusic,
        toggleBackgroundMusic,
        setVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useBackgroundMusic = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useBackgroundMusic deve ser usado dentro de um AudioProvider");
  }
  return context;
};
