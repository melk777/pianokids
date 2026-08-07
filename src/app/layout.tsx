import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AudioProvider } from "@/contexts/AudioContext";
import Header from "@/components/Header";
import GlobalEnhancements from "@/components/GlobalEnhancements";
import { getURL } from "@/lib/utils/url";

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

const siteDescription =
  "Aprenda piano e teclado tocando músicas de verdade, com notas na tela, reconhecimento do instrumento e progresso guiado.";

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  applicationName: "Pianify",
  title: {
    default: "Pianify — Aprenda teclado tocando músicas de verdade",
    template: "%s | Pianify",
  },
  description: siteDescription,
  keywords: [
    "aprender piano",
    "aprender teclado",
    "aulas de piano online",
    "piano interativo",
    "teclado musical",
  ],
  creator: "Pianify",
  publisher: "Pianify",
  category: "education",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Pianify",
    title: "Pianify — Aprenda teclado tocando músicas de verdade",
    description: siteDescription,
    images: [{ url: "/logo.png", alt: "Pianify" }],
  },
  twitter: {
    card: "summary",
    title: "Pianify — Aprenda teclado tocando músicas de verdade",
    description: siteDescription,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/pianify-icon.svg",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
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
