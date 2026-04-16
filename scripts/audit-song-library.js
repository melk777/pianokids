const fs = require("fs");
const path = require("path");
const songManifest = require("./song-manifest");
const songCatalogMetadata = require("./song-catalog-metadata");

const SONGS_DIR = path.resolve(__dirname, "../public/songs");
const MIDI_DIR = path.resolve(__dirname, "../public/midi");

function getSongJson(outputFile) {
  return JSON.parse(fs.readFileSync(path.join(SONGS_DIR, outputFile), "utf8"));
}

function getMidiSizes(midiFiles) {
  return midiFiles.map((fileName) => {
    const filePath = path.join(MIDI_DIR, fileName);
    return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  });
}

function hasBadTitle(title) {
  if (!title) return true;

  const normalized = title.replace(/\0/g, "").trim().toLowerCase();
  return (
    !normalized ||
    normalized === "control track" ||
    normalized === "track 0" ||
    normalized === "piano"
  );
}

function auditEntry(entry) {
  const metadata = songCatalogMetadata[entry.id] || {};
  const json = getSongJson(entry.outputFile);
  const midiSizes = getMidiSizes(entry.midiFiles);
  const hardCount = json.arrangements?.hard?.length || 0;
  const reasons = [];

  if (!metadata.allowCompactSource && midiSizes.every((size) => size > 0 && size < 1000)) {
    reasons.push("fonte MIDI muito pequena");
  }

  if (hasBadTitle(json.title)) {
    reasons.push("metadado de título ruim");
  }

  if (hardCount < 100 && json.duration > 45) {
    reasons.push("quantidade de notas baixa para a duração");
  }

  return {
    id: entry.id,
    outputFile: entry.outputFile,
    title: json.title,
    duration: json.duration,
    bpm: json.bpm,
    hard: hardCount,
    midiSizes,
    reasons,
  };
}

function main() {
  const audited = songManifest.map(auditEntry);
  const suspicious = audited.filter((entry) => entry.reasons.length > 0);

  console.log(`Auditando ${audited.length} musica(s)...`);

  if (suspicious.length === 0) {
    console.log("Nenhuma musica suspeita encontrada.");
    return;
  }

  console.log(`Encontradas ${suspicious.length} musica(s) para revisao:`);
  suspicious.forEach((entry) => {
    console.log(
      `- ${entry.outputFile}: ${entry.reasons.join(", ")} | duration=${entry.duration}s | hard=${entry.hard} | midiSizes=${entry.midiSizes.join("/")}`,
    );
  });
}

main();
