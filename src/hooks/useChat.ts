"use client";

import { useState, useCallback, useEffect } from "react";
import { createClientComponent } from "@/lib/supabase";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export function useChat(friendId: string | null) {
  const supabase = createClientComponent();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!friendId) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Chat fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, friendId]);

  const sendMessage = async (content: string) => {
    if (!friendId || !content.trim()) return { success: false };
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: content.trim()
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  useEffect(() => {
    fetchMessages();

    if (!friendId) return;

    // Realtime subscription
    const channel = supabase
      .channel(`chat_${friendId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        // Só adicionar se a mensagem for referente a esta conversa específica
        setMessages(prev => {
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, friendId, supabase]);

  return {
    messages,
    loading,
    sendMessage,
    refresh: fetchMessages
  };
}
