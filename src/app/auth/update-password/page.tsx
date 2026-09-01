"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { createClientComponent, isSupabaseConfigured } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const supabase = isSupabaseConfigured ? createClientComponent() : null;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setMessage({ type: "error", text: "A autenticação não está configurada neste ambiente." });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }
    if (password !== confirmation) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ type: "success", text: "Senha atualizada. Você já pode continuar para a sua conta." });
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível atualizar a senha.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-8">
        <Lock className="mb-5 h-10 w-10 text-cyan" />
        <h1 className="mb-2 text-2xl font-black">Criar nova senha</h1>
        <p className="mb-7 text-sm text-white/50">Use pelo menos 8 caracteres e evite repetir uma senha antiga.</p>

        {message && (
          <div className={`mb-5 rounded-xl border p-3 text-sm ${message.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
            {message.text}
          </div>
        )}

        {message?.type === "success" ? (
          <Link href="/dashboard" className="flex w-full justify-center rounded-xl bg-white px-5 py-3 font-black text-black">
            Ir para minha conta
          </Link>
        ) : (
          <form onSubmit={updatePassword} className="space-y-4">
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nova senha"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan/60"
            />
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan/60"
            />
            <button disabled={loading || !supabase} className="flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-black text-black disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

