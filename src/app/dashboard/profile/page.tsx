"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  User, 
  Camera, 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle2,
  Crown,
  Settings,
  ArrowLeft,
  Loader2,
  Calendar,
  CreditCard,
  Star,
  Music,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { profile, loading: profileLoading, error: profileError, updateProfile, uploadAvatar } = useProfile();
  const { 
    hasAccess: isSubscribed, 
    planType, 
    loading: subLoading,
  } = useSubscription();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync initial state when profile or editing mode changes
  useEffect(() => {
    if (profile && !editing) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
    }
  }, [profile, editing]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setSaving(true);
    const res = await updateProfile({ full_name: fullName, username });
    
    if (res?.success) {
      setEditing(false);
      alert("Perfil atualizado com sucesso!");
    } else {
      alert(`Erro ao salvar: ${res?.error || "Verifique se o nome de usuário já está em uso."}`);
    }
    setSaving(false);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    const res = await uploadAvatar(file);
    
    if (res.success) {
      alert("Foto de perfil atualizada!");
    } else {
      alert(`Erro no upload: ${res.error}`);
    }
    setUploading(false);
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.assign(data.url);
      else alert(data.error || "Erro ao abrir portal.");
    } catch (err) {
      console.error("Error creating portal session:", err);
      alert("Erro ao conectar com Stripe.");
    }
  };

  if (profileLoading || subLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-400 mb-4">Erro ao carregar perfil: {profileError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-white/10 px-6 py-2 rounded-xl hover:bg-white/20 transition-all font-bold"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url ? `${profile.avatar_url}?v=${new Date(profile.updated_at).getTime()}` : null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </div>

        {/* Profile Header Card */}
        <section className="glass rounded-[2.5rem] p-8 md:p-12 mb-8 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar Upload */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center relative group/avatar">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    key={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white/20" />
                )}
                
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Alterar</span>
                  <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={uploading} />
                </label>

                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 icon-gradient animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4 max-w-sm mx-auto md:mx-0">
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Nome Completo"
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-cyan outline-none transition-all text-xl font-bold"
                    />
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Nome de usuário"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-cyan outline-none transition-all text-sm text-white/60"
                    />
                  </div>
                  <div className="flex gap-2 justify-center md:justify-start">
                    <button 
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-cyan to-magenta text-white px-6 py-2 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditing(false)}
                      className="bg-white/5 px-6 py-2 rounded-xl font-bold text-sm hover:bg-white/10 transition-all font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                      {profile?.full_name || "Músico Iniciante"}
                    </h1>
                    {isSubscribed && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-magenta to-cyan flex items-center justify-center shadow-[0_0_15px_rgba(255,0,229,0.4)]">
                        <Crown className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-white/40 font-mono text-sm mb-6 flex items-center justify-center md:justify-start gap-2">
                    @{profile?.username || "pianokid"}
                    <span className={`w-1.5 h-1.5 rounded-full ${isSubscribed ? "bg-gradient-to-r from-cyan to-magenta animate-pulse" : "bg-white/20"}`} />
                  </p>
                  <button 
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-magenta transition-colors mx-auto md:mx-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    EDITAR PERFIL
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Trophy className="text-yellow-400" />} 
            label="Troféus" 
            value={profile?.trophies || 0} 
            color="border-yellow-400/20"
          />
          <StatCard 
            icon={<Calendar className="text-orange-400" />} 
            label="Dias Seguidos" 
            value={profile?.streak_days || 0} 
            color="border-orange-400/20"
          />
          <StatCard 
            icon={<Clock className="icon-gradient" />} 
            label="Prática" 
            value={`${Math.floor((profile?.total_practice_time || 0) / 60)} min`} 
            color="border-cyan/20"
          />
          <StatCard 
            icon={<Target className="text-emerald-400" />} 
            label="Precisão" 
            value={`${profile?.average_accuracy || 0}%`} 
            color="border-emerald-400/20"
          />
        </div>

        {/* Secondary Grid: Progress + Subscription */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="md:col-span-2 glass rounded-[2rem] p-8 border border-white/10">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 icon-gradient" />
              Progresso nas Músicas
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                  <span>Músicas Tocadas</span>
                  <span>{profile?.songs_played || 0}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((profile?.songs_played || 0) * 10, 100)}%` }}
                    className="h-full bg-white/20 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                  <span>Concluídas 100%</span>
                  <span>{profile?.songs_completed || 0}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((profile?.songs_completed || 0) * 10, 100)}%` }}
                    className="h-full bg-gradient-to-r from-cyan to-magenta rounded-full shadow-[0_0_10px_rgba(0,234,255,0.4)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC SUBSCRIPTION CARD */}
          <div className="glass rounded-[2rem] p-8 border border-white/10 relative overflow-hidden flex flex-col">
            {isSubscribed && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-magenta/10 blur-3xl -mr-16 -mt-16" />
            )}
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
              <CreditCard className={`w-5 h-5 ${isSubscribed ? "text-magenta" : "text-white/40"}`} />
              Assinatura
            </h3>

            <div className="mb-auto relative z-10">
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-1">Status Atual</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSubscribed ? "bg-green-400" : "bg-white/20"}`} />
                  <span className={`text-sm font-bold ${isSubscribed ? "text-green-400" : "text-white/60"}`}>
                    {isSubscribed ? "Plano Pro Ativo" : "Plano Gratuito"}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-1">Tipo de Plano</p>
                <p className="text-base font-bold text-white">{(() => {
                  if (planType === "admin_granted" || planType === "special_access") return "Acesso Especial (VIP)";
                  if (planType === "yearly") return "PianoKids Pro (Anual)";
                  if (planType === "monthly") return "PianoKids Pro (Mensal)";
                  if (planType === "trial") return "Período de Experiência";
                  return "Plano Gratuito";
                })()}</p>
              </div>
            </div>

            <div className="space-y-3 relative z-10 mt-6">
              {isSubscribed ? (
                planType !== 'admin_granted' && planType !== 'special_access' ? (
                  <button 
                    onClick={handleManageSubscription}
                    className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    Gerenciar no Stripe
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="text-center py-3 bg-magenta/5 border border-magenta/20 rounded-xl">
                    <p className="text-[10px] font-bold text-magenta uppercase tracking-widest">Privilégio Administrativo</p>
                  </div>
                )
              ) : (
                <Link 
                  href="/#pricing" 
                  className="w-full bg-gradient-to-r from-cyan to-magenta py-3 rounded-xl text-sm font-bold transition-all text-center block"
                >
                  Assinar Agora
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Trophies Collection */}
        <section className="mt-12">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Coleção de Troféus
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrophyItem 
              active={true}
              icon={<Star className="w-6 h-6" />}
              name="Bem-vindo!"
              desc="Primeiro acesso ao PianoKids."
            />
            <TrophyItem 
              active={(profile?.songs_played || 0) > 0}
              icon={<Music className="w-6 h-6" />}
              name="Primeira Nota"
              desc="Começou sua jornada musical."
            />
            <TrophyItem 
              active={(profile?.streak_days || 0) >= 5}
              icon={<Calendar className="w-6 h-6" />}
              name="Focado"
              desc="5 dias seguidos de prática."
            />
            <TrophyItem 
              active={(profile?.average_accuracy || 0) >= 90}
              icon={<Target className="w-6 h-6" />}
              name="Ouvido Absoluto"
              desc="Precisão média acima de 90%."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TrophyItem({ active, icon, name, desc }: { active: boolean, icon: React.ReactNode, name: string, desc: string }) {
  return (
    <div className={`glass rounded-2xl p-6 border flex flex-col items-center text-center transition-all ${
      active 
        ? "border-yellow-400/30 bg-yellow-400/[0.02]" 
        : "border-white/5 opacity-40 grayscale"
    }`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
        active ? "bg-yellow-400/20 text-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "bg-white/5 text-white/20"
      }`}>
        {icon}
      </div>
      <h4 className="text-sm font-bold mb-1">{name}</h4>
      <p className="text-[10px] text-white/40 leading-tight">{desc}</p>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className={`glass rounded-2xl p-6 border ${color} hover:bg-white/[0.04] transition-all group`}>
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
