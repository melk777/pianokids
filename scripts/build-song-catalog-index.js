const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const songsDir = path.join(rootDir, "public", "songs");
const outputFile = path.join(rootDir, "public", "song-catalog-index.json");
const metadata = require("./song-catalog-metadata.js");
const { repairMojibake } = require("./text-normalization");

const COMPOSER_COVERS = {
  "Ludwig van Beethoven": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg",
  "Johann Sebastian Bach": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Johann_Sebastian_Bach.jpg",
  "Wolfgang Amadeus Mozart":
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/Barbara_Krafft_-_Portr%C3%A4t_Wolfgang_Amadeus_Mozart_%281819%29.jpg",
  "Frederic Chopin": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Fr%C3%A9d%C3%A9ric_Chopin.jpg",
  "Frédéric Chopin": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Fr%C3%A9d%C3%A9ric_Chopin.jpg",
  "Piotr Ilitch Tchaikovsky":
    "https://upload.wikimedia.org/wikipedia/commons/d/db/Tchaikovsky%2C_head-and-shoulders_portrait.jpg",
  "Claude Debussy": "https://upload.wikimedia.org/wikipedia/commons/1/12/Claude_Debussy_portrait.jpg",
  "Nikolai Rimsky-Korsakov": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Nikolai_A._Rimsky-Korsakov.jpg",
  "Edvard Grieg": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Edvard_Grieg_by_Eilif_Peterssen.jpg",
  "Erik Satie": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Erik_Satie_by_Suzanne_Valadon.jpeg",
  "Franz Schubert": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg",
};

const SPECIAL_COVERS = {
  "bella-ciao-lacasadepapel": "/images/covers/default.png",
  hallelujah: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=500&auto=format&fit=crop&q=60",
};

const EXTRA_SONGS = [
  {
    id: "hallelujah",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    category: "Religiosos",
    isPremium: true,
    difficulty: "Fácil",
    bpm: 60,
    duration: 180,
    coverUrl: SPECIAL_COVERS.hallelujah,
    noteCount: 0,
    jsonPath: null,
    notes: [],
  },
];

function sanitizeString(value) {
  return typeof value === "string" ? repairMojibake(value) : value;
}

function getCoverUrl(id, artist, fallbackCoverUrl) {
  const infantisSvg = path.join(rootDir, "public", "images", "covers", "infantis", `${id}.svg`);
  if (fs.existsSync(infantisSvg)) {
    return `/images/covers/infantis/${id}.svg`;
  }

  const religiososSvg = path.join(rootDir, "public", "images", "covers", "religiosos", `${id}.svg`);
  if (fs.existsSync(religiososSvg)) {
    return `/images/covers/religiosos/${id}.svg`;
  }

  if (SPECIAL_COVERS[id]) {
    return SPECIAL_COVERS[id];
  }

  if (artist && COMPOSER_COVERS[artist]) {
    return COMPOSER_COVERS[artist];
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

  const title = sanitizeString(meta.title || parsed.title || parsed.id);
  const artist = sanitizeString(meta.artist || parsed.artist || "Tradicional");
  const category = sanitizeString(meta.category || parsed.category || "Outros");
  const difficulty = sanitizeString(meta.difficulty || parsed.difficulty || "Fácil");
  const coverUrl = getCoverUrl(parsed.id, artist, sanitizeString(parsed.coverUrl));
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
    jsonPath: `/songs/${fileName}`,
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
  console.log(`Catalog index rebuilt with ${entries.length} songs.`);
}

main();
