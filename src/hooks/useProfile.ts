"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponent } from "@/lib/supabase";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  trophies: number;
  streak_days: number;
  total_practice_time: number;
  average_accuracy: number;
  songs_played: number;
  songs_completed: number;
  last_practice_date: string | null;
  updated_at: string;
}

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
    } catch (err: any) {
      console.error("Error fetching profile:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Clean up updates to avoid sending extra fields
      const cleanUpdates = { ...updates };
      delete (cleanUpdates as any).id;
      delete (cleanUpdates as any).updated_at;

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Update local state with fresh copy
      setProfile({ ...data });
      return { success: true };
    } catch (err: any) {
      console.error("Error updating profile:", err.message);
      return { success: false, error: err.message };
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
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
    } catch (err: any) {
      console.error("Error uploading avatar:", err.message);
      return { success: false, error: err.message };
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
      (updates as any).last_practice_date = today;
    }

    return await updateProfile(updates);
  };

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
    recordPracticeSession
  };
}
