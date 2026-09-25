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
  // The song route already validates the id and access, so request it directly
  // instead of downloading the whole catalog index first.
  const url = `/api/songs/${encodeURIComponent(id)}`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.status === 404) return undefined;
      if (!response.ok) {
        const error = new Error(`Failed to load ${url} (${response.status})`);
        // Auth and permission answers will not change on a retry.
        if (response.status < 500) throw Object.assign(error, { permanent: true });
        throw error;
      }

      return (await response.json()) as Song;
    } catch (error) {
      lastError = error;
      if ((error as { permanent?: boolean }).permanent) break;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to load ${url}`);
}
