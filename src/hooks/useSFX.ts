"use client";

import { useEffect, useRef } from "react";

type PlayFunction = () => void;

interface SFXHook {
  playClick: PlayFunction;
  playSuccess: PlayFunction;
  playMessage: PlayFunction;
  playError: PlayFunction;
}

const AUDIO_SRC = "/audio/sweep-click.mp3";
let sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!sharedAudio) {
    sharedAudio = new Audio(AUDIO_SRC);
    sharedAudio.preload = "auto";
  }

  return sharedAudio;
}

export const useSFX = (): SFXHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = getSharedAudio();
  }, []);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    try {
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // Ignore autoplay and transient audio errors for UI sound effects.
    }
  };

  return {
    playClick: play,
    playSuccess: play,
    playMessage: play,
    playError: play,
  };
};
