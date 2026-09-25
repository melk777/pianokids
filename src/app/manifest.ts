import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Pianify — Do zero ao louvor no teclado",
    short_name: "Pianify",
    description:
      "Aprenda teclado com uma trilha de aulas, hinos e exercícios, notas na tela e dedilhado.",
    // Installed users are students: open straight into their dashboard.
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    orientation: "any",
    lang: "pt-BR",
    categories: ["education", "music"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/pianify-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Minha trilha", url: "/dashboard/trilha" },
      { name: "Biblioteca", url: "/dashboard/songs" },
    ],
  };
}
