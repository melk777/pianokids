"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile, Profile } from "@/hooks/useProfile";
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle2,
  Crown,
  ArrowLeft,
  Loader2,
  Calendar,
  Star,
  Music,
  User as UserIcon
} from "lucide-react";
import Image from "next/image";

export default function PublicCareerPage() {
  const params = useParams();
  const router = useRouter();
  const { getPublicProfile } = useProfile();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!params.username) return;
      setLoading(true);
      const res = await getPublicProfile(params.username as string);
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setError(res.error || "Aluno não encontrado");
      }
      setLoading(false);
    };
    loadProfile();
  }, [params.username, getPublicProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <UserIcon className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-2xl font-black mb-2 italic text-white/20 uppercase tracking-widest">Ops! Aluno sumiu</h1>
        <p className="text-white/40 mb-8 max-w-xs">{error || "Não conseguimos encontrar este perfil no momento."}</p>
        <button 
          onClick={() => router.back()}
          className="bg-white/10 px-8 py-3 rounded-xl hover:bg-white/20 transition-all font-bold text-sm uppercase tracking-widest"
        >
          Voltar
        </button>
      </div>
    );
  }

  const isPro = profile.songs_completed >= 5 || profile.trophies >= 5; // Simples lógica visual para o perfil público por enquanto

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group cursor-pointer uppercase text-[10px] font-black tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <section className="glass rounded-[2.5rem] p-8 md:p-12 mb-8 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shadow-2xl">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.username || "Avatar"} 
                    width={160}
                    height={160}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-white/20" />
                )}
              </div>
              {isPro && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-magenta to-cyan flex items-center justify-center shadow-lg border-2 border-[#0a0a0a]">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase mb-2">
                {profile.full_name || "Músico"}
              </h1>
              <p className="text-cyan font-black text-sm mb-6 flex items-center justify-center md:justify-start gap-2 tracking-widest uppercase">
                @{profile.username}
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">CARREIRA MUSICAL</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Trophy className="text-yellow-400" />} 
            label="Troféus" 
            value={profile.trophies || 0} 
            color="border-yellow-400/20"
          />
          <StatCard 
            icon={<Calendar className="text-orange-400" />} 
            label="Dias Seguidos" 
            value={profile.streak_days || 0} 
            color="border-orange-400/20"
          />
          <StatCard 
            icon={<Clock className="text-cyan" />} 
            label="Prática" 
            value={`${Math.floor((profile.total_practice_time || 0) / 60)} min`} 
            color="border-cyan/20"
          />
          <StatCard 
            icon={<Target className="text-emerald-400" />} 
            label="Precisão" 
            value={`${profile.average_accuracy || 0}%`} 
            color="border-emerald-400/20"
          />
        </div>

        <div className="glass rounded-[2rem] p-8 border border-white/10 mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2 text-white/30">
            <CheckCircle2 className="w-5 h-5 text-cyan" />
            Progresso Técnico
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
                <span>Músicas Tocadas</span>
                <span>{profile.songs_played || 0}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/20 transition-[width] duration-500"
                  style={{ width: `${Math.min((profile.songs_played || 0) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
                <span>Concluídas 100%</span>
                <span>{profile.songs_completed || 0}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan to-magenta transition-[width] duration-500"
                  style={{ width: `${Math.min((profile.songs_completed || 0) * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <section>
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2 text-white/30">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Coleção de Troféus
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrophyItem 
              active={true}
              icon={<Star className="w-6 h-6" />}
              name="Bem-vindo!"
              desc="Primeiro acesso ao Pianify."
            />
            <TrophyItem 
              active={(profile.songs_played || 0) > 0}
              icon={<Music className="w-6 h-6" />}
              name="Primeira Nota"
              desc="Começou sua jornada musical."
            />
            <TrophyItem 
              active={(profile.streak_days || 0) >= 5}
              icon={<Calendar className="w-6 h-6" />}
              name="Focado"
              desc="5 dias seguidos de prática."
            />
            <TrophyItem 
              active={(profile.average_accuracy || 0) >= 90}
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
      active ? "border-yellow-400/30 bg-yellow-400/[0.02]" : "border-white/5 opacity-40 grayscale"
    }`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
        active ? "bg-yellow-400/20 text-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "bg-white/5 text-white/20"
      }`}>
        {icon}
      </div>
      <h4 className="text-[11px] font-black uppercase mb-1 tracking-widest">{name}</h4>
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
