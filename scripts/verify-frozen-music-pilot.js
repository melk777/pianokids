const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCK_PATH = path.join(ROOT_DIR, "music-sources", "rebuild", "frozen-pilot-lock.json");
const SONGS_DIR = path.join(ROOT_DIR, "data", "songs");

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function verifyFrozenMusicPilot() {
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
  const failures = [];

  for (const song of lock.songs) {
    const filePath = path.join(SONGS_DIR, song.file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${song.id}: arquivo ausente (${song.file}).`);
      continue;
    }
    const actual = sha256(filePath);
    if (actual !== song.sha256) failures.push(`${song.id}: checksum divergente.`);
  }

  if (failures.length) {
    throw new Error(`O lote piloto congelado foi alterado:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  }

  return lock.songs.map((song) => song.id);
}

if (require.main === module) {
  const ids = verifyFrozenMusicPilot();
  console.log(`Lote piloto protegido: ${ids.length}/8 musicas intactas.`);
}

module.exports = { verifyFrozenMusicPilot };
