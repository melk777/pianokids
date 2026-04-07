"use client";

import AuthForm from "@/components/AuthForm";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full relative z-10"
      >
        <AuthForm />
      </motion.div>

      {/* Decorative text */}
      <div className="absolute bottom-10 left-10 hidden lg:block opacity-10 pointer-events-none">
        <h1 className="text-[12rem] font-bold tracking-tighter leading-none select-none">
          PIANO
        </h1>
      </div>
      <div className="absolute top-10 right-10 hidden lg:block opacity-10 pointer-events-none">
        <h1 className="text-[12rem] font-bold tracking-tighter leading-none select-none">
          KIDS
        </h1>
      </div>
    </main>
  );
}
