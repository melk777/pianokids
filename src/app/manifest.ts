import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pianify — Piano e teclado interativo",
    short_name: "Pianify",
    description:
      "Aprenda piano e teclado com notas na tela, reconhecimento do instrumento e progresso guiado.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    orientation: "any",
    lang: "pt-BR",
    categories: ["education", "music"],
    icons: [
      {
        src: "/pianify-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
