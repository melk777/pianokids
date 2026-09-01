"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { createClientComponent, isSupabaseConfigured } from "@/lib/supabase";
import { Mail, Lock, Loader2, ArrowRight, Calendar, Phone, CreditCard, Hash, UserRound } from "lucide-react";
import Link from "next/link";
import { getURL } from "@/lib/utils/url";
import { useSearchParams } from "next/navigation";
import TurnstileWidget from "./TurnstileWidget";
import { trackEvent } from "@/lib/analytics";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";
import {
  getAgeFromBirthDate,
  isValidBrazilianPhone,
  isValidCpf,
  PARTNER_TERMS_VERSION,
  PLATFORM_TERMS_VERSION,
} from "@/lib/registration-validation";
import {
  LOCAL_DEV_AUTH_COOKIE,
  LOCAL_DEV_AUTH_STORAGE_KEY,
  isLocalDevHost,
} from "@/lib/localDevAuth";

const TeacherTermsModal = dynamic(() => import("./TeacherTermsModal"), {
  loading: () => null,
});

interface AuthFormProps {
  turnstileSiteKey?: string;
}

function getPostLoginPath(role: string | null | undefined) {
  switch (role) {
    case "admin":
    case "teacher":
    case "student":
    default:
      return "/dashboard";
  }
}

