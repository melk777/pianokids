export interface SongNote {
  midi: number;       // MIDI note number (e.g., 60 = C4)
  time: number;       // Start time in seconds
  duration: number;   // Duration in seconds
  hand?: "left" | "right"; // Which hand plays this note
  velocity?: number;  // 0-1, dynamic intensity
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: "Fácil" | "Médio" | "Difícil";
  bpm: number;
  duration: number;   // Total duration in seconds
  notes: SongNote[];
}

// ── Sample Songs ────────────────────────────────────────────
// MIDI note reference: C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71

export const songs: Song[] = [
  {
    id: "twinkle-twinkle",
    title: "Brilha Brilha Estrelinha",
    artist: "Tradicional",
    difficulty: "Fácil",
    bpm: 100,
    duration: 24,
    notes: [
      // "Brilha brilha estrelinha"
      { midi: 60, time: 0, duration: 0.5, hand: "right" },
      { midi: 60, time: 0.6, duration: 0.5, hand: "right" },
      { midi: 67, time: 1.2, duration: 0.5, hand: "right" },
      { midi: 67, time: 1.8, duration: 0.5, hand: "right" },
      { midi: 69, time: 2.4, duration: 0.5, hand: "right" },
      { midi: 69, time: 3.0, duration: 0.5, hand: "right" },
      { midi: 67, time: 3.6, duration: 1.0, hand: "right" },

      // "Quero ver você brilhar"
      { midi: 65, time: 4.8, duration: 0.5, hand: "right" },
      { midi: 65, time: 5.4, duration: 0.5, hand: "right" },
      { midi: 64, time: 6.0, duration: 0.5, hand: "right" },
      { midi: 64, time: 6.6, duration: 0.5, hand: "right" },
      { midi: 62, time: 7.2, duration: 0.5, hand: "right" },
      { midi: 62, time: 7.8, duration: 0.5, hand: "right" },
      { midi: 60, time: 8.4, duration: 1.0, hand: "right" },

      // "Lá no céu sobre o mar"
      { midi: 67, time: 9.6, duration: 0.5, hand: "right" },
      { midi: 67, time: 10.2, duration: 0.5, hand: "right" },
      { midi: 65, time: 10.8, duration: 0.5, hand: "right" },
      { midi: 65, time: 11.4, duration: 0.5, hand: "right" },
      { midi: 64, time: 12.0, duration: 0.5, hand: "right" },
      { midi: 64, time: 12.6, duration: 0.5, hand: "right" },
      { midi: 62, time: 13.2, duration: 1.0, hand: "right" },

      // "Brilha brilha estrelinha"
      { midi: 60, time: 14.4, duration: 0.5, hand: "right" },
      { midi: 60, time: 15.0, duration: 0.5, hand: "right" },
      { midi: 67, time: 15.6, duration: 0.5, hand: "right" },
      { midi: 67, time: 16.2, duration: 0.5, hand: "right" },
      { midi: 69, time: 16.8, duration: 0.5, hand: "right" },
      { midi: 69, time: 17.4, duration: 0.5, hand: "right" },
      { midi: 67, time: 18.0, duration: 1.0, hand: "right" },
    ],
  },
  {
    id: "mary-had-a-little-lamb",
    title: "A Dona Aranha",
    artist: "Tradicional",
    difficulty: "Fácil",
    bpm: 110,
    duration: 16,
    notes: [
      { midi: 64, time: 0, duration: 0.5, hand: "right" },
      { midi: 62, time: 0.55, duration: 0.5, hand: "right" },
      { midi: 60, time: 1.1, duration: 0.5, hand: "right" },
      { midi: 62, time: 1.65, duration: 0.5, hand: "right" },
      { midi: 64, time: 2.2, duration: 0.5, hand: "right" },
      { midi: 64, time: 2.75, duration: 0.5, hand: "right" },
      { midi: 64, time: 3.3, duration: 1.0, hand: "right" },

      { midi: 62, time: 4.4, duration: 0.5, hand: "right" },
      { midi: 62, time: 4.95, duration: 0.5, hand: "right" },
      { midi: 62, time: 5.5, duration: 1.0, hand: "right" },

      { midi: 64, time: 6.6, duration: 0.5, hand: "right" },
      { midi: 67, time: 7.15, duration: 0.5, hand: "right" },
      { midi: 67, time: 7.7, duration: 1.0, hand: "right" },

      { midi: 64, time: 8.8, duration: 0.5, hand: "right" },
      { midi: 62, time: 9.35, duration: 0.5, hand: "right" },
      { midi: 60, time: 9.9, duration: 0.5, hand: "right" },
      { midi: 62, time: 10.45, duration: 0.5, hand: "right" },
      { midi: 64, time: 11.0, duration: 0.5, hand: "right" },
      { midi: 64, time: 11.55, duration: 0.5, hand: "right" },
      { midi: 64, time: 12.1, duration: 0.5, hand: "right" },
      { midi: 64, time: 12.65, duration: 0.5, hand: "right" },

      { midi: 62, time: 13.2, duration: 0.5, hand: "right" },
      { midi: 62, time: 13.75, duration: 0.5, hand: "right" },
      { midi: 64, time: 14.3, duration: 0.5, hand: "right" },
      { midi: 62, time: 14.85, duration: 0.5, hand: "right" },
      { midi: 60, time: 15.4, duration: 1.0, hand: "right" },
    ],
  },
  {
    id: "ode-to-joy",
    title: "Ode à Alegria",
    artist: "Beethoven",
    difficulty: "Médio",
    bpm: 120,
    duration: 18,
    notes: [
      // Right hand melody
      { midi: 64, time: 0, duration: 0.45, hand: "right" },
      { midi: 64, time: 0.5, duration: 0.45, hand: "right" },
      { midi: 65, time: 1.0, duration: 0.45, hand: "right" },
      { midi: 67, time: 1.5, duration: 0.45, hand: "right" },
      { midi: 67, time: 2.0, duration: 0.45, hand: "right" },
      { midi: 65, time: 2.5, duration: 0.45, hand: "right" },
      { midi: 64, time: 3.0, duration: 0.45, hand: "right" },
      { midi: 62, time: 3.5, duration: 0.45, hand: "right" },
      { midi: 60, time: 4.0, duration: 0.45, hand: "right" },
      { midi: 60, time: 4.5, duration: 0.45, hand: "right" },
      { midi: 62, time: 5.0, duration: 0.45, hand: "right" },
      { midi: 64, time: 5.5, duration: 0.45, hand: "right" },
      { midi: 64, time: 6.0, duration: 0.7, hand: "right" },
      { midi: 62, time: 6.75, duration: 0.25, hand: "right" },
      { midi: 62, time: 7.0, duration: 0.9, hand: "right" },
      // Second phrase
      { midi: 64, time: 8.0, duration: 0.45, hand: "right" },
      { midi: 64, time: 8.5, duration: 0.45, hand: "right" },
      { midi: 65, time: 9.0, duration: 0.45, hand: "right" },
      { midi: 67, time: 9.5, duration: 0.45, hand: "right" },
      { midi: 67, time: 10.0, duration: 0.45, hand: "right" },
      { midi: 65, time: 10.5, duration: 0.45, hand: "right" },
      { midi: 64, time: 11.0, duration: 0.45, hand: "right" },
      { midi: 62, time: 11.5, duration: 0.45, hand: "right" },
      { midi: 60, time: 12.0, duration: 0.45, hand: "right" },
      { midi: 60, time: 12.5, duration: 0.45, hand: "right" },
      { midi: 62, time: 13.0, duration: 0.45, hand: "right" },
      { midi: 64, time: 13.5, duration: 0.45, hand: "right" },
      { midi: 62, time: 14.0, duration: 0.7, hand: "right" },
      { midi: 60, time: 14.75, duration: 0.25, hand: "right" },
      { midi: 60, time: 15.0, duration: 0.9, hand: "right" },
      // Left hand bass (chords)
      { midi: 48, time: 0, duration: 1.9, hand: "left" },
      { midi: 48, time: 2.0, duration: 1.9, hand: "left" },
      { midi: 48, time: 4.0, duration: 1.9, hand: "left" },
      { midi: 48, time: 6.0, duration: 1.9, hand: "left" },
      { midi: 48, time: 8.0, duration: 1.9, hand: "left" },
      { midi: 48, time: 10.0, duration: 1.9, hand: "left" },
      { midi: 48, time: 12.0, duration: 1.9, hand: "left" },
      { midi: 48, time: 14.0, duration: 1.9, hand: "left" },
    ],
  },
  {
    id: "fur-elise",
    title: "Für Elise",
    artist: "Beethoven",
    difficulty: "Difícil",
    bpm: 130,
    duration: 180,
    notes: [
      // ─── Section A (Theme) ─── Mão direita
      // Motif 1: E5-D#5-E5-D#5-E5-B4-D5-C5
      { midi: 76, time: 0, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 0.23, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 0.46, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 0.69, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 0.92, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 71, time: 1.15, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 74, time: 1.38, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 1.61, duration: 0.23, hand: "right", velocity: 0.6 },
      // A (resolve)
      { midi: 69, time: 1.84, duration: 0.46, hand: "right", velocity: 0.8 },

      // Left hand bass: A2
      { midi: 45, time: 1.84, duration: 0.46, hand: "left", velocity: 0.4 },
      // Left hand: E3, A3
      { midi: 52, time: 2.3, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 57, time: 2.53, duration: 0.23, hand: "left", velocity: 0.35 },

      // Right hand continuing: C4-E4-A4
      { midi: 60, time: 2.3, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 64, time: 2.53, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 69, time: 2.76, duration: 0.46, hand: "right", velocity: 0.7 },

      // B4 resolve
      { midi: 52, time: 2.76, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 2.99, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 64, time: 2.99, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 68, time: 3.22, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 71, time: 3.45, duration: 0.46, hand: "right", velocity: 0.7 },

      // E3, G#3
      { midi: 52, time: 3.45, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 3.68, duration: 0.23, hand: "left", velocity: 0.35 },

      // Right: E4-G#4-B4 → E5
      { midi: 64, time: 3.68, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 68, time: 3.91, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 76, time: 4.14, duration: 0.46, hand: "right", velocity: 0.8 },

      // ─── Motif repeat ───
      { midi: 75, time: 4.6, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 4.83, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 5.06, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 5.29, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 71, time: 5.52, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 74, time: 5.75, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 5.98, duration: 0.23, hand: "right", velocity: 0.6 },

      // A resolve again
      { midi: 69, time: 6.21, duration: 0.46, hand: "right", velocity: 0.8 },
      { midi: 45, time: 6.21, duration: 0.46, hand: "left", velocity: 0.4 },
      { midi: 52, time: 6.67, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 57, time: 6.9, duration: 0.23, hand: "left", velocity: 0.35 },

      { midi: 60, time: 6.67, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 64, time: 6.9, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 69, time: 7.13, duration: 0.46, hand: "right", velocity: 0.7 },

      // Resolve to C
      { midi: 52, time: 7.13, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 7.36, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 64, time: 7.36, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 72, time: 7.59, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 71, time: 7.82, duration: 0.46, hand: "right", velocity: 0.7 },
      { midi: 69, time: 8.28, duration: 0.7, hand: "right", velocity: 0.8 },

      // ─── Section B (Contrasting) ───
      // F major transition
      { midi: 48, time: 9.0, duration: 0.46, hand: "left", velocity: 0.4 },
      { midi: 60, time: 9.0, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 65, time: 9.23, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 69, time: 9.46, duration: 0.46, hand: "right", velocity: 0.7 },

      { midi: 53, time: 9.46, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 57, time: 9.69, duration: 0.23, hand: "left", velocity: 0.35 },

      { midi: 69, time: 9.69, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 9.92, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 77, time: 10.15, duration: 0.46, hand: "right", velocity: 0.8 },

      // G resolve
      { midi: 48, time: 10.61, duration: 0.46, hand: "left", velocity: 0.4 },
      { midi: 55, time: 10.61, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 67, time: 10.61, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 10.84, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 76, time: 11.07, duration: 0.46, hand: "right", velocity: 0.8 },

      { midi: 76, time: 11.53, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 74, time: 11.76, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 11.99, duration: 0.46, hand: "right", velocity: 0.7 },

      // ─── Section A reprise ───
      { midi: 76, time: 12.5, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 12.73, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 12.96, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 13.19, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 13.42, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 71, time: 13.65, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 74, time: 13.88, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 14.11, duration: 0.23, hand: "right", velocity: 0.6 },

      { midi: 69, time: 14.34, duration: 0.46, hand: "right", velocity: 0.8 },
      { midi: 45, time: 14.34, duration: 0.46, hand: "left", velocity: 0.4 },
      { midi: 52, time: 14.8, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 57, time: 15.03, duration: 0.23, hand: "left", velocity: 0.35 },

      { midi: 60, time: 14.8, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 64, time: 15.03, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 69, time: 15.26, duration: 0.46, hand: "right", velocity: 0.7 },

      { midi: 52, time: 15.26, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 15.49, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 64, time: 15.49, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 72, time: 15.72, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 71, time: 15.95, duration: 0.46, hand: "right", velocity: 0.7 },

      // Final A
      { midi: 69, time: 16.41, duration: 1.0, hand: "right", velocity: 0.9 },
      { midi: 45, time: 16.41, duration: 1.0, hand: "left", velocity: 0.5 },
      { midi: 57, time: 16.41, duration: 1.0, hand: "left", velocity: 0.4 },

      // ─── Extended Theme (repeat for longer duration) ───
      // Motif 3rd time
      { midi: 76, time: 18.0, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 18.23, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 18.46, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 18.69, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 18.92, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 71, time: 19.15, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 74, time: 19.38, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 19.61, duration: 0.23, hand: "right", velocity: 0.6 },

      { midi: 69, time: 19.84, duration: 0.46, hand: "right", velocity: 0.8 },
      { midi: 45, time: 19.84, duration: 0.46, hand: "left", velocity: 0.4 },
      { midi: 52, time: 20.3, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 57, time: 20.53, duration: 0.23, hand: "left", velocity: 0.35 },

      { midi: 60, time: 20.3, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 64, time: 20.53, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 69, time: 20.76, duration: 0.46, hand: "right", velocity: 0.7 },

      { midi: 52, time: 20.76, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 20.99, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 64, time: 20.99, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 68, time: 21.22, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 71, time: 21.45, duration: 0.46, hand: "right", velocity: 0.7 },

      { midi: 52, time: 21.45, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 21.68, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 64, time: 21.68, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 68, time: 21.91, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 76, time: 22.14, duration: 0.46, hand: "right", velocity: 0.8 },

      // Final resolution
      { midi: 75, time: 22.6, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 22.83, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 75, time: 23.06, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 76, time: 23.29, duration: 0.23, hand: "right", velocity: 0.7 },
      { midi: 71, time: 23.52, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 74, time: 23.75, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 72, time: 23.98, duration: 0.23, hand: "right", velocity: 0.6 },

      { midi: 69, time: 24.21, duration: 0.46, hand: "right", velocity: 0.8 },
      { midi: 45, time: 24.21, duration: 0.46, hand: "left", velocity: 0.4 },
      { midi: 52, time: 24.67, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 57, time: 24.9, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 60, time: 24.67, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 64, time: 24.9, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 69, time: 25.13, duration: 0.46, hand: "right", velocity: 0.7 },

      { midi: 52, time: 25.13, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 56, time: 25.36, duration: 0.23, hand: "left", velocity: 0.35 },
      { midi: 64, time: 25.36, duration: 0.23, hand: "right", velocity: 0.5 },
      { midi: 72, time: 25.59, duration: 0.23, hand: "right", velocity: 0.6 },
      { midi: 71, time: 25.82, duration: 0.46, hand: "right", velocity: 0.7 },

      // Grand finale A
      { midi: 69, time: 26.28, duration: 1.5, hand: "right", velocity: 1.0 },
      { midi: 45, time: 26.28, duration: 1.5, hand: "left", velocity: 0.6 },
      { midi: 57, time: 26.28, duration: 1.5, hand: "left", velocity: 0.5 },
    ],
  },
];

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
