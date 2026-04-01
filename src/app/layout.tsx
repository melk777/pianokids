import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";

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
    <ClerkProvider
      localization={ptBR}
      // publishableKey é lido automaticamente de NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      // Não passe a prop diretamente — evita erro de build quando a variável está ausente
      appearance={{
        variables: {
          colorBackground: "#0a0a0a",
          colorText: "#ffffff",
          colorPrimary: "#00eaff",
        },
      }}
    >
      <html lang="pt-BR" className="dark" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#0a0a0a] text-white min-h-screen`}
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
