const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const songsDir = path.join(rootDir, "data", "songs");
const outputFile = path.join(rootDir, "public", "song-catalog-index.json");
const manifestFile = path.join(rootDir, "data", "song-file-index.json");
const metadata = require("./song-catalog-metadata.js");
const { repairMojibake } = require("./text-normalization");

const SPECIAL_COVERS = {
  "bella-ciao-lacasadepapel": "/images/covers/default.png",
};

const EXTRA_SONGS = [];
const songFileManifest = {};

function sanitizeString(value) {
  return typeof value === "string" ? repairMojibake(value) : value;
}

function getLocalCoverUrl(folder, id) {
  const normalizedId = id.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const candidates = [
    id,
    normalizedId,
    normalizedId.replace(/[^a-z0-9]/gi, "").toLowerCase(),
  ];

  for (const candidate of [...new Set(candidates)]) {
    for (const extension of ["png", "jpg", "jpeg", "webp", "svg"]) {
      const coverPath = path.join(rootDir, "public", "images", "covers", folder, `${candidate}.${extension}`);
      if (fs.existsSync(coverPath)) {
        return `/images/covers/${folder}/${candidate}.${extension}`;
      }
    }
  }

  return undefined;
}

function getCoverUrl(id, fallbackCoverUrl) {
  for (const folder of ["infantis", "religiosos", "intro-filmes", "classicos"]) {
    const coverUrl = getLocalCoverUrl(folder, id);
    if (coverUrl) {
      return coverUrl;
    }
  }

  if (SPECIAL_COVERS[id]) {
    return SPECIAL_COVERS[id];
  }

  if (
    fallbackCoverUrl &&
    fallbackCoverUrl !== "/images/covers/placeholder.png" &&
    fallbackCoverUrl !== "/images/covers/default.png"
  ) {
    return fallbackCoverUrl;
  }

  return undefined;
}

function buildEntryFromJsonFile(fileName) {
  const absolutePath = path.join(songsDir, fileName);
  const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  const meta = metadata[parsed.id] || {};

  if (!parsed.id || typeof parsed.id !== "string") {
    throw new Error(`Song file ${fileName} does not contain a valid id.`);
  }
  if (songFileManifest[parsed.id]) {
    throw new Error(`Duplicate song id ${parsed.id} in ${fileName}.`);
  }
  songFileManifest[parsed.id] = fileName;

  const title = sanitizeString(meta.title || parsed.title || parsed.id);
  const artist = sanitizeString(meta.artist || parsed.artist || "Tradicional");
  const category = sanitizeString(meta.category || parsed.category || "Outros");
  const difficulty = sanitizeString(meta.difficulty || parsed.difficulty || "Fácil");
  const coverUrl = getCoverUrl(parsed.id, sanitizeString(parsed.coverUrl));
  return {
    id: parsed.id,
    title,
    artist,
    difficulty,
    bpm: Number(parsed.bpm || 0),
    duration: Number(parsed.duration || 0),
    category,
    categories: null,
    isPremium: meta.isPremium ?? Boolean(parsed.isPremium),
    coverUrl,
    noteCount: Array.isArray(parsed.notes) ? parsed.notes.length : 0,
    jsonPath: `/api/songs/${encodeURIComponent(parsed.id)}`,
    notes: [],
  };
}

function main() {
  const songFiles = fs
    .readdirSync(songsDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const entries = songFiles.map(buildEntryFromJsonFile).concat(EXTRA_SONGS);

  entries.sort((left, right) => {
    const categoryCompare = left.category.localeCompare(right.category, "pt-BR");
    if (categoryCompare !== 0) return categoryCompare;
    return left.title.localeCompare(right.title, "pt-BR");
  });

  fs.writeFileSync(outputFile, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    manifestFile,
    `${JSON.stringify(songFileManifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`Catalog index rebuilt with ${entries.length} songs.`);
}

main();
