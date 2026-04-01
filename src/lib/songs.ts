export interface SongNote {
  midi: number;       // MIDI note number (e.g., 60 = C4)
  time: number;       // Start time in seconds
  duration: number;   // Duration in seconds
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
      { midi: 60, time: 0, duration: 0.5 },    // C
      { midi: 60, time: 0.6, duration: 0.5 },   // C
      { midi: 67, time: 1.2, duration: 0.5 },   // G
      { midi: 67, time: 1.8, duration: 0.5 },   // G
      { midi: 69, time: 2.4, duration: 0.5 },   // A
      { midi: 69, time: 3.0, duration: 0.5 },   // A
      { midi: 67, time: 3.6, duration: 1.0 },   // G

      // "Quero ver você brilhar"
      { midi: 65, time: 4.8, duration: 0.5 },   // F
      { midi: 65, time: 5.4, duration: 0.5 },   // F
      { midi: 64, time: 6.0, duration: 0.5 },   // E
      { midi: 64, time: 6.6, duration: 0.5 },   // E
      { midi: 62, time: 7.2, duration: 0.5 },   // D
      { midi: 62, time: 7.8, duration: 0.5 },   // D
      { midi: 60, time: 8.4, duration: 1.0 },   // C

      // "Lá no céu sobre o mar"
      { midi: 67, time: 9.6, duration: 0.5 },   // G
      { midi: 67, time: 10.2, duration: 0.5 },  // G
      { midi: 65, time: 10.8, duration: 0.5 },  // F
      { midi: 65, time: 11.4, duration: 0.5 },  // F
      { midi: 64, time: 12.0, duration: 0.5 },  // E
      { midi: 64, time: 12.6, duration: 0.5 },  // E
      { midi: 62, time: 13.2, duration: 1.0 },  // D

      // "Brilha brilha estrelinha"
      { midi: 60, time: 14.4, duration: 0.5 },  // C
      { midi: 60, time: 15.0, duration: 0.5 },  // C
      { midi: 67, time: 15.6, duration: 0.5 },  // G
      { midi: 67, time: 16.2, duration: 0.5 },  // G
      { midi: 69, time: 16.8, duration: 0.5 },  // A
      { midi: 69, time: 17.4, duration: 0.5 },  // A
      { midi: 67, time: 18.0, duration: 1.0 },  // G
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
      { midi: 64, time: 0, duration: 0.5 },     // E
      { midi: 62, time: 0.55, duration: 0.5 },  // D
      { midi: 60, time: 1.1, duration: 0.5 },   // C
      { midi: 62, time: 1.65, duration: 0.5 },  // D
      { midi: 64, time: 2.2, duration: 0.5 },   // E
      { midi: 64, time: 2.75, duration: 0.5 },  // E
      { midi: 64, time: 3.3, duration: 1.0 },   // E

      { midi: 62, time: 4.4, duration: 0.5 },   // D
      { midi: 62, time: 4.95, duration: 0.5 },  // D
      { midi: 62, time: 5.5, duration: 1.0 },   // D

      { midi: 64, time: 6.6, duration: 0.5 },   // E
      { midi: 67, time: 7.15, duration: 0.5 },  // G
      { midi: 67, time: 7.7, duration: 1.0 },   // G

      { midi: 64, time: 8.8, duration: 0.5 },   // E
      { midi: 62, time: 9.35, duration: 0.5 },  // D
      { midi: 60, time: 9.9, duration: 0.5 },   // C
      { midi: 62, time: 10.45, duration: 0.5 }, // D
      { midi: 64, time: 11.0, duration: 0.5 },  // E
      { midi: 64, time: 11.55, duration: 0.5 }, // E
      { midi: 64, time: 12.1, duration: 0.5 },  // E
      { midi: 64, time: 12.65, duration: 0.5 }, // E

      { midi: 62, time: 13.2, duration: 0.5 },  // D
      { midi: 62, time: 13.75, duration: 0.5 }, // D
      { midi: 64, time: 14.3, duration: 0.5 },  // E
      { midi: 62, time: 14.85, duration: 0.5 }, // D
      { midi: 60, time: 15.4, duration: 1.0 },  // C
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
      { midi: 64, time: 0, duration: 0.45 },    // E
      { midi: 64, time: 0.5, duration: 0.45 },  // E
      { midi: 65, time: 1.0, duration: 0.45 },  // F
      { midi: 67, time: 1.5, duration: 0.45 },  // G

      { midi: 67, time: 2.0, duration: 0.45 },  // G
      { midi: 65, time: 2.5, duration: 0.45 },  // F
      { midi: 64, time: 3.0, duration: 0.45 },  // E
      { midi: 62, time: 3.5, duration: 0.45 },  // D

      { midi: 60, time: 4.0, duration: 0.45 },  // C
      { midi: 60, time: 4.5, duration: 0.45 },  // C
      { midi: 62, time: 5.0, duration: 0.45 },  // D
      { midi: 64, time: 5.5, duration: 0.45 },  // E

      { midi: 64, time: 6.0, duration: 0.7 },   // E (longer)
      { midi: 62, time: 6.75, duration: 0.25 },  // D (short)
      { midi: 62, time: 7.0, duration: 0.9 },   // D (held)

      { midi: 64, time: 8.0, duration: 0.45 },  // E
      { midi: 64, time: 8.5, duration: 0.45 },  // E
      { midi: 65, time: 9.0, duration: 0.45 },  // F
      { midi: 67, time: 9.5, duration: 0.45 },  // G

      { midi: 67, time: 10.0, duration: 0.45 }, // G
      { midi: 65, time: 10.5, duration: 0.45 }, // F
      { midi: 64, time: 11.0, duration: 0.45 }, // E
      { midi: 62, time: 11.5, duration: 0.45 }, // D

      { midi: 60, time: 12.0, duration: 0.45 }, // C
      { midi: 60, time: 12.5, duration: 0.45 }, // C
      { midi: 62, time: 13.0, duration: 0.45 }, // D
      { midi: 64, time: 13.5, duration: 0.45 }, // E

      { midi: 62, time: 14.0, duration: 0.7 },  // D (longer)
      { midi: 60, time: 14.75, duration: 0.25 }, // C (short)
      { midi: 60, time: 15.0, duration: 0.9 },  // C (held)
    ],
  },
];

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
