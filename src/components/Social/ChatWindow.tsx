"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Send, 
  UserCircle2,
  Loader2
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { FriendshipData } from "@/hooks/useSocial";
import { useSFX } from "@/hooks/useSFX";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClientComponent } from "@/lib/supabase";
import Image from "next/image";

interface ChatWindowProps {
  friendship: FriendshipData;
  onClose: () => void;
}

export default function ChatWindow({ friendship, onClose }: ChatWindowProps) {
  const { playClick, playMessage } = useSFX();
  const { messages, loading, sendMessage } = useChat(friendship.friend_profile.id);
  const [content, setContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponent();

  useEffect(() => {
    const getMe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getMe();
  }, [supabase]);

  // Scroll para o fim quando chegam mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const text = content;
    setContent("");
    const res = await sendMessage(text);
    if (res.success) {
      playMessage();
    } else {
      setContent(text); // Restaurar se falhar
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      className="fixed bottom-6 right-24 w-96 h-[550px] bg-[#0c0c0c]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-[9999] pointer-events-auto"
    >
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            {friendship.friend_profile.avatar_url ? (
              <Image 
                src={friendship.friend_profile.avatar_url} 
                alt={friendship.friend_profile.username || "Avatar"}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" 
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <UserCircle2 className="w-7 h-7" />
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#0c0c0c] rounded-full ${friendship.isOnline ? 'bg-emerald-500' : 'bg-white/10'}`} />
          </div>
          <div>
            <h4 className="text-sm font-black bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent uppercase tracking-wider">
              {friendship.friend_profile.username}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={`w-1.5 h-1.5 rounded-full ${friendship.isOnline ? 'bg-emerald-500' : 'bg-white/20'}`}></span>
               <span className={`text-[9px] font-black uppercase tracking-widest ${friendship.isOnline ? 'text-emerald-400' : 'text-white/20'}`}>
                 {friendship.isOnline ? 'Conectado' : 'Desconectado'}
               </span>
            </div>
          </div>
        </div>
        <button onClick={() => { playClick(); onClose(); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-cyan" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-white text-black rounded-tr-none font-bold shadow-lg shadow-white/5' 
                    : 'glass border border-white/10 text-white rounded-tl-none'
                }`}>
                  <p>{msg.content}</p>
                  <span className={`text-[9px] mt-1 block opacity-40 ${isMe ? 'text-black' : 'text-white'}`}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
        <input 
          type="text"
          placeholder="Escreva algo especial..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-sm focus:border-cyan outline-none transition-all placeholder:text-white/20"
        />
        <button 
          type="submit"
          disabled={!content.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan to-magenta text-white hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 active:scale-90 shadow-lg shadow-cyan/20"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}
