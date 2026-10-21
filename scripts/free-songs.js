// The free catalog: up to 3 songs per genre. Every other song is premium (paid plan or trial).
// This list is the only source of truth for `isPremium` in public/song-catalog-index.json;
// the per-song flags in data/songs and song-catalog-metadata.js are ignored by the index build.
// Every song used by the learning path (src/lib/learningPath.ts) must stay in this list.
const FREE_SONGS_BY_CATEGORY = {
  Infantis: ["parabens-pra-voce", "twinkle-twinkle", "ciranda-cirandinha"],
  "Clássicos": ["fur-elise", "ode-to-joy", "minueto-em-sol-maior"],
  Religiosos: ["amazing-grace", "noite-feliz", "alegria-ao-mundo"],
  "Intro de Filmes": ["in-the-hall-of-the-mountain-king", "gymnopedie-no-1", "swan-lake-napolitan-dance"],
  Tradicionais: ["bella-ciao-lacasadepapel"],
};

const FREE_SONG_IDS = new Set(Object.values(FREE_SONGS_BY_CATEGORY).flat());

module.exports = { FREE_SONGS_BY_CATEGORY, FREE_SONG_IDS };
