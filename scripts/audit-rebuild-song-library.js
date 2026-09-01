const fs = require("fs");
const path = require("path");
const canonicalSongs = require("../music-sources/rebuild/canonical-songs");
const pianoRange = require("../config/piano-range.json");
const { verifyFrozenMusicPilot } = require("./verify-frozen-music-pilot");
const {
  buildArrangements,
  noteSignature,
  sortNotes,
  verifySourceBundle,
} = require("./rebuild-song-utils");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "data", "songs");
const REPORT_JSON = path.join(ROOT_DIR, "docs", "song-rebuild-audit.json");
const REPORT_MD = path.join(ROOT_DIR, "docs", "song-rebuild-audit.md");

function compareExact(expected, actual) {
  const expectedSignatures = expected.map(noteSignature);
  const actualSignatures = actual.map(noteSignature);
  const expectedCounts = new Map();
  const actualCounts = new Map();
  for (const signature of expectedSignatures) expectedCounts.set(signature, (expectedCounts.get(signature) || 0) + 1);
  for (const signature of actualSignatures) actualCounts.set(signature, (actualCounts.get(signature) || 0) + 1);
  let missing = 0;
  let extra = 0;
  for (const [signature, count] of expectedCounts) missing += Math.max(0, count - (actualCounts.get(signature) || 0));
  for (const [signature, count] of actualCounts) extra += Math.max(0, count - (expectedCounts.get(signature) || 0));
  return { expected: expected.length, actual: actual.length, missing, extra, exact: missing === 0 && extra === 0 };
}

function samePitchOverlaps(notes) {
  const byPitch = new Map();
  for (const note of sortNotes(notes)) {
    const pitchNotes = byPitch.get(note.midi) || [];
    pitchNotes.push(note);
    byPitch.set(note.midi, pitchNotes);
  }
  let overlaps = 0;
  for (const pitchNotes of byPitch.values()) {
    for (let index = 0; index < pitchNotes.length - 1; index += 1) {
      if (pitchNotes[index].time + pitchNotes[index].duration > pitchNotes[index + 1].time + 0.001) overlaps += 1;
    }
  }
  return overlaps;
}

function validateArrangement(level, notes) {
  const errors = [];
  if (!Array.isArray(notes) || notes.length === 0) return [`${level}: arranjo vazio.`];
  for (const note of notes) {
    if (!Number.isInteger(note.midi) || note.midi < 0 || note.midi > 127) errors.push(`${level}: MIDI invalido.`);
    if (!Number.isFinite(note.time) || note.time < 0) errors.push(`${level}: tempo invalido.`);
    if (!Number.isFinite(note.duration) || note.duration <= 0) errors.push(`${level}: duracao invalida.`);
    if (note.hand !== "left" && note.hand !== "right") errors.push(`${level}: mao invalida.`);
    if (note.midi < pianoRange.startMidi || note.midi > pianoRange.endMidi) {
      errors.push(`${level}: nota ${note.midi} fora do teclado ${pianoRange.startNote}-${pianoRange.endNote}.`);
    }
  }
  const overlaps = samePitchOverlaps(notes);
  if (overlaps) errors.push(`${level}: ${overlaps} sobreposicao(oes) da mesma tecla.`);
  return [...new Set(errors)];
}

