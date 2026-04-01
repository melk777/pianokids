"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  onSubscribe: () => Promise<void>;
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  badge,
  popular,
  onSubscribe,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSubscribe();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative rounded-2xl p-[1px] ${
        popular
          ? "bg-gradient-to-b from-cyan/30 via-cyan/10 to-transparent"
          : "bg-gradient-to-b from-white/10 via-white/5 to-transparent"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-cyan text-black text-xs font-semibold tracking-wide shadow-[0_0_20px_rgba(0,234,255,0.3)]">
          {badge}
        </div>
      )}

      <div className="rounded-2xl bg-[#0a0a0a] p-8 h-full flex flex-col">
        {/* Plan name */}
        <p className="text-sm text-white/50 font-medium tracking-wide uppercase mb-4">
          {name}
        </p>

        {/* Price */}
        <div className="mb-6">
          <span
            className={`text-4xl font-bold tracking-tight ${
              popular ? "text-cyan" : "text-white"
            }`}
          >
            {price}
          </span>
          <span className="text-white/40 text-sm ml-1">{period}</span>
        </div>

        {/* Features */}
        <ul className="space-y-3.5 mb-8 flex-1">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-sm text-white/70"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  popular
                    ? "bg-cyan/15 text-cyan"
                    : "bg-white/[0.06] text-white/40"
                }`}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            popular
              ? "bg-white text-black hover:bg-white/90 hover:shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
              : "glass glass-hover text-white/80"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecionando...
            </>
          ) : (
            "Assinar agora"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
