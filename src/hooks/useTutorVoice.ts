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
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error("[USE_TUTOR_VOICE_ERROR]:", error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return { speak, isSpeaking };
}
