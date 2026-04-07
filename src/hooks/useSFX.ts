"use client";

import useSound from "use-sound";

export const useSFX = () => {
  const [playClick] = useSound("/audio/sweep-click.mp3", { volume: 0.5 });
  
  // Você pode adicionar mais sons aqui conforme necessário
  // const [playWin] = useSound("/audio/win.mp3", { volume: 0.6 });

  return {
    playClick,
  };
};
