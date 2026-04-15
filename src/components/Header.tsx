"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  User,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Volume2,
  VolumeX,
  Piano,
  GraduationCap,
} from "lucide-react";
import { createClientComponent } from "@/lib/supabase";
import { User as AuthUser, Session } from "@supabase/supabase-js";
import { useBackgroundMusic } from "@/contexts/AudioContext";
import { useSFX } from "@/hooks/useSFX";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import Image from "next/image";

export default function Header() {
  const supabase = useMemo(() => createClientComponent(), []);
  const auth = supabase.auth;
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const { isPlaying, toggleBackgroundMusic } = useBackgroundMusic();
  const { playClick } = useSFX();
  const { profile } = useProfile();

  useEffect(() => {
    auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
    });
  
    const { data: { subscription } } = auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });
  
    return () => subscription.unsubscribe();
  }, [auth]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ocultar Header na tela de jogo - MOVED DOWN to obey Rules of Hooks
  if (pathname?.startsWith("/dashboard/play/")) {
    return null;
  }

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (pathname !== "/") {
      router.push("/#pricing");
      return;
    }
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
 
  const handleLogout = async () => {
    playClick();
    await auth.signOut();
    window.location.href = "/";
  };

  const navLinkClass = "flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white/55 hover:text-white/90 transition-colors duration-200 rounded-xl hover:bg-white/[0.04]";
  const mobileLinkClass = "flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.06]" : "bg-transparent"}`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <span className="text-lg font-semibold tracking-tight text-white/90">
              Pian<span className="text-gradient font-black">ify</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <button
               onClick={() => { playClick(); toggleBackgroundMusic(); }}
              className="mr-2 p-2.5 rounded-xl bg-white/[0.04] text-white/40 hover:text-magenta hover:bg-magenta/10 transition-all border border-white/[0.05]"
            >
              {isPlaying ? <Volume2 className="w-4 h-4 icon-gradient" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            {profile?.role !== "teacher" && (
              <button onClick={scrollToPricing} className={navLinkClass}>
                <Sparkles className="w-3.5 h-3.5" />
                Ver Planos
              </button>
            )}

            {/* Botão Professor Parceiro — sempre visível */}
            <Link
              href="/professores"
              onClick={() => playClick()}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl border border-cyan/30 text-cyan hover:bg-cyan/10 transition-all duration-200"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Professor Parceiro
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/dashboard/profile" 
                  onClick={() => playClick()} 
                  className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-white/55 hover:text-white/90 transition-colors duration-200 rounded-xl hover:bg-white/[0.04]"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        width={24} 
                        height={24} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-3 h-3 text-white/40" />
                    )}
                  </div>
                  Meu Perfil
                </Link>

                <Link href="/dashboard" onClick={() => playClick()} className="flex items-center gap-1.5 ml-1 px-5 py-2 text-[13px] font-semibold text-black bg-white rounded-xl transition-all duration-300 hover:bg-white/90">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {profile?.role === "teacher" ? "Painel do Parceiro" : "Painel do Aluno"}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-red-400/70 hover:text-red-400 transition-colors duration-200 rounded-xl hover:bg-red-400/5 group">
                  <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => playClick()} className={navLinkClass}>
                  <User className="w-3.5 h-3.5" />
                  Entrar
                </Link>
                <div className="flex gap-2 items-center ml-2">
                  <Link href="/login" onClick={() => playClick()} className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold text-black bg-white rounded-xl transition-all duration-300 hover:bg-white/90">
                    <User className="w-3.5 h-3.5" />
                    Cadastrar
                  </Link>
                  <Link href="/login?role=teacher" onClick={() => playClick()} className={navLinkClass}>
                    <Piano className="w-4 h-4 icon-gradient" />
                    Sou Professor
                  </Link>
                </div>
              </>
            )}
          </nav>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl text-white/60 hover:text-white" aria-label="Menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[72px] z-40 md:hidden transition-all duration-200">
            <div className="mx-4 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
              <nav className="flex flex-col p-3 gap-1">
                {profile?.role !== "teacher" && (
                  <button onClick={scrollToPricing} className={mobileLinkClass}>
                    <Sparkles className="w-4 h-4 icon-gradient" />
                    Ver Planos
                  </button>
                )}
                {/* Botão Professor Parceiro mobile */}
                <Link
                  href="/professores"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-cyan border border-cyan/20 bg-cyan/5 hover:bg-cyan/10 rounded-xl transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  Professor Parceiro
                </Link>
                {user ? (
                   <>
                     <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
                          {profile?.avatar_url ? (
                            <Image 
                              src={profile.avatar_url} 
                              alt="Profile" 
                              width={20} 
                              height={20} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                        </div>
                        Meu Perfil
                    </Link>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-black bg-white rounded-xl">
                      <LayoutDashboard className="w-4 h-4 text-black" />
                      {profile?.role === "teacher" ? "Painel do Parceiro" : "Painel do Aluno"}
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/5 rounded-xl">
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                      <User className="w-4 h-4 icon-gradient" />
                      Entrar
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-black bg-white rounded-xl mt-1">
                      <User className="w-4 h-4" />
                      Cadastrar
                    </Link>
                    <Link href="/login?role=teacher" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                      <Piano className="w-4 h-4 icon-gradient" />
                      Sou Professor
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
    </>
  );
}
