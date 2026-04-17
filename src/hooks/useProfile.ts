"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponent } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { mergeProfileWithPracticeAggregate } from "@/lib/practiceHistory";

export type { Profile };

function normalizeProfile(profile: Partial<Profile>): Profile {
  return {
    id: profile.id || "",
    username: profile.username ?? null,
    username_changes_count: profile.username_changes_count ?? 0,
    full_name: profile.full_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    trophies: profile.trophies ?? 0,
    streak_days: profile.streak_days ?? 0,
    total_practice_time: profile.total_practice_time ?? 0,
    average_accuracy: profile.average_accuracy ?? 0,
    songs_played: profile.songs_played ?? 0,
    songs_completed: profile.songs_completed ?? 0,
    last_practice_date: profile.last_practice_date ?? null,
    updated_at: profile.updated_at ?? new Date().toISOString(),
    role: profile.role ?? "student",
    subscription_status: profile.subscription_status ?? null,
    subscription_plan_interval: profile.subscription_plan_interval ?? null,
    balance_withdrawn_total: profile.balance_withdrawn_total ?? 0,
  };
}

export function useProfile() {
  const supabase = createClientComponent();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydratePracticeSnapshot = useCallback(async (baseProfile: Profile) => {
    try {
      const response = await fetch("/api/practice/session", { cache: "no-store" });
      if (!response.ok) return baseProfile;

      const data = await response.json();
      if (!data?.supported || !data?.aggregate) {
        return baseProfile;
      }

      return mergeProfileWithPracticeAggregate(baseProfile, data.aggregate);
    } catch {
      return baseProfile;
    }
  }, []);

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
          const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Aluno",
            username: user.email?.split("@")[0] || `user_${user.id.slice(0, 5)}`,
            username_changes_count: 0,
            role: user.user_metadata?.role || "student",
            trophies: 1,
            streak_days: 0,
            total_practice_time: 0,
            average_accuracy: 0,
            songs_played: 0,
            songs_completed: 0,
            last_practice_date: null,
          };
          const { data: inserted, error: insertError } = await supabase
            .from("profiles")
            .insert(newProfile)
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }
          const normalizedProfile = normalizeProfile(inserted);
          setProfile(await hydratePracticeSnapshot(normalizedProfile));
        } else {
          throw fetchError;
        }
      } else {
        const normalizedProfile = normalizeProfile(data);
        setProfile(await hydratePracticeSnapshot(normalizedProfile));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Error fetching profile:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [hydratePracticeSnapshot, supabase]);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario nao autenticado");

      if (updates.username && updates.username !== profile?.username) {
        if ((profile?.username_changes_count || 0) >= 1) {
          throw new Error("Voce ja alterou seu nome de usuario uma vez e nao pode altera-lo novamente.");
        }
        updates.username_changes_count = 1;
      }

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
          throw new Error("Este nome de usuario ja esta sendo usado por outro aluno.");
        }
        throw updateError;
      }

      setProfile(normalizeProfile(data));
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
      if (!user) throw new Error("Usuario nao autenticado");

      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      const maxFileSize = 2 * 1024 * 1024;

      if (!allowedTypes.has(file.type)) {
        throw new Error("Envie uma imagem JPG, PNG ou WEBP.");
      }

      if (file.size > maxFileSize) {
        throw new Error("A imagem deve ter no maximo 2 MB.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
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

  const recordPracticeSession = async ({
    seconds,
    accuracy,
    completed,
    score,
    combo,
    songId,
    songTitle,
    difficulty,
    handMode,
  }: {
    seconds: number;
    accuracy: number;
    completed: boolean;
    score?: number;
    combo?: number;
    songId?: string;
    songTitle?: string;
    difficulty?: string;
    handMode?: string;
  }) => {
    try {
      const response = await fetch("/api/practice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSeconds: seconds,
          accuracy,
          completed,
          score,
          combo,
          songId,
          songTitle,
          difficulty,
          handMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Nao foi possivel salvar a sessao.");
      }

      if (data?.profile) {
        const normalized = normalizeProfile(data.profile);
        setProfile(mergeProfileWithPracticeAggregate(normalized, data.aggregate));
      } else if (profile && data?.aggregate) {
        setProfile(mergeProfileWithPracticeAggregate(profile, data.aggregate));
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar sessao";
      console.error("Error recording practice session:", msg);
      return { success: false, error: msg };
    }
  };

  const getPublicProfile = useCallback(async (username: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      return { success: true, data: normalizeProfile(data) };
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
    getPublicProfile,
  };
}
