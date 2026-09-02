import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Song, SongSourceProvenance } from "@/lib/types";

const catalogPath = path.join(process.cwd(), "public", "song-catalog-index.json");
const manifestPath = path.join(process.cwd(), "data", "song-file-index.json");
const songsDirectory = path.join(process.cwd(), "data", "songs");

let catalogPromise: Promise<Song[]> | null = null;
let manifestPromise: Promise<Record<string, string>> | null = null;
let creditsPromise: Promise<SongCredit[]> | null = null;

export interface SongCredit {
  id: string;
  title: string;
  artist: string;
  source: SongSourceProvenance & {
    canonical: true;
    license: string;
    sourceUrl: string;
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export function getServerSongCatalog() {
  catalogPromise ??= readJson<Song[]>(catalogPath);
  return catalogPromise;
}

async function getSongFileManifest() {
  manifestPromise ??= readJson<Record<string, string>>(manifestPath);
  return manifestPromise;
}

export async function getServerSongMetadata(songId: string) {
  const catalog = await getServerSongCatalog();
  return catalog.find((song) => song.id === songId);
}

export async function getServerSongById(songId: string): Promise<Song | undefined> {
  const [metadata, manifest] = await Promise.all([
    getServerSongMetadata(songId),
    getSongFileManifest(),
  ]);

  if (!metadata) return undefined;

  const fileName = manifest[songId];
  if (!fileName || path.basename(fileName) !== fileName) {
    throw new Error(`Song payload mapping is invalid for ${songId}.`);
  }

  const payloadPath = path.resolve(songsDirectory, fileName);
  const expectedPrefix = `${path.resolve(songsDirectory)}${path.sep}`;
  if (!payloadPath.startsWith(expectedPrefix)) {
    throw new Error(`Song payload path is outside the private catalog for ${songId}.`);
  }

  const payload = await readJson<Partial<Song>>(payloadPath);
  return {
    ...(payload as Song),
    ...metadata,
    jsonPath: null,
    notes: Array.isArray(payload.notes) ? payload.notes : [],
    arrangements: payload.arrangements ?? null,
    notes1Hand: payload.notes1Hand ?? null,
    notes2Hands: payload.notes2Hands ?? null,
  };
}

export function getServerSongCredits() {
  creditsPromise ??= Promise.all([getServerSongCatalog(), getSongFileManifest()]).then(
    async ([catalog, manifest]) => {
      const credits = await Promise.all(
        catalog.map(async (metadata) => {
          const fileName = manifest[metadata.id];
          if (!fileName || path.basename(fileName) !== fileName) {
            throw new Error(`Song credit mapping is invalid for ${metadata.id}.`);
          }

          const payload = await readJson<Partial<Song>>(path.join(songsDirectory, fileName));
          const source = payload.sourceProvenance;
          if (!source?.canonical || !source.license || !source.sourceUrl) {
            throw new Error(`Song rights metadata is incomplete for ${metadata.id}.`);
          }

          return {
            id: metadata.id,
            title: metadata.title,
            artist: metadata.artist,
            source: source as SongCredit["source"],
          } satisfies SongCredit;
        }),
      );

      return credits.sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));
    },
  );

  return creditsPromise;
}
