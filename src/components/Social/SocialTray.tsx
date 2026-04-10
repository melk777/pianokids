"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  UserCircle2,
  Bell,
  X,
  Plus,
  Loader2,
  UserPlus,
  ExternalLink,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSocial, FriendshipData } from "@/hooks/useSocial";
import { useProfile, Profile } from "@/hooks/useProfile";
import { useSFX } from "@/hooks/useSFX";

interface SocialTrayProps {
  onSelectFriend: (friend: FriendshipData) => void;
}

export default function SocialTray({ onSelectFriend }: SocialTrayProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const { playClick, playSuccess } = useSFX();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, friend: FriendshipData | null } | null>(null);
  const { 
    friends, 
    pendingRequests, 
    searchUsers, 
    sendFriendRequest, 
    updateRequestStatus, 
    loading 
  } = useSocial();

  const { profile } = useProfile();
  const isTeacher = profile?.role === "teacher";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) return;
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSendRequest = async (userId: string) => {
    playClick();
    const res = await sendFriendRequest(userId);
    if (res.success) {
      playSuccess();
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isExpanded ? 300 : 80,
        x: 0
      }}
      className="fixed right-0 top-1/2 -translate-y-1/2 h-[75vh] bg-[#0c0c0c]/95 backdrop-blur-3xl border-l border-white/5 pointer-events-auto rounded-l-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col z-[9999]"
    >
      {/* Toggle Button */}
      <button 
        onClick={() => { playClick(); setIsExpanded(!isExpanded); }}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-24 bg-white/5 hover:bg-cyan/20 transition-colors flex items-center justify-center rounded-r-lg group border-y border-r border-white/5"
      >
        {isExpanded ? <ChevronRight size={14} className="text-white/40 group-hover:text-cyan" /> : <ChevronLeft size={14} className="text-white/40 group-hover:text-cyan" />}
      </button>

      {/* Header Container */}
      <div className="p-6 flex items-center justify-between border-b border-white/10 h-20 shrink-0 bg-white/5">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex items-center justify-between w-full"
            >
              <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-cyan flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan" />
                {isTeacher ? "Meus Alunos" : "Amigos"}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  title="Adicionar Amigo"
                  className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-cyan text-black shadow-[0_0_15px_rgba(0,234,255,0.4)]' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <UserPlus size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-4 relative"
            >
              <div className="relative">
                <Users className={`w-6 h-6 ${pendingRequests.length > 0 ? 'text-magenta' : 'text-cyan'}`} />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-magenta rounded-full shadow-[0_0_10px_rgba(255,0,229,0.8)]" />
                )}
              </div>
              <button 
                onClick={() => { setIsExpanded(true); setShowSearch(true); }}
                title="Adicionar Amigo"
                className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-cyan hover:bg-white/10 transition-all border border-white/5"
              >
                <Plus size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div 
              className="fixed inset-0 z-[10000]" 
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[10001] bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-1 shadow-2xl min-w-[160px] backdrop-blur-xl"
            >
              <button
                onClick={() => {
                  if (contextMenu.friend) {
                    router.push(`/dashboard/profile/${contextMenu.friend.friend_profile.username}`);
                  }
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cyan/10 hover:text-cyan rounded-lg transition-all text-[11px] font-black uppercase tracking-widest text-white/70"
              >
                <Trophy size={14} className="text-cyan" />
                Ver Carreira
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 pt-6">
        
        {/* Search View (LoL Style Overlay) */}
        <AnimatePresence>
          {showSearch && isExpanded && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4 mb-8 p-4 rounded-2xl bg-[#111111] border border-cyan/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan">Adicionar Amigo</h4>
                <button onClick={() => setShowSearch(false)} className="text-white/20 hover:text-white transition-colors"><X size={14}/></button>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text" 
                  placeholder={isTeacher ? "Nome do aluno..." : "Nome do amigo..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:border-cyan outline-none transition-all"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-white/40 hover:text-cyan">
                  <Search size={14} />
                </button>
              </form>
              
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {searching ? (
                  <Loader2 size={16} className="animate-spin text-cyan mx-auto" />
                ) : (
                  searchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-xs font-bold text-white/80">{user.username}</span>
                      <button 
                        onClick={() => handleSendRequest(user.id)} 
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan to-magenta text-white font-black text-[9px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan/10 uppercase tracking-widest"
                      >
                        Convidar
                      </button>
                    </div>
                  ))
                )}
                {searchResults.length === 0 && searchQuery.length >= 3 && !searching && (
                  <p className="text-[10px] text-center text-white/20 italic">Aluno não encontrado</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending Requests Section */}
        {isExpanded && pendingRequests.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent px-2">
              Pendentes ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map(room => (
                <div key={room.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <UserCircle2 className="w-5 h-5 text-magenta" />
                    <span className="text-[11px] font-black text-white/80">{room.friend_profile.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateRequestStatus(room.id, 'accepted')}
                      className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-cyan to-magenta text-white font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-cyan/10"
                    >
                      Aceitar
                    </button>
                    <button 
                      onClick={() => updateRequestStatus(room.id, 'blocked')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 font-bold text-[9px] uppercase hover:bg-white/10 transition-all"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-1">
          {isExpanded && <h3 className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] pl-2 mb-3">{isTeacher ? "Meus Alunos" : "Amigos"}</h3>}
          {friends.map((friendship) => (
            <button
              key={friendship.id}
              onClick={() => { playClick(); onSelectFriend(friendship); }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  friend: friendship
                });
              }}
              className={`w-full flex items-center gap-4 p-2.5 rounded-2xl hover:bg-white/10 transition-all group ${!isExpanded && 'justify-center border-transparent border'}`}
            >
              <div className="relative shrink-0">
                {friendship.friend_profile.avatar_url ? (
                  <Image 
                    src={friendship.friend_profile.avatar_url} 
                    alt={friendship.friend_profile.username || "Avatar"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full border-2 border-white/20 object-cover shadow-lg group-hover:border-cyan/50 transition-all" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-white/30 group-hover:text-cyan group-hover:border-cyan/50 transition-all">
                    <UserCircle2 className="w-8 h-8" />
                  </div>
                )}
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-[#0c0c0c] shadow-lg transition-colors ${friendship.isOnline ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-white/10 shadow-black/40'}`} />
              </div>

              {isExpanded && (
                <div className="flex-1 text-left overflow-hidden uppercase pr-1">
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <h4 className={`text-[13px] font-black truncate transition-colors bg-clip-text text-transparent ${friendship.isOnline ? 'bg-gradient-to-r from-cyan to-magenta' : 'bg-white/40'}`}>
                      {friendship.friend_profile.username}
                    </h4>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                        router.push(`/dashboard/profile/${friendship.friend_profile.username}`);
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded bg-cyan/10 hover:bg-cyan/20 border border-cyan/20 text-[8px] font-black text-cyan transition-all opacity-0 group-hover:opacity-100"
                    >
                      CARREIRA
                      <ExternalLink size={10} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-black tracking-widest ${friendship.isOnline ? 'text-emerald-400' : 'text-white/20'}`}>
                      {friendship.isOnline ? 'Disponível' : 'Offline'}
                    </span>
                    {friendship.isOnline && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-emerald-400/50" />
                        <span className="text-[9px] text-white/20 font-bold">Pianify</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
          {friends.length === 0 && !loading && (
             <div className="py-10 text-center opacity-30 select-none pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Plus className="text-white w-6 h-6" />
                </div>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">{isTeacher ? "Sem alunos" : "Sem amigos"}</p>
             </div>
          )}
        </div>
      </div>

      {/* Footer notifications */}
      <div className="p-6 border-t border-white/5 flex items-center justify-center h-20 shrink-0">
        <div className="relative">
          <Bell className={`w-6 h-6 ${pendingRequests.length > 0 ? 'text-magenta' : 'text-white/10'}`} />
          {pendingRequests.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-magenta text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {pendingRequests.length}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
