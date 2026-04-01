"use client";

import { motion } from "framer-motion";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  onSubscribe: () => void;
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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan text-black text-xs font-semibold tracking-wide">
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
          <span className={`text-4xl font-bold tracking-tight ${popular ? "text-cyan" : "text-white"}`}>
            {price}
          </span>
          <span className="text-white/40 text-sm ml-1">{period}</span>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={popular ? "text-cyan" : "text-white/30"}
              >
                <path
                  d="M13.3 4.3L6.3 11.3L2.7 7.7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubscribe}
          className={`w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 ${
            popular
              ? "bg-cyan text-black hover:shadow-[0_0_30px_rgba(0,234,255,0.3)]"
              : "glass glass-hover text-white/80"
          }`}
        >
          Começar agora
        </motion.button>
      </div>
    </motion.div>
  );
}
