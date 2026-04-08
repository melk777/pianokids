"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClientComponent } from "@/lib/supabase";
import { Mail, Lock, Loader2, ArrowRight, Music } from "lucide-react";
import Link from "next/link";
import { getURL } from "@/lib/utils/url";

export default function AuthForm() {
  const supabase = createClientComponent();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getURL()}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Conta criada! Verifique seu e-mail para confirmar o cadastro.",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro na autenticação";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan to-cyan/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,234,255,0.3)]">
            <Music className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-2 tracking-tight">
          {isLogin ? "Bem-vindo de volta" : "Começar a tocar"}
        </h2>
        <p className="text-white/50 text-center text-sm mb-8">
          {isLogin
            ? "Acesse sua conta para continuar suas aulas."
            : "Crie sua conta e comece sua jornada musical hoje."}
        </p>

        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mb-6 p-4 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Entrar na conta" : "Criar minha conta"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-white/40 hover:text-magenta-400 transition-colors"
          >
            {isLogin ? (
              <>
                Não tem uma conta? <span className="text-gradient font-black">Cadastre-se</span>
              </>
            ) : (
              <>
                Já tem uma conta? <span className="text-gradient font-black">Faça Login</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-white/30 text-xs hover:text-white transition-colors">
          &larr; Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
