"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Music,
  Sparkles,
  LogIn,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
} from "lucide-react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };



  /* ── Shared styles ────────────────────────────── */
  const navLinkClass =
    "flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white/55 hover:text-white/90 transition-colors duration-200 rounded-xl hover:bg-white/[0.04]";

  const mobileLinkClass =
    "flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all";

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 md:px-10">
          {/* ── Logo ────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group select-none"
            aria-label="PianoKids — Início"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-cyan/50 flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(0,234,255,0.35)] group-hover:scale-105">
              <Music className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white/90">
              Piano<span className="text-cyan">Kids</span>
            </span>
          </Link>

          {/* ── Desktop Nav ─────────────────────── */}
          <nav className="hidden md:flex items-center gap-2">
            {/* ─── Signed OUT ─── */}
            <SignedOut>
              <button onClick={scrollToPricing} className={navLinkClass}>
                <Sparkles className="w-3.5 h-3.5" />
                Ver Planos
              </button>

              <Link href="/sign-in" className={navLinkClass}>
                <LogIn className="w-3.5 h-3.5" />
                Entrar
              </Link>

              <Link
                href="/sign-up"
                className="flex items-center gap-1.5 ml-1 px-5 py-2 text-[13px] font-semibold text-black bg-white rounded-xl transition-all duration-300 hover:bg-white/90 hover:shadow-[0_2px_20px_rgba(255,255,255,0.15)] active:scale-[0.97]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Cadastrar
              </Link>
            </SignedOut>

            {/* ─── Signed IN ─── */}
            <SignedIn>
              <Link href="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>

              <Link href="/dashboard/membership" className={navLinkClass}>
                <CreditCard className="w-3.5 h-3.5" />
                Gerenciar Assinatura
              </Link>

              <div className="ml-2">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-8 h-8 ring-2 ring-white/10 hover:ring-cyan/40 transition-all duration-300",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </nav>

          {/* ── Mobile Menu Toggle ──────────────── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </motion.header>

      {/* ── Mobile Menu Overlay ───────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 top-[72px] z-40 md:hidden"
          >
            <div className="mx-4 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
              <nav className="flex flex-col p-3 gap-1">
                {/* ─── Signed OUT (mobile) ─── */}
                <SignedOut>
                  <button onClick={scrollToPricing} className={mobileLinkClass}>
                    <Sparkles className="w-4 h-4 text-cyan" />
                    Ver Planos
                  </button>

                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass}
                  >
                    <LogIn className="w-4 h-4 text-cyan" />
                    Entrar
                  </Link>

                  <Link
                    href="/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-black bg-white rounded-xl transition-all hover:bg-white/90 mt-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar
                  </Link>
                </SignedOut>

                {/* ─── Signed IN (mobile) ─── */}
                <SignedIn>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass}
                  >
                    <LayoutDashboard className="w-4 h-4 text-cyan" />
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/membership"
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass}
                  >
                    <CreditCard className="w-4 h-4 text-cyan" />
                    Gerenciar Assinatura
                  </Link>

                  <div className="px-4 py-3 flex items-center gap-3">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox:
                            "w-8 h-8 ring-2 ring-white/10",
                        },
                      }}
                    />
                    <span className="text-sm text-white/50">Minha conta</span>
                  </div>
                </SignedIn>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