function auditSong(entry) {
  const errors = [];
  const warnings = [];
  try {
    verifySourceBundle(entry);
  } catch (error) {
    errors.push(error.message);
  }
  const songPath = path.join(SONGS_DIR, entry.outputFile);
  if (!fs.existsSync(songPath)) {
    return { id: entry.id, status: "blocked", errors: ["JSON reconstruido ausente."], warnings };
  }

  const song = JSON.parse(fs.readFileSync(songPath, "utf8"));
  if (song.id !== entry.id) errors.push("ID final diverge do manifesto canonico.");
  if (song.musicalSchemaVersion !== 3) errors.push("Schema musical nao e a versao 3.");
  if (song.reviewStatus !== "pending_owner_review") errors.push("Musica nao esta bloqueada para revisao do proprietario.");
  if (!song.sourceProvenance?.canonical) errors.push("Procedencia canonica nao incorporada ao JSON.");
  if (!song.sourceProvenance?.license || !song.sourceProvenance?.sourceUrl) errors.push("Licenca ou URL da fonte ausente.");

  for (const level of ["easy", "medium", "hard"]) {
    errors.push(...validateArrangement(level, song.arrangements?.[level]));
  }
  if (song.arrangements?.easy?.some((note) => note.hand !== "right")) {
    errors.push("Easy deve conter somente a mao direita.");
  }
  if (!song.arrangements?.medium?.some((note) => note.hand === "left")) {
    errors.push("Medium nao contem contorno de mao esquerda.");
  }
  if (!song.arrangements?.hard?.some((note) => note.hand === "left") || !song.arrangements?.hard?.some((note) => note.hand === "right")) {
    errors.push("Hard nao preserva as duas maos da fonte.");
  }

  let fidelity = { expected: 0, actual: song.arrangements?.hard?.length || 0, missing: 0, extra: 0, exact: false };
  try {
    const expected = buildArrangements(entry).sourceNotes;
    fidelity = compareExact(expected, song.arrangements?.hard || []);
    if (!fidelity.exact) errors.push(`Fidelidade exata falhou: missing=${fidelity.missing}, extra=${fidelity.extra}.`);
  } catch (error) {
    errors.push(`Nao foi possivel comparar com a fonte: ${error.message}`);
  }

  const hard = song.arrangements?.hard || [];
  const range = hard.length
    ? { minMidi: Math.min(...hard.map((note) => note.midi)), maxMidi: Math.max(...hard.map((note) => note.midi)) }
    : { minMidi: null, maxMidi: null };
  if (
    range.minMidi !== song.pedagogy?.keyboardRangeRequired?.minMidi ||
    range.maxMidi !== song.pedagogy?.keyboardRangeRequired?.maxMidi
  ) {
    errors.push("Faixa de teclado declarada diverge das notas canonicas.");
  }

  return {
    id: entry.id,
    title: song.title,
    status: errors.length ? "blocked" : "ready_for_owner_review",
    counts: Object.fromEntries(
      Object.entries(song.arrangements || {}).map(([level, notes]) => [level, notes.length]),
    ),
    range,
    fidelity,
    errors: [...new Set(errors)],
    warnings,
  };
}

function renderMarkdown(report) {
  const rows = report.songs.map((song) =>
    `| ${song.title} | ${song.status} | ${song.counts.easy || 0}/${song.counts.medium || 0}/${song.counts.hard || 0} | ${song.range.minMidi}-${song.range.maxMidi} | ${song.fidelity.exact ? "exata" : "falhou"} | ${song.errors.join(" ") || "-"} |`,
  ).join("\n");
  return `# Auditoria das musicas reconstruidas\n\nGerado em ${report.generatedAt}. A comparacao e feita contra os arquivos canonicos preservados por checksum. As musicas continuam pendentes de revisao auditiva do proprietario.\n\n## Resumo\n\n- Reconstruidas: ${report.summary.songs}\n- Prontas para revisao: ${report.summary.readyForOwnerReview}\n- Bloqueadas: ${report.summary.blocked}\n- Fidelidade exata: ${report.summary.exactFidelity}/${report.summary.songs}\n- Lote piloto intacto: ${report.summary.frozenPilot}/8\n\n| Musica | Estado | Easy/Medium/Hard | Faixa MIDI | Fidelidade | Erros |\n| --- | --- | ---: | --- | --- | --- |\n${rows}\n`;
}

function main() {
  const frozenPilot = verifyFrozenMusicPilot();
  const songs = canonicalSongs.map(auditSong);
  verifyFrozenMusicPilot();
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      songs: songs.length,
      readyForOwnerReview: songs.filter((song) => song.status === "ready_for_owner_review").length,
      blocked: songs.filter((song) => song.status === "blocked").length,
      exactFidelity: songs.filter((song) => song.fidelity.exact).length,
      frozenPilot: frozenPilot.length,
    },
    songs,
  };
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, renderMarkdown(report), "utf8");
  console.log(`Reconstrucao auditada: revisao=${report.summary.readyForOwnerReview}, bloqueadas=${report.summary.blocked}.`);
  console.log(`Fidelidade exata: ${report.summary.exactFidelity}/${report.summary.songs}; piloto intacto: ${report.summary.frozenPilot}/8.`);
  if (report.summary.blocked) process.exitCode = 1;
}

main();
