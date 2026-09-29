"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createClientComponent, isSupabaseConfigured } from "@/lib/supabase";
import { DELETE_CONFIRMATION, isDeletionConfirmed } from "@/lib/accountDeletion";

type Phase = "idle" | "confirming" | "working" | "requested" | "error";

/**
 * Exclusão de conta dentro do app (exigida pela App Store, pelo Google Play e pela LGPD).
 * Alunos excluem na hora; professores abrem um pedido, porque comissões e saques são
 * registros fiscais que o suporte acerta antes de encerrar a conta.
 */
export default function DeleteAccountSection({ isTeacher }: { isTeacher: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPhase("working");
    setError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const result = (await response.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir a conta.");
      if (result.status === "requested") {
        setPhase("requested");
        return;
      }
      if (isSupabaseConfigured) await createClientComponent().auth.signOut().catch(() => undefined);
      router.replace("/conta-excluida");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir a conta.");
      setPhase("error");
    }
  }

  if (phase === "requested") {
    return (
      <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-5 text-sm leading-relaxed text-white/75">
        Pedido de exclusão recebido. Vamos acertar suas comissões e saques pendentes e encerrar a conta em até 15 dias. A
        confirmação chega no seu e-mail.
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h4 className="text-base font-bold text-white">Excluir conta</h4>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
        {isTeacher
          ? "Como professor parceiro, você pode ter comissões e saques em andamento. Ao pedir a exclusão, nossa equipe acerta os valores e encerra a conta em até 15 dias."
          : "Apaga seu perfil, histórico de prática e progresso na trilha. Se você tiver assinatura, ela é cancelada na hora e não será mais cobrada. Isso não pode ser desfeito."}
      </p>

      {phase === "idle" ? (
        <button
          type="button"
          onClick={() => setPhase("confirming")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-300 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          {isTeacher ? "Pedir exclusão da conta" : "Excluir minha conta"}
        </button>
      ) : (
        <div className="mt-4 max-w-xl rounded-2xl border border-red-400/30 bg-red-500/[0.06] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <div className="text-sm leading-relaxed text-white/75">
              {isTeacher ? (
                <p>Confirme o pedido de exclusão. Você continua com acesso até a conta ser encerrada.</p>
              ) : (
                <>
                  <p>Tem certeza? Tudo o que você praticou será apagado.</p>
                  <p className="mt-1 text-white/50">
                    Quer uma cópia antes? Use &quot;Baixar meus dados&quot; acima. Reembolsos seguem a{" "}
                    <a href="/reembolso" className="font-bold text-cyan hover:underline">
                      política de reembolso
                    </a>
                    .
                  </p>
                </>
              )}
            </div>
          </div>
          <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-white/50" htmlFor="delete-confirm">
            Digite {DELETE_CONFIRMATION} para confirmar
          </label>
          <input
            id="delete-confirm"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-bold tracking-widest text-white outline-none focus:border-red-400/60"
          />
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!isDeletionConfirmed(typed) || phase === "working"}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isTeacher ? "Enviar pedido" : "Excluir definitivamente"}
            </button>
            <button
              type="button"
              disabled={phase === "working"}
              onClick={() => {
                setPhase("idle");
                setTyped("");
                setError(null);
              }}
              className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white/70 transition hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
