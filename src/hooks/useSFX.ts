"use client";

type PlayFunction = () => void;

interface SFXHook {
  playClick: PlayFunction;
  playSuccess: PlayFunction;
  playMessage: PlayFunction;
  playError: PlayFunction;
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }

  return sharedAudioContext;
}

export const useSFX = (): SFXHook => {
  const play = () => {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      const startAt = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(1320, startAt + 0.045);
      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.06, startAt + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.08);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.09);
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
