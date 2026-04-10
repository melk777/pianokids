"use client";

import useSound from "use-sound";

type PlayFunction = (options?: unknown) => void;

interface SFXHook {
  playClick: PlayFunction;
  playSuccess: PlayFunction;
  playMessage: PlayFunction;
  playError: PlayFunction;
}

export const useSFX = (): SFXHook => {
  const [playClick] = useSound("/audio/sweep-click.mp3", { volume: 0.5 });
  
  const [playSuccess] = useSound("/audio/sweep-click.mp3", { volume: 0.5 });
  const [playMessage] = useSound("/audio/sweep-click.mp3", { volume: 0.4 });
  const [playError] = useSound("/audio/sweep-click.mp3", { volume: 0.5 });

  return {
    playClick: playClick as PlayFunction,
    playSuccess: playSuccess as PlayFunction,
    playMessage: playMessage as PlayFunction,
    playError: playError as PlayFunction,
  };
};
