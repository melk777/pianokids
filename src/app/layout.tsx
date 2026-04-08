import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AudioProvider } from "@/contexts/AudioContext";
import StarryBackground from "@/components/StarryBackground";

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

const customRegular = localFont({
  src: "./fonts/PianoKids-Regular.ttf",
  variable: "--font-custom-regular",
  weight: "400",
  display: "swap",
});

const customBold = localFont({
  src: "./fonts/PianoKids-Bold.ttf",
  variable: "--font-custom-bold",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PianoKids — Aprenda Piano Brincando",
  description: "Transforme o aprendizado de piano em um jogo divertido.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${customRegular.variable} ${customBold.variable} font-sans antialiased bg-[#0a0a0a] text-white min-h-screen`}
        suppressHydrationWarning
      >
        <AudioProvider>
          <StarryBackground />
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
