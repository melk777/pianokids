import type { Song } from "@/lib/types";

let catalogCache: Song[] | null = null;

async function fetchJson<T>(input: RequestInfo | URL): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(input, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${String(input)} (${response.status})`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to load ${String(input)}`);
}

async function loadCatalogIndex(): Promise<Song[]> {
  if (catalogCache) return catalogCache;

  const catalog = await fetchJson<Song[]>("/song-catalog-index.json");
  catalogCache = catalog;
  return catalog;
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
