export interface AudioCalibrationProfile {
  noiseFloorRms: number;
  silenceRms: number;
  minSignalRms: number;
  noteHoldMs: number;
  updatedAt: number;
}

export const AUDIO_CALIBRATION_STORAGE_KEY = "pianokids_audio_calibration_v1";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeCalibrationProfile(profile: Partial<AudioCalibrationProfile> | null | undefined): AudioCalibrationProfile | null {
  if (!profile) return null;

  const noiseFloorRms = clamp(profile.noiseFloorRms ?? 0.0025, 0.0005, 0.02);
  const silenceRms = clamp(profile.silenceRms ?? noiseFloorRms * 1.35, 0.0015, 0.025);
  const minSignalRms = clamp(profile.minSignalRms ?? Math.max(noiseFloorRms * 2.8, 0.0055), 0.0035, 0.05);
  const noteHoldMs = Math.round(clamp(profile.noteHoldMs ?? 140, 90, 260));
  const updatedAt = typeof profile.updatedAt === "number" ? profile.updatedAt : Date.now();

  return {
    noiseFloorRms,
    silenceRms,
    minSignalRms,
    noteHoldMs,
    updatedAt,
  };
}

export function readAudioCalibrationProfile(): AudioCalibrationProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUDIO_CALIBRATION_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeCalibrationProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveAudioCalibrationProfile(profile: AudioCalibrationProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUDIO_CALIBRATION_STORAGE_KEY, JSON.stringify(profile));
}

export function clearAudioCalibrationProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUDIO_CALIBRATION_STORAGE_KEY);
}
