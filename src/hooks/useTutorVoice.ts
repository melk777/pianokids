"use client";

import { useState, useCallback } from "react";

interface TutorEventData {
  studentName?: string;
  eventType: "error" | "success" | "welcome" | "idle" | "test";
  context?: string;
}

export function useTutorVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (textOrData: string | TutorEventData) => {
    if (isSpeaking) return;

    try {
      setIsSpeaking(true);

      const isString = typeof textOrData === "string";
      const body = isString 
        ? { eventType: "test", context: textOrData } 
        : textOrData;

      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to reach Tutor API");

      const audioBlob = await response.blob();
      console.log("[USE_TUTOR_VOICE]: Blob received, size:", audioBlob.size);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = 1; // Forçar volume máximo

      const generatedText = decodeURIComponent(
        response.headers.get("X-Generated-Text") || ""
      );

      console.log("[USE_TUTOR_VOICE]: Playing text ->", generatedText);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error("[USE_TUTOR_VOICE]: Audio error:", e);
        setIsSpeaking(false);
      };

      await audio.play();
      console.log("[USE_TUTOR_VOICE]: Audio started playing");



    } catch (error) {
      console.error("[USE_TUTOR_VOICE_ERROR]:", error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return { speak, isSpeaking };
}
