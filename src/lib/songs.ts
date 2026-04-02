import borboletinhaData from "../../public/songs/borboletinha.json";
import pintinhoMidiData from "../../public/songs/meu_pintinho_amarelinho.json";
import twinkleMidiData from "../../public/songs/brilha_brilha_estrelinha.json";
import maryData from "../../public/songs/mary-had-a-little-lamb.json";
import odeMidiData from "../../public/songs/ode_to_joy_(ode_à_alegria)_-_very_easy_piano_version.json";
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

  // 2. Meu Pintinho Amarelinho (Integrado via MIDI)
  {
    ...(pintinhoMidiData as Song),
    id: "pintinho-amarelinho",
    title: "Meu Pintinho Amarelinho",
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: false,
    coverUrl: "/images/covers/pintinho.png",
    difficulty: "Fácil"
  },

  // 3. Brilha Brilha Estrelinha (Integrado via MIDI)
  {
    ...(twinkleMidiData as Song),
    id: "twinkle-twinkle",
    title: "Brilha Brilha Estrelinha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: "/images/covers/brilha_brilha_1775056322794.png",
    difficulty: "Fácil"
  },

  // 4. A Dona Aranha (JSON original)
  maryData as Song,

  // 5. Ode à Alegria (Integrado via MIDI)
  {
    ...(odeMidiData as Song),
    id: "ode-to-joy",
    title: "Ode à Alegria",
    artist: "Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: "/images/covers/ode_alegria_1775056393157.png",
    difficulty: "Médio"
  },

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