export default function AuthForm({ turnstileSiteKey: initialTurnstileSiteKey }: AuthFormProps) {
  const supabase = isSupabaseConfigured ? createClientComponent() : null;
  const searchParams = useSearchParams();
  const isTeacherRegistration = searchParams.get("role") === "teacher";
  const [isLogin, setIsLogin] = useState(!isTeacherRegistration);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // New Registration Fields
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPlatformTerms, setAgreedToPlatformTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(isTeacherRegistration);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const [resolvedTurnstileSiteKey, setResolvedTurnstileSiteKey] = useState(
    (initialTurnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim(),
  );
  const [canUseLocalTestAuth, setCanUseLocalTestAuth] = useState(false);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const turnstileSiteKey = resolvedTurnstileSiteKey;
  const selectedPlan = searchParams.get("plan");
  const postLoginPath = getSafeInternalRedirect(
    searchParams.get("next"),
    selectedPlan === "monthly" || selectedPlan === "yearly"
      ? `/dashboard/subscription?plan=${selectedPlan}`
      : "/dashboard",
  );

  const [role, setRole] = useState<"student" | "teacher">(
    isTeacherRegistration ? "teacher" : "student",
  );

  // Age calculation logic
  const age = useMemo(() => {
    return getAgeFromBirthDate(birthDate);
  }, [birthDate]);

  const latestAdultBirthDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  }, []);

    useEffect(() => {
      const refCode = searchParams.get("ref");
      if (refCode) {
        localStorage.setItem("pianify_ref", refCode);
      }
  }, [searchParams]);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaRefreshKey((value) => value + 1);
  };

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

  useEffect(() => {
    setCanUseLocalTestAuth(isLocalDevHost(window.location.hostname));
  }, []);

  const enterLocalTestMode = () => {
    localStorage.setItem(LOCAL_DEV_AUTH_STORAGE_KEY, "1");
    document.cookie = `${LOCAL_DEV_AUTH_COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
    const localTestUrl = new URL("/api/auth/local-test", window.location.origin);
    localTestUrl.searchParams.set("redirect", postLoginPath);
    window.location.assign(localTestUrl.toString());
  };

  const handleForgotPassword = async () => {
    if (!supabase) {
      setMessage({ type: "error", text: "A autenticação ainda não foi configurada neste ambiente." });
      return;
    }
    if (!email.trim()) {
      setMessage({ type: "error", text: "Digite seu e-mail para receber o link de recuperação." });
      return;
    }
    if (!captchaToken) {
      setMessage({ type: "error", text: "Confirme a verificação anti-robô antes de recuperar a senha." });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const callbackUrl = new URL("/auth/callback", getURL());
      callbackUrl.searchParams.set("next", "/auth/update-password");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl.toString(),
        captchaToken,
      });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "Se este e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível solicitar a recuperação.",
      });
      setCaptchaToken(null);
      setCaptchaRefreshKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent(isLogin ? "auth_login_started" : "auth_signup_started", { role });

    if (!supabase) {
      setMessage({
        type: "error",
        text: "A autenticacao ainda nao foi configurada neste ambiente.",
      });
      return;
    }

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

    if (password.length < 8) {
      setMessage({ type: "error", text: "A senha deve ter pelo menos 8 caracteres." });
      return;
    }

    if (!isLogin) {
      if (fullName.trim().length < 2 || fullName.trim().length > 120) {
        setMessage({ type: "error", text: "Informe seu nome completo." });
        return;
      }
      if (age === null || age < 0 || age > 120) {
        setMessage({ type: "error", text: "Informe uma data de nascimento válida." });
        return;
      }
      if (age < 18) {
        setMessage({
          type: "error",
          text: "Cadastros de menores estão temporariamente indisponíveis até concluirmos a verificação do responsável legal.",
        });
        return;
      }
      if (!agreedToPlatformTerms) {
        setMessage({ type: "error", text: "Aceite os Termos de Uso e a Política de Privacidade para continuar." });
        return;
      }
    }
    
    // Validation for Teacher Terms
    if (!isLogin && role === "teacher" && !agreedToTerms) {
      setMessage({ type: "error", text: "Você precisa aceitar os termos de adesão para continuar." });
      setIsTermsModalOpen(true);
      return;
    }

    if (!isLogin && role === "teacher") {
      if (!isValidCpf(cpf)) {
        setMessage({ type: "error", text: "Informe um CPF válido." });
        return;
      }
      if (!isValidBrazilianPhone(phone)) {
        setMessage({ type: "error", text: "Informe um telefone brasileiro válido, com DDD." });
        return;
      }
      if (!pixKey.trim() || pixKey.trim().length > 150) {
        setMessage({ type: "error", text: "Informe uma chave PIX válida." });
        return;
      }
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

        const {
          data: { user },
        } = await supabase.auth.getUser();

        let resolvedRole = user?.user_metadata?.role as string | undefined;

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role) {
            resolvedRole = profile.role;
          }
        }

        trackEvent("auth_login_completed", { role: resolvedRole || role });
        const destination =
          resolvedRole === "student" || !resolvedRole
            ? postLoginPath
            : getPostLoginPath(resolvedRole);
        window.location.assign(new URL(destination, window.location.origin).toString());
      } else {
        const callbackUrl = new URL("/auth/callback", getURL());
        callbackUrl.searchParams.set("next", postLoginPath);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl.toString(),
            captchaToken,
            data: {
              role,
              full_name: fullName.trim(),
              referred_by_code,
              birth_date: birthDate,
              guardian_email: null,
              cpf: role === "teacher" ? cpf : null,
              phone: role === "teacher" ? phone : null,
              pix_key: role === "teacher" ? pixKey : null,
              terms_accepted: true,
              terms_version: PLATFORM_TERMS_VERSION,
              partner_terms_version: role === "teacher" ? PARTNER_TERMS_VERSION : null,
            }
          },
        });
        if (error) throw error;
        trackEvent("auth_signup_completed", { role });
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
             onClick={() => {
               setRole("student");
               resetCaptcha();
             }}
             className={`flex-1 py-2 text-xs font-bold relative z-10 transition-colors duration-300 ${role === "student" ? "text-black" : "text-white/40 hover:text-white/70"}`}
           >
             SOU ALUNO
           </button>
           <button 
             onClick={() => {
               setRole("teacher");
               resetCaptcha();
             }}
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
                  ? (role === "teacher" ? "Área exclusiva para professores parceiros." : "Continue sua jornada musical de onde parou.")
                  : role === "teacher" 
                    ? "Crie sua conta para acompanhar indicações e comissões elegíveis."
                    : "Crie sua conta gratuita e comece a tocar hoje mesmo."}
              </p>

              {!supabase && (
                <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                  Autenticacao indisponivel: configure as credenciais do Supabase para entrar ou cadastrar uma conta.
                </div>
              )}

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
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field pl-11"
                      />
                    </div>
                    {isLogin && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={loading}
                          className="text-xs font-semibold text-cyan/80 transition hover:text-cyan disabled:opacity-50"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration-only fields */}
                {!isLogin && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">Nome completo</label>
                      <div className="relative group">
                        <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          autoComplete="name"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          placeholder="Seu nome completo"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>

                    {/* Common Field: Birth Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/40 ml-1 uppercase tracking-wider">Data de Nascimento</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:icon-gradient transition-colors" />
                        <input
                          type="date"
                          required
                          max={latestAdultBirthDate}
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/45">
                      Nesta fase de lançamento, o cadastro está disponível apenas para maiores de 18 anos. O acesso de menores será aberto após a implantação da verificação do responsável legal.
                    </p>

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

                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <input
                        type="checkbox"
                        id="platform-terms"
                        required
                        checked={agreedToPlatformTerms}
                        onChange={(event) => setAgreedToPlatformTerms(event.target.checked)}
                        className="mt-0.5 h-5 w-5 rounded border-white/10 bg-white/5 text-cyan focus:ring-cyan/50"
                      />
                      <label htmlFor="platform-terms" className="text-xs leading-relaxed text-white/60">
                        Li e aceito os <Link href="/termos" target="_blank" className="font-bold text-cyan hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="font-bold text-cyan hover:underline">Política de Privacidade</Link>.
                      </label>
                    </div>
                  </div>
                )}

                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onTokenChange={setCaptchaToken}
                  refreshKey={`${isLogin ? "login" : "signup"}-${role}-${captchaRefreshKey}`}
                />

                <button
                  type="submit"
                  disabled={loading || !supabase || !captchaToken || !turnstileSiteKey}
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

              {canUseLocalTestAuth && (
                <div className="mt-4 rounded-2xl border border-cyan/20 bg-cyan/10 p-4">
                  <p className="mb-3 text-xs leading-relaxed text-cyan/80">
                    Ambiente local detectado. Use o modo teste para validar a Pianify sem a verificação anti-robô.
                  </p>
                  <button
                    type="button"
                    onClick={enterLocalTestMode}
                    className="w-full rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan transition hover:bg-cyan/20"
                  >
                    Entrar em modo teste local
                  </button>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage(null);
                    resetCaptcha();
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
