import borboletinhaData from "../../public/songs/borboletinha.json";
import pintinhoMidiData from "../../public/songs/meu-pintinho-amarelinho.json";
import twinkleMidiData from "../../public/songs/brilha-brilha-estrelinha.json";
import aDonaAranhaData from "../../public/songs/a-dona-aranha.json";
import odeMidiData from "../../public/songs/ode-to-joy.json";
import furEliseMidiData from "../../public/songs/fur-elise-easy-ver.json";
import oSapoData from "../../public/songs/o-sapo-nao-lava-o-pe.json";
import minuetoData from "../../public/songs/minueto-em-sol-maior.json";
import goldenHourData from "../../public/songs/golden-hour.json";
import parabensData from "../../public/songs/parabens-pra-voce.json";

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
  category: "Para Iniciantes" | "Infantis" | "Clássicos" | "Sertanejos" | "Religiosos" | "Grandes Sucessos";
  isPremium: boolean;
  coverUrl?: string;
  notes: SongNote[];
}

/**
 * ── Banco de Músicas do PianoKids ────────────────────────────
 */
export const songs: Song[] = [
  // 1. Borboletinha
  {
    ...(borboletinhaData as Song),
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: false,
    coverUrl: "/images/covers/borboletinha.png",
    difficulty: "Fácil"
  },

  // 2. Meu Pintinho Amarelinho
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

  // 3. Brilha Brilha Estrelinha
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

  // 4. A Dona Aranha
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

  // 5. Ode à Alegria
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

  // 6. Für Elise
  {
    ...(furEliseMidiData as Song),
    id: "fur-elise",
    title: "Für Elise",
    artist: "Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: "/images/covers/fur_elise_1775056434348.png",
    difficulty: "Médio"
  },

  // Mock: Sertanejo
  {
    id: "evidencias",
    title: "Evidências",
    artist: "Chitãozinho & Xororó",
    category: "Sertanejos",
    isPremium: true,
    difficulty: "Médio",
    bpm: 90,
    duration: 120,
    coverUrl: "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=500&auto=format&fit=crop&q=60",
    notes: [] 
  },

  // Mock: Religiosa
  {
    id: "hallelujah",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    category: "Religiosos",
    isPremium: true,
    difficulty: "Fácil",
    bpm: 60,
    duration: 180,
    coverUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=500&auto=format&fit=crop&q=60",
    notes: []
  },

  // Mock: Sucessos Recentes
  {
    id: "flowers",
    title: "Flowers",
    artist: "Miley Cyrus",
    category: "Grandes Sucessos",
    isPremium: true,
    difficulty: "Médio",
    bpm: 112,
    duration: 200,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60",
    notes: []
  },

  // 10. O Sapo não lava o pé
  {
    ...(oSapoData as Song),
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: true,
    difficulty: "Fácil"
  },

  // 11. Minueto em Sol Maior
  {
    ...(minuetoData as Song),
    artist: "J.S. Bach",
    category: "Clássicos",
    isPremium: true,
    difficulty: "Médio"
  },

  // 12. Golden Hour
  {
    ...(goldenHourData as Song),
    artist: "JVKE",
    category: "Grandes Sucessos",
    isPremium: true,
    difficulty: "Médio"
  },

  // 13. Parabéns Pra Você
  {
    ...(parabensData as Song),
    artist: "Tradicional",
    category: "Infantis",
    isPremium: true,
    difficulty: "Fácil"
  }
];

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
