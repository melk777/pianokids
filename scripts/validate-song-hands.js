const fs = require("fs");
const path = require("path");
const { normalizeSongHands, sanitizeSingleHandArrangements, validateSongHands } = require("./song-hand-utils");

const SONGS_DIR = path.resolve(__dirname, "../public/songs");

function getSongFiles() {
  if (!fs.existsSync(SONGS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SONGS_DIR)
    .filter((fileName) => fileName.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
}

function main() {
  const files = getSongFiles();

  if (files.length === 0) {
    console.log("Nenhum JSON encontrado em public/songs.");
    return;
  }

  let warningCount = 0;

  console.log(`Auditando ${files.length} arquivo(s) JSON em public/songs...`);

  for (const fileName of files) {
    const filePath = path.join(SONGS_DIR, fileName);
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const normalizedSong = normalizeSongHands(parsed);
    const { warnings } = validateSongHands(normalizedSong);
    const repairedSong = sanitizeSingleHandArrangements(normalizedSong);

    fs.writeFileSync(filePath, `${JSON.stringify(repairedSong, null, 2)}\n`);

    if (warnings.length > 0) {
      warningCount += warnings.length;
      warnings.forEach((warning) => {
        console.warn(`WARN ${fileName}: ${warning.message} Corrigido automaticamente.`);
      });
    }
  }

  if (warningCount === 0) {
    console.log("Auditoria concluida sem alertas de mao.");
    return;
  }

  console.log(`Auditoria concluida com ${warningCount} alerta(s).`);
  process.exitCode = 1;
}

main();
