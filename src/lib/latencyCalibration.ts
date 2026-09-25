export const LATENCY_STORAGE_KEY = "pianify.inputLatencyMs";
export const MAX_LATENCY_MS = 350;

/** Beats ignored at the start while the student finds the pulse. */
const WARMUP_BEATS = 2;
const MIN_VALID_TAPS = 4;

/**
 * Estimate the delay between a click being scheduled and the student's tap.
 * Each tap is paired with its nearest beat; the median of the plausible
 * offsets is robust to a few mistimed taps.
 * Returns milliseconds, or null when there is not enough consistent data.
 */
export function estimateLatencyMs(beatTimes: number[], tapTimes: number[]): number | null {
  if (beatTimes.length <= WARMUP_BEATS) return null;
  const countedBeats = beatTimes.slice(WARMUP_BEATS);
  const firstCounted = countedBeats[0];
  const offsets: number[] = [];

  for (const tap of tapTimes) {
    if (tap < firstCounted - 0.25) continue;
    let nearest = countedBeats[0];
    for (const beat of countedBeats) {
      if (Math.abs(tap - beat) < Math.abs(tap - nearest)) nearest = beat;
    }
    const offset = tap - nearest;
    if (offset >= -0.12 && offset <= 0.45) offsets.push(offset);
  }

  if (offsets.length < MIN_VALID_TAPS) return null;
  offsets.sort((a, b) => a - b);
  const middle = Math.floor(offsets.length / 2);
  const median = offsets.length % 2 ? offsets[middle] : (offsets[middle - 1] + offsets[middle]) / 2;
  return Math.round(Math.min(MAX_LATENCY_MS, Math.max(0, median * 1000)));
}

export function readStoredLatencyMs(): number {
  try {
    const value = Number(window.localStorage.getItem(LATENCY_STORAGE_KEY));
    return Number.isFinite(value) ? Math.min(MAX_LATENCY_MS, Math.max(0, value)) : 0;
  } catch {
    return 0;
  }
}

export function storeLatencyMs(value: number) {
  try {
    window.localStorage.setItem(LATENCY_STORAGE_KEY, String(Math.round(value)));
  } catch {
    // Storage unavailable (private mode): the value only lasts for this visit.
  }
}
