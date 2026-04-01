"use client";

import { motion } from "framer-motion";

/* ──────────────────────────────────────────────────────
   SVG logos — lightweight inline SVGs for each brand.
   Grayscale by default, color on hover.
   ────────────────────────────────────────────────────── */

const partners = [
  {
    name: "Stripe",
    logo: (
      <svg viewBox="0 0 120 40" fill="currentColor" className="h-6 w-auto">
        <path d="M17.3 16.8c0-1.7 1.4-2.4 3.7-2.4 3.3 0 7.5 1 10.8 2.8V8.5c-3.6-1.4-7.2-2-10.8-2C13.2 6.5 8 10.3 8 16.2c0 9.1 12.5 7.7 12.5 11.6 0 2-1.7 2.7-4.2 2.7-3.6 0-8.3-1.5-12-3.5v8.8c4.1 1.8 8.2 2.5 12 2.5 8.1 0 13.6-4 13.6-10.1-.1-9.9-12.6-8.1-12.6-12.4zm28.7-9.5L40 8.6v7.4h-3.5v7.2H40v10.5c0 7.1 3.4 9.5 9.3 9.5 2.8 0 4.8-.6 6-1.2v-7.3c-1 .4-6 1.8-6-2.7V23.2h6v-7.2h-6V7.3zM63 14.4l-.3-1.4H56v25.3h8V22.6c1.9-2.5 5.1-2 6.1-1.7v-7.8c-1-.4-4.8-1.2-7.1 1.3zm11.1-2.4h8.1v26.3h-8.1V12zm0-8.5L82.2 2v8h-8.1V3.5zM98.8 6l-7.9 1.7v30c0 5.5 4.1 9.6 9.6 9.6 3 0 5.3-.6 6.5-1.2v-7.1c-1.2.5-7.1 2.1-7.1-3.2V23.2h7.1v-7.2h-7.1L98.8 6z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-auto">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Visa",
    logo: (
      <svg viewBox="0 0 120 40" fill="currentColor" className="h-5 w-auto">
        <path d="M50.3 7.5L41.7 32.8h-8.4l-5.7-18c-.3-1.3-.6-1.8-1.7-2.3-1.8-.9-4.8-1.8-7.4-2.3l.2-.7h13.5c1.7 0 3.3 1.2 3.6 3.2l3.3 17.7L47.6 7.5h8.7zm34.2 17c0-6.7-9.3-7-9.3-10 0-.9.9-1.9 2.8-2.1 1-.1 3.6-.2 6.6 1.1l1.2-5.5c-1.6-.6-3.7-1.2-6.3-1.2-6.7 0-11.4 3.5-11.4 8.6 0 3.7 3.4 5.8 5.9 7.1 2.6 1.3 3.5 2.1 3.5 3.3 0 1.8-2.1 2.6-4 2.6-3.4 0-5.3-.9-6.9-1.6l-1.2 5.6c1.6.7 4.4 1.3 7.4 1.3 7.1.1 11.7-3.5 11.7-8.8zm17.6 8.3h7.4L103.6 7.5h-6.8c-1.5 0-2.8.9-3.4 2.2L82.5 32.8h8.7l1.7-4.8h10.6l1 4.8zm-9.2-11.3l4.4-12 2.5 12h-6.9zM60.2 7.5L53.6 32.8h-8.2l6.6-25.3h8.2z" />
      </svg>
    ),
  },
  {
    name: "Mastercard",
    logo: (
      <svg viewBox="0 0 120 80" fill="none" className="h-7 w-auto">
        <circle cx="45" cy="40" r="28" fill="currentColor" opacity="0.6" />
        <circle cx="75" cy="40" r="28" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    name: "Pix",
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-auto">
        <path d="M17.6 14.4l-3.2 3.2a2.3 2.3 0 01-3.2 0L7.6 14l-.4.4a2.3 2.3 0 000 3.2l3.6 3.6a2.3 2.3 0 003.2 0l3.6-3.6a2.3 2.3 0 000-3.2zm0-4.8a2.3 2.3 0 000-3.2L14 2.8a2.3 2.3 0 00-3.2 0L7.2 6.4a2.3 2.3 0 000 3.2l.4.4 3.6-3.6a2.3 2.3 0 013.2 0L17.6 9.6zm3.6 2.8L18 9.2l-3.2 3.2a.8.8 0 01-1.1 0l-3.5-3.5L7.2 12l3 3a.8.8 0 010 1.1L7.2 19l3.2 3.2 3-3a.8.8 0 011.1 0l3 3 3.2-3.2-3-3a.8.8 0 010-1.1l3.5-3.5z" />
      </svg>
    ),
  },
  {
    name: "Google Cloud",
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-auto">
        <path d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173l-1.655-1.22c.608-1.578 1.113-3.542.172-5.353-.704-1.293-1.836-2.277-3.176-2.803l1.282-1.714c1.548.568 2.822 1.615 3.782 2.917zM11.39 1.9l.912 2.058c-1.63.222-3.128.942-4.302 2.067-1.186 1.136-1.965 2.587-2.24 4.189l-2.095-.576c.414-2.146 1.448-4.083 3.007-5.585A10.25 10.25 0 0111.39 1.9zM3.82 11.04l2.087.589c-.024 1.653.444 3.283 1.373 4.66.893 1.324 2.16 2.356 3.63 2.97l-.765 2.03C7.77 20.273 5.972 18.63 4.86 16.542c-1.1-2.063-1.452-4.453-1.04-6.502zm12.937 9.436l1.26 1.726C16.3 23.34 14.15 24 11.963 24c-2.183 0-4.33-.66-6.047-1.798l1.255-1.726c1.35.879 2.985 1.394 4.792 1.394 1.81 0 3.446-.515 4.794-1.394z" />
      </svg>
    ),
  },
];

// Duplicate for seamless infinite scroll
const doubledPartners = [...partners, ...partners];

export default function PartnerMarquee() {
  return (
    <section className="py-16 px-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-center text-xs uppercase tracking-[0.2em] text-white/25 mb-10 font-medium">
          Tecnologia de confiança
        </p>

        {/* Marquee container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex items-center gap-16 shrink-0"
              animate={{ x: [0, -50 * partners.length * 3] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 30,
                  ease: "linear",
                },
              }}
            >
              {doubledPartners.map((partner, i) => (
                <div
                  key={`${partner.name}-${i}`}
                  className="flex items-center gap-2.5 shrink-0 text-white/20 grayscale opacity-40 hover:grayscale-0 hover:opacity-90 hover:text-white/70 transition-all duration-500 cursor-default select-none px-4"
                  title={partner.name}
                >
                  {partner.logo}
                  <span className="text-xs font-medium tracking-wide hidden sm:inline">
                    {partner.name}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
