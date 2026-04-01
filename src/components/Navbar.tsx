"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-cyan/60 flex items-center justify-center transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(0,234,255,0.4)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-black">
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" fill="currentColor"/>
            <circle cx="18" cy="16" r="3" fill="currentColor"/>
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight text-white/90">
          Piano<span className="text-cyan">Kids</span>
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2 text-sm text-white/60 hover:text-white/90 transition-colors duration-200"
        >
          Dashboard
        </Link>
        <Link
          href="/#pricing"
          className="btn-secondary !px-5 !py-2 text-sm"
        >
          Assinar
        </Link>
      </div>
    </motion.nav>
  );
}
