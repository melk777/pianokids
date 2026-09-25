/**
 * Salamander Grand Piano V2 (Alexander Holm), CC-BY 3.0, via the Tone.js
 * sample set: one recording every three semitones from A0 to C8. Notes in
 * between are pitch-shifted from the nearest recording (at most 1.5 semitones).
 */

export const PIANO_SAMPLE_BASE_PATH = "/audio/piano/salamander";

const NOTE_NAMES: Record<string, number> = { C: 0, Ds: 3, Fs: 6, A: 9 };

export interface PianoSample {
  name: string;
  midi: number;
}

function sampleMidi(noteName: string, octave: number) {
  return (octave + 1) * 12 + NOTE_NAMES[noteName];
}

export const PIANO_SAMPLES: PianoSample[] = (() => {
  const samples: PianoSample[] = [{ name: "A0", midi: sampleMidi("A", 0) }];
  for (let octave = 1; octave <= 7; octave++) {
    for (const noteName of ["C", "Ds", "Fs", "A"]) {
      samples.push({ name: `${noteName}${octave}`, midi: sampleMidi(noteName, octave) });
    }
  }
  samples.push({ name: "C8", midi: sampleMidi("C", 8) });
  return samples;
})();

export function samplePath(sample: PianoSample) {
  return `${PIANO_SAMPLE_BASE_PATH}/${sample.name}.mp3`;
}

/** The recording closest in pitch to `midi`, and the playback rate that tunes it. */
export function nearestSample(midi: number): { sample: PianoSample; playbackRate: number } {
  let best = PIANO_SAMPLES[0];
  for (const sample of PIANO_SAMPLES) {
    if (Math.abs(sample.midi - midi) < Math.abs(best.midi - midi)) best = sample;
  }
  return { sample: best, playbackRate: Math.pow(2, (midi - best.midi) / 12) };
}
