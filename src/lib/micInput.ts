/**
 * Microphone input is noisier than MIDI or the keyboard: pitch detectors
 * often jump an octave, pick up harmonics as extra notes and react later.
 * These helpers make scoring fair for students playing an acoustic piano.
 */

export interface DetectedPitch {
  note: number;
  clarity: number;
  volume: number;
}

/**
 * For one-hand (melody) practice keep only the clearest detected note:
 * harmonics and room noise otherwise show up as "wrong notes".
 */
export function selectMicNotes<T extends DetectedPitch>(detected: T[], monophonic: boolean): T[] {
  if (!monophonic || detected.length <= 1) return detected;
  let best = detected[0];
  for (const candidate of detected) {
    const score = candidate.clarity * 2 + candidate.volume;
    if (score > best.clarity * 2 + best.volume) best = candidate;
  }
  return [best];
}

/** True when `midi` was played, allowing octave slips when input is lenient. */
export function wasPlayed(played: ReadonlySet<number>, midi: number, lenient: boolean) {
  if (played.has(midi)) return true;
  return lenient && (played.has(midi - 12) || played.has(midi + 12));
}

/** Extra timing tolerance for detection delay on the microphone. */
export const MIC_TIMING_FACTOR = 1.3;
