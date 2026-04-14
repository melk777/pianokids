import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AudioProvider } from "@/contexts/AudioContext";
import Header from "@/components/Header";
import GlobalEnhancements from "@/components/GlobalEnhancements";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const pianoRegular = localFont({
  src: "./fonts/Pianify-Regular.ttf",
  variable: "--font-piano-regular",
});

const pianoBold = localFont({
  src: "./fonts/Pianify-Bold.ttf",
  variable: "--font-piano-bold",
});

export const metadata: Metadata = {
  title: "Pianify — Sua Jornada Musical Começa Aqui",
  description: "Aprenda piano e teclado de forma gamificada, divertida e inteligente. Método exclusivo para todas as idades.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pianoRegular.variable} ${pianoBold.variable} font-sans antialiased bg-[#0a0a0a] text-white min-h-screen`}
        suppressHydrationWarning
      >
        <AudioProvider>
          <Header />
          <GlobalEnhancements />
          {children}

          {/* Global SVG Gradients for Icons */}
          <svg width="0" height="0" className="absolute pointer-events-none">
            <defs>
              <linearGradient id="primary-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00eaff" />
                <stop offset="100%" stopColor="#ff00e5" />
              </linearGradient>
            </defs>
          </svg>
        </AudioProvider>
      </body>
    </html>
  );
}
