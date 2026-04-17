"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { createClientComponent } from "@/lib/supabase";
import { Mail, Lock, Loader2, ArrowRight, Calendar, User, Phone, CreditCard, Hash } from "lucide-react";
import Link from "next/link";
import { getURL } from "@/lib/utils/url";
import { useSearchParams } from "next/navigation";
import TurnstileWidget from "./TurnstileWidget";

const TeacherTermsModal = dynamic(() => import("./TeacherTermsModal"), {
  loading: () => null,
});

interface AuthFormProps {
  turnstileSiteKey?: string;
}

export default function AuthForm({ turnstileSiteKey: initialTurnstileSiteKey }: AuthFormProps) {
  const supabase = createClientComponent();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // New Registration Fields
  const [birthDate, setBirthDate] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const [resolvedTurnstileSiteKey, setResolvedTurnstileSiteKey] = useState(
    (initialTurnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim(),
  );
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const turnstileSiteKey = resolvedTurnstileSiteKey;

  const [role, setRole] = useState<"student" | "teacher">(
    (searchParams.get("role") as "student" | "teacher") || "student"
  );

  // Age calculation logic
  const age = useMemo(() => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [birthDate]);

    useEffect(() => {
      const refCode = searchParams.get("ref");
      if (refCode) {
        localStorage.setItem("pianify_ref", refCode);
      }
    
    const urlRole = searchParams.get("role");
    if (urlRole === "teacher") {
      setRole("teacher");
      setIsLogin(false);
      setIsTermsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setCaptchaToken(null);
    setCaptchaRefreshKey((value) => value + 1);
  }, [isLogin, role]);

  useEffect(() => {
    if (resolvedTurnstileSiteKey) return;

    let active = true;

    fetch("/api/auth/turnstile-key", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!active || !data?.siteKey) return;
        setResolvedTurnstileSiteKey(String(data.siteKey).trim());
      })
      .catch(() => {
        // The inline warning remains as the visible fallback if runtime config also fails.
      });

    return () => {
      active = false;
    };
  }, [resolvedTurnstileSiteKey]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileSiteKey) {
      setMessage({
        type: "error",
        text: "A verificacao anti-robo ainda nao foi configurada. Defina a chave publica do Turnstile.",
      });
      return;
    }

    if (!captchaToken) {
      setMessage({ type: "error", text: "Confirme a verificacao anti-robo antes de continuar." });
      return;
    }
    
    // Validation for Teacher Terms
    if (!isLogin && role === "teacher" && !agreedToTerms) {
      setMessage({ type: "error", text: "Você precisa aceitar os termos de adesão para continuar." });
      setIsTermsModalOpen(true);
      return;
    }

    // Validation for Minor Students
    if (!isLogin && role === "student" && age !== null && age < 18 && !guardianEmail) {
      setMessage({ type: "error", text: "O e-mail do responsável legal é obrigatório para menores de 18 anos." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const referred_by_code = localStorage.getItem("pianify_ref") || undefined;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken,
          },
        });
        if (error) throw error;
        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getURL()}/auth/callback`,
            captchaToken,
            data: {
              role,
              referred_by_code,
              birth_date: birthDate,
              guardian_email: age && age < 18 ? guardianEmail : null,
              cpf: role === "teacher" ? cpf : null,
              phone: role === "teacher" ? phone : null,
              pix_key: role === "teacher" ? pixKey : null,
            }
          },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: role === "teacher" 
            ? "Conta de professor criada! Verifique seu e-mail para confirmar." 
            : "Conta criada! Verifique seu e-mail para confirmar o cadastro.",
        });
        localStorage.removeItem("pianify_ref");
      }
    } catch (error: unknown) {
      let errorMessage = "Erro na autenticação";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      if (errorMessage.includes("User already registered")) {
        errorMessage = "Este e-mail já está cadastrado.";
      }
      setMessage({ type: "error", text: errorMessage });
      setCaptchaToken(null);
      setCaptchaRefreshKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <TeacherTermsModal 
        isOpen={isTermsModalOpen} 
        onAccept={() => {
          setAgreedToTerms(true);
          setIsTermsModalOpen(false);
        }} 
      />

      <div className="glass rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="mb-6 text-center">
          <span className="text-2xl font-semibold tracking-tight text-white/90">
            Pian<span className="text-gradient font-black">ify</span>
          </span>
        </div>

        {/* Role Toggle Selector */}
        <div className="p-1 gap-1 flex bg-white/5 rounded-2xl mb-8 relative border border-white/5">
           <div
             className="absolute inset-y-1 bg-white rounded-xl shadow-lg"
             style={{
               transform: role === "student" ? "translateX(0)" : "translateX(100%)",
               width: "calc(50% - 4px)",
               transition: "transform 200ms ease",
             }}
           />
           <button 
             onClick={() => setRole("student")}
             className={`flex-1 py-2 text-xs font-bold relative z-10 transition-colors duration-300 ${role === "student" ? "text-black" : "text-white/40 hover:text-white/70"}`}
           >
             SOU ALUNO
           </button>
           <button 
             onClick={() => setRole("teacher")}
             className={`flex-1 py-2 text-xs font-bold relative z-10 transition-colors duration-300 ${role === "teacher" ? "text-black" : "text-white/40 hover:text-white/70"}`}
           >
             SOU PROFESSOR
           </button>
        </div>

        {message?.type === "success" ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">¡Tudo pronto!</h3>
              <p className="text-white/60 leading-relaxed mb-10">
                {message.text}
              </p>
              <button
                onClick={() => {
                  setMessage(null);
                  setIsLogin(true);
                }}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
              >
                Voltar para o Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center text-white mb-2 tracking-tight uppercase">
                {isLogin ? "Acesse sua conta" : (role === "teacher" ? "Cadastro de Parceiro" : "Bora tocar piano!")}
              </h2>
              <p className="text-white/50 text-center text-sm mb-8">
                {isLogin
                  ? (role === "teacher" ? "Área exclusiva para professores parcerios." : "Continue sua jornada musical de onde parou.")
                  : role === "teacher" 
                    ? "Crie sua conta e comece a lucrar com suas indicações."
                    : "Crie sua conta gratuita e comece a tocar hoje mesmo."}
              </p>

              {message && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {/* Email & Password (Always Visible) */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="input-field pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field pl-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Registration-only fields */}
                {!isLogin && (
                  <div className="space-y-4 pt-2">
                    {/* Common Field: Birth Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">Data de Nascimento</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
                        <input
                          type="date"
                          required
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="input-field pl-11"
                        />
                      </div>
                    </div>

                    {/* Conditional: Guardian Email for Minors */}
                    {role === "student" && age !== null && age < 18 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-cyan/70 ml-1 uppercase tracking-wider italic">E-mail do Responsável (Obrigatório)</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan/30 group-focus-within:icon-gradient transition-colors" />
                          <input
                            type="email"
                            required
                            value={guardianEmail}
                            onChange={(e) => setGuardianEmail(e.target.value)}
                            placeholder="email.do.pai@email.com"
                            className="input-field pl-11 border-cyan/30 focus:border-cyan"
                          />
                        </div>
                      </div>
                    )}

                    {/* Teacher Exclusive Fields */}
                    {role === "teacher" && (
                      <div className="space-y-4 mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Dados Bancários e Fiscais</p>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/40 ml-1 uppercase">CPF</label>
                          <div className="relative group">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                              type="text"
                              required
                              value={cpf}
                              onChange={(e) => setCpf(e.target.value)}
                              placeholder="000.000.000-00"
                              className="input-field pl-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/40 ml-1 uppercase">Telefone</label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="input-field pl-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/40 ml-1 uppercase">Chave PIX</label>
                          <div className="relative group">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                              type="text"
                              required
                              value={pixKey}
                              onChange={(e) => setPixKey(e.target.value)}
                              placeholder="E-mail, CPF ou Aleatória"
                              className="input-field pl-11"
                            />
                          </div>
                        </div>

                        {/* Teacher Terms Checkbox */}
                        <div className="flex items-center gap-3 pt-2">
                           <input 
                              type="checkbox"
                              id="terms"
                              required
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                              className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-cyan focus:ring-cyan/50"
                           />
                           <label htmlFor="terms" className="text-sm text-white/60">
                              Li e aceito o <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-cyan hover:underline">Termo de Adesão ao Programa</button>
                           </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onTokenChange={setCaptchaToken}
                  refreshKey={`${isLogin ? "login" : "signup"}-${role}-${captchaRefreshKey}`}
                />

                <button
                  type="submit"
                  disabled={loading || !captchaToken || !turnstileSiteKey}
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
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage(null);
                  }}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  {isLogin ? (
                    <>
                      Não tem uma conta? <span className="text-cyan font-black">Cadastre-se</span>
                    </>
                  ) : (
                    <>
                      Já tem uma conta? <span className="text-cyan font-black">Faça Login</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-white/30 text-xs hover:text-white transition-colors">
          &larr; Voltar para a página inicial
        </Link>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding-top: 0.875rem;
          padding-bottom: 0.875rem;
          padding-right: 1rem;
          color: white;
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(0, 234, 255, 0.5);
          background: rgba(255, 255, 255, 0.06);
        }
        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
