import { Song } from "@/lib/types";

export type { Song, SongNote, ArrangementLevel, SongArrangements } from "@/lib/types";

// Catálogo legado mantido apenas por compatibilidade. O app usa song-catalog-index.json.
export const songs: Song[] = [];
