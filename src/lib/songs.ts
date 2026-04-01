import borboletinhaData from "../../public/songs/borboletinha.json";
import pintinhoData from "../../public/songs/pintinho-amarelinho.json";
import twinkleData from "../../public/songs/twinkle-twinkle.json";
import maryData from "../../public/songs/mary-had-a-little-lamb.json";
import odeData from "../../public/songs/ode-to-joy.json";
import furEliseMidiData from "../../public/songs/fur-elise-easy-ver.json";

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
  category: "Para Iniciantes" | "Infantis" | "Clássicos";
  isPremium: boolean;
  coverUrl?: string;
  notes: SongNote[];
}

/**
 * ── Banco de Músicas do PianoKids ────────────────────────────
 * Centralização de todas as lições em arquivos JSON externos.
 * Isso garante que o código permaneça limpo e as notas sejam
 * importadas com precisão milimétrica de arquivos MIDI.
 */
export const songs: Song[] = [
  // 1. Borboletinha (Integrado via MIDI)
  {
    ...(borboletinhaData as Song),
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: false,
    coverUrl: "/images/covers/borboletinha.png",
    difficulty: "Fácil"
  },

  // 2. Meu Pintinho Amarelinho
  pintinhoData as Song,

  // 3. Brilha Brilha Estrelinha
  twinkleData as Song,

  // 4. A Dona Aranha
  maryData as Song,

  // 5. Ode à Alegria
  odeData as Song,

  // 6. Für Elise (Integrado via MIDI do Usuário)
  {
    ...(furEliseMidiData as Song),
    id: "fur-elise", // Mantendo o ID original para links de dashboard
    title: "Für Elise",
    artist: "Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: "/images/covers/fur_elise_1775056434348.png",
    difficulty: "Difícil"
  }
];

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
