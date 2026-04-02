"use client";

import { useState, useCallback } from "react";

interface TutorEventData {
  studentName?: string;
  eventType: "error" | "success" | "welcome" | "idle";
  context?: string;
}

export function useVirtualTutor() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const triggerTutor = useCallback(async (data: TutorEventData) => {
    if (isSpeaking) return; // Evita sobreposição de vozes

    try {
      setIsSpeaking(true);

      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to reach Tutor API");

      // Receber o buffer de áudio (MP3)
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Reproduzir o áudio instantaneamente
      const audio = new Audio(audioUrl);
      
      // Capturar o texto gerado (se precisar exibir na tela via legenda)
      const generatedText = decodeURIComponent(
        response.headers.get("X-Generated-Text") || ""
      );

      console.log("[TUTOR_VOICE]:", generatedText);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error("[USE_VIRTUAL_TUTOR_ERROR]:", error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return { triggerTutor, isSpeaking };
}
