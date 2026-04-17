import type { Song } from "@/lib/types";

let catalogPromise: Promise<Song[]> | null = null;

async function fetchJson<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${String(input)} (${response.status})`);
  }

  return (await response.json()) as T;
}

async function loadCatalogIndex(): Promise<Song[]> {
  if (!catalogPromise) {
    catalogPromise = fetchJson<Song[]>("/song-catalog-index.json");
  }

  return catalogPromise;
}

export async function loadSongs(): Promise<Song[]> {
  return loadCatalogIndex();
}

export async function loadSongById(id: string): Promise<Song | undefined> {
  const catalog = await loadCatalogIndex();
  const entry = catalog.find((song) => song.id === id);

  if (!entry) {
    return undefined;
  }

  if (!entry.jsonPath) {
    return { ...entry, notes: entry.notes ?? [] };
  }

  const songPayload = await fetchJson<Partial<Song>>(entry.jsonPath);

  return {
    ...(songPayload as Song),
    ...entry,
    notes: Array.isArray(songPayload.notes) ? songPayload.notes : [],
    arrangements: songPayload.arrangements ?? null,
    notes1Hand: songPayload.notes1Hand ?? null,
    notes2Hands: songPayload.notes2Hands ?? null,
  };
}
