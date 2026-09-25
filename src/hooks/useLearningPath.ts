"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPathProgress, startUnitIndexForLevel, type SongResult } from "@/lib/learningPath";
import { getStoredOnboardingPreferences } from "@/lib/onboarding";
import { loadPracticeSnapshot } from "@/lib/practiceSnapshot";

export function useLearningPath() {
  const [results, setResults] = useState<SongResult[]>([]);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [startUnitIndex, setStartUnitIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // The onboarding answer lives in localStorage, so it is read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only preference.
    setStartUnitIndex(startUnitIndexForLevel(getStoredOnboardingPreferences()?.level));

    loadPracticeSnapshot().then((snapshot) => {
      if (!active) return;
      setResults(snapshot?.songResults ?? []);
      setTodaySeconds(snapshot?.todaySeconds ?? 0);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const path = useMemo(() => buildPathProgress(results, startUnitIndex), [results, startUnitIndex]);

  return { ...path, todaySeconds, loading };
}
