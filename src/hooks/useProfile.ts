"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponent } from "@/lib/supabase";

import { Profile } from "@/lib/types";
export type { Profile };



export function useProfile() {
  const supabase = createClientComponent();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Profile doesn't exist? Create it (failsafe for all users)
          const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Aluno",
            username: user.email?.split("@")[0] || `user_${user.id.slice(0, 5)}`,
            username_changes_count: 0,
            role: user.user_metadata?.role || "student",
          };
          const { data: inserted, error: insertError } = await supabase
            .from("profiles")
            .insert(newProfile)
            .select()
            .single();
          
          if (insertError) throw insertError;
          setProfile(inserted);
        } else {
          throw fetchError;
        }
      } else {
        setProfile(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Error fetching profile:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificação de alteração de username (Regra de 1 alteração)
      if (updates.username && updates.username !== profile?.username) {
        if ((profile?.username_changes_count || 0) >= 1) {
          throw new Error("Você já alterou seu nome de usuário uma vez e não pode alterá-lo novamente.");
        }
        // Se está alterando pela primeira vez, marcamos o contador
        updates.username_changes_count = 1;
      }

      // Clean up updates to avoid sending extra fields
      const cleanUpdates = { ...updates };
      delete cleanUpdates.id;
      delete cleanUpdates.updated_at;

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("Este nome de usuário já está sendo usado por outro aluno.");
        }
        throw updateError;
      }
      
      // Update local state with fresh copy
      setProfile({ ...data });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar";
      console.error("Error updating profile:", msg);
      return { success: false, error: msg };
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const res = await updateProfile({ avatar_url: publicUrl });
      if (!res.success) throw new Error(res.error);

      return { success: true, url: publicUrl, fileName };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      console.error("Error uploading avatar:", msg);
      return { success: false, error: msg };
    }
  };

  const recordPracticeSession = async (seconds: number, accuracy: number, completed: boolean) => {
    if (!profile) return;
    
    const newAccuracy = profile.songs_played === 0 
      ? accuracy 
      : (profile.average_accuracy * profile.songs_played + accuracy) / (profile.songs_played + 1);

    const updates: Partial<Profile> = {
      total_practice_time: profile.total_practice_time + seconds,
      songs_played: profile.songs_played + 1,
      average_accuracy: Math.round(newAccuracy),
      songs_completed: completed ? profile.songs_completed + 1 : profile.songs_completed,
    };

    const today = new Date().toISOString().split('T')[0];
    if (profile.last_practice_date !== today) {
      updates.streak_days = (profile.streak_days || 0) + 1;
      updates.last_practice_date = today;
    }

    return await updateProfile(updates);
  };

  const getPublicProfile = useCallback(async (username: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();
      
      if (error) throw error;
      return { success: true, data: data as Profile };
    } catch (err: unknown) {
      console.error("Public profile error:", err);
      return { success: false, error: err instanceof Error ? err.message : "Erro ao carregar" };
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    updateProfile,
    uploadAvatar,
    recordPracticeSession,
    getPublicProfile
  };
}
