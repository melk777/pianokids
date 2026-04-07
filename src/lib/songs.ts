import borboletinhaData from "../../public/songs/borboletinha.json";
import pintinhoMidiData from "../../public/songs/meu-pintinho-amarelinho.json";
import twinkleMidiData from "../../public/songs/brilha-brilha-estrelinha.json";
import aDonaAranhaData from "../../public/songs/a-dona-aranha.json";
import odeMidiData from "../../public/songs/ode-to-joy.json";
import furEliseMidiData from "../../public/songs/fur-elise-easy-ver.json";
import furEliseProData from "../../public/songs/fur-elise-pro.json";

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
  {
    ...(aDonaAranhaData as Song),
    id: "a-dona-aranha",
    title: "A Dona Aranha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: "/images/covers/dona_aranha_1775056352751.png",
    difficulty: "Fácil"
  },

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

  // 6. Für Elise - Versão Iniciante/Intermediária
  {
    ...(furEliseMidiData as Song),
    id: "fur-elise",
    title: "Für Elise (Iniciante)",
    artist: "Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: "/images/covers/fur_elise_1775056434348.png",
    difficulty: "Médio"
  },

  // 7. Für Elise - Versão PROFISSIONAL
  {
    ...(furEliseProData as Song),
    id: "fur-elise-pro",
    title: "Für Elise (Profissional)",
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
