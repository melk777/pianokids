"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TrialBanner() {
  const { status, currentPeriodEnd, loading } = useSubscription();

  if (loading || status !== "trialing" || !currentPeriodEnd) {
    return null;
  }

  const now = new Date();
  const end = new Date(currentPeriodEnd);
  const diffTime = Math.max(0, end.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="sticky top-0 z-[100] w-full"
      >
        <div className="bg-gradient-to-r from-cyan/90 to-cyan/80 backdrop-blur-md border-b border-cyan/20 px-4 py-2 text-black flex items-center justify-center gap-4 text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>
              Seu teste grátis termina em <strong>{diffDays} {diffDays === 1 ? 'dia' : 'dias'}</strong>.
            </span>
          </div>
          
          <Link 
            href="/#pricing"
            className="group flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-xs hover:bg-black/80 transition-all"
          >
            Assinar Agora
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
