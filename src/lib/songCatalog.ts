import type { Song } from "@/lib/types";

export async function loadSongs(): Promise<Song[]> {
  const songsModule = await import("./songs");
  return songsModule.songs;
}

export async function loadSongById(id: string): Promise<Song | undefined> {
  const songsModule = await import("./songs");
  return songsModule.getSongById(id);
}
