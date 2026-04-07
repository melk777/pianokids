"use client";

import { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { usePathname } from "next/navigation";

export default function StarryBackground() {
  const pathname = usePathname();
  const [init, setInit] = useState(false);

  // Inicializa a engine do tsparticles uma única vez
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // Opções do efeito visual: Estrelas flutuantes e Parallax
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: {
        enable: true,
        zIndex: -1, // Fica atrás de todo o conteúdo
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "parallax", // Efeito imersivo solicitado
          },
        },
        modes: {
          parallax: {
            enable: true,
            force: 60,
            smooth: 10,
          },
        },
      },
      particles: {
        color: {
          value: ["#ffffff", "#fff9db", "#e3faff"], // Tons de branco e amarelo claro
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: 0.15, // Movimento lento e constante
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 120, // Densidade ideal para não carregar demais o visual
        },
        opacity: {
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
          value: { min: 0.1, max: 0.8 },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 0.5, max: 2.5 }, // Tamanhos variados para profundidade
        },
      },
      detectRetina: true,
    }),
    []
  );

  // Lógica de Exclusão Crítica: Não mostrar nas páginas de toca piano
  const isPianoPage = pathname?.includes("/dashboard/practice") || pathname?.includes("/dashboard/play");

  if (!init || isPianoPage) {
    return null;
  }

  return (
    <div id="starry-background-wrapper" className="fixed inset-0 pointer-events-none select-none overflow-hidden">
      <Particles
        id="tsparticles"
        options={options}
      />
    </div>
  );
}
