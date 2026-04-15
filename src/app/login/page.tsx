"use client";

import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full">
        <Suspense fallback={<div className="text-white/50 text-sm mt-10 text-center">Carregando...</div>}>
          <AuthForm />
        </Suspense>
      </div>

      {/* Decorative text */}
      <div className="absolute bottom-10 left-10 hidden lg:block opacity-10 pointer-events-none">
        <h1 className="text-[12rem] font-bold tracking-tighter leading-none select-none">
          PIANI
        </h1>
      </div>
      <div className="absolute top-10 right-10 hidden lg:block opacity-10 pointer-events-none">
        <h1 className="text-[12rem] font-bold tracking-tighter leading-none select-none">
          FY
        </h1>
      </div>
    </main>
  );
}
