const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const canonicalSongs = require("../music-sources/pilot/canonical-songs");
const pianoRange = require("../config/piano-range.json");
const { chordPitchClasses, round, sortNotes } = require("./pilot-arrangement-utils");

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "music-sources", "pilot");
const SONGS_DIR = path.join(ROOT_DIR, "data", "songs");
const REPORT_JSON = path.join(ROOT_DIR, "docs", "music-pilot-audit.json");
const REPORT_MD = path.join(ROOT_DIR, "docs", "music-pilot-audit.md");
const PLAYER_MIN_MIDI = pianoRange.startMidi;
const PLAYER_MAX_MIDI = pianoRange.endMidi;

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function noteSignature(note) {
  return `${note.midi}|${round(note.time)}|${round(note.duration)}|${note.hand}`;
}

function dedupe(notes) {
  const seen = new Set();
  return sortNotes(notes).filter((note) => {
    const signature = noteSignature(note);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function expectedMidiHard(entry) {
  const midiPath = path.join(SOURCE_DIR, entry.source.midiFile);
  const midi = new Midi(fs.readFileSync(midiPath));
  const trimEndTicks = entry.trimEndTicks ?? Infinity;
  const notes = [];

  for (const mapping of entry.tracks) {
    const track = midi.tracks[mapping.index];
    for (const note of track.notes) {
      if (note.ticks >= trimEndTicks) continue;
      const durationTicks = Math.min(note.durationTicks, trimEndTicks - note.ticks);
      if (durationTicks <= 0) continue;
      notes.push({
        midi: note.midi,
        time: note.time,
        duration: note.duration * (durationTicks / note.durationTicks),
        velocity: round(note.velocity, 2),
        hand: mapping.hand,
      });
    }
  }

  const firstTime = Math.min(...notes.map((note) => note.time));
  return dedupe(
    notes.map((note) => ({
      ...note,
      time: round(note.time - firstTime),
      duration: round(note.duration),
    })),
  );
}

function expectedTranscriptionEasy(entry) {
  const secondsPerBeat = 60 / entry.bpm;
  return entry.melody.map(([midi, beat, durationBeats]) => ({
    midi,
    time: round(beat * secondsPerBeat),
    duration: round(durationBeats * secondsPerBeat),
    velocity: 0.72,
    hand: "right",
  }));
}

function compareExact(expected, actual) {
  const expectedSet = new Set(expected.map(noteSignature));
  const actualSet = new Set(actual.map(noteSignature));
  return {
    expected: expectedSet.size,
    actual: actualSet.size,
    missing: [...expectedSet].filter((signature) => !actualSet.has(signature)).length,
    extra: [...actualSet].filter((signature) => !expectedSet.has(signature)).length,
    exact: expectedSet.size === actualSet.size && [...expectedSet].every((signature) => actualSet.has(signature)),
  };
}

function validateNotes(level, notes) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(notes) || notes.length === 0) {
    errors.push(`${level}: arranjo vazio.`);
    return { errors, warnings };
  }
  let previous = null;
  const signatures = new Set();
  for (const note of notes) {
    if (!Number.isInteger(note.midi) || note.midi < 0 || note.midi > 127) errors.push(`${level}: MIDI invalido.`);
    if (!Number.isFinite(note.time) || note.time < 0) errors.push(`${level}: tempo invalido.`);
    if (!Number.isFinite(note.duration) || note.duration <= 0) errors.push(`${level}: duracao invalida.`);
    if (note.hand !== "left" && note.hand !== "right") errors.push(`${level}: mao ausente ou invalida.`);
    if (previous && (note.time < previous.time || (note.time === previous.time && note.midi < previous.midi))) {
      errors.push(`${level}: notas fora de ordem.`);
    }
    const signature = noteSignature(note);
    if (signatures.has(signature)) errors.push(`${level}: nota duplicada (${signature}).`);
    signatures.add(signature);
    previous = note;
  }
  const outside = notes.filter((note) => note.midi < PLAYER_MIN_MIDI || note.midi > PLAYER_MAX_MIDI);
  if (outside.length) warnings.push(`${level}: ${outside.length} nota(s) fora do teclado visual ${pianoRange.startNote}-${pianoRange.endNote}.`);
  return { errors: [...new Set(errors)], warnings };
}

function harmonyCompatibility(song) {
  if (!Array.isArray(song.harmonyPlan) || song.harmonyPlan.length === 0) return null;
  const melody = song.arrangements.easy;
  const secondsPerBeat = 60 / song.bpm;
  let compatible = 0;
  let total = 0;
  for (const event of song.harmonyPlan) {
    const start = event.startBeat * secondsPerBeat;
    const end = (event.startBeat + event.durationBeats) * secondsPerBeat;
    const pitchClasses = chordPitchClasses(event.symbol);
    for (const note of melody) {
      const overlap = Math.max(0, Math.min(note.time + note.duration, end) - Math.max(note.time, start));
      if (overlap <= 0) continue;
      total += overlap;
      if (pitchClasses.has(note.midi % 12)) compatible += overlap;
    }
  }
  return total ? round(compatible / total, 3) : 1;
}

function auditSource(entry, errors) {
  const source = entry.source;
  for (const field of ["kind", "title", "composer", "license", "licenseUrl", "sourceUrl", "sourceEdition", "verifiedAt"]) {
    if (!source[field]) errors.push(`Procedencia sem ${field}.`);
  }
  if (source.kind === "midi") {
    const midiPath = path.join(SOURCE_DIR, source.midiFile);
    const notationPath = path.join(SOURCE_DIR, source.notationFile);
    if (!fs.existsSync(midiPath) || sha256(midiPath) !== source.midiSha256) errors.push("MIDI canonico ausente ou alterado.");
    if (!fs.existsSync(notationPath) || sha256(notationPath) !== source.notationSha256) errors.push("Partitura canonica ausente ou alterada.");
    const midi = new Midi(fs.readFileSync(midiPath));
    for (const mapping of entry.tracks) {
      const track = midi.tracks[mapping.index];
      if (!track) errors.push(`Faixa explicita ${mapping.index} ausente.`);
      else if (track.instrument.percussion || track.instrument.family !== "piano") {
        errors.push(`Faixa ${mapping.index} nao e piano melodico.`);
      }
    }
  }
  if (source.localReferenceFile) {
    const referencePath = path.join(SOURCE_DIR, source.localReferenceFile);
    if (!fs.existsSync(referencePath) || sha256(referencePath) !== source.localReferenceSha256) {
      errors.push("Referencia local ausente ou alterada.");
    }
  }
}

function auditSong(entry) {
  const errors = [];
  const warnings = [];
  auditSource(entry, errors);
  const songPath = path.join(SONGS_DIR, entry.outputFile);
  if (!fs.existsSync(songPath)) {
    return { id: entry.id, status: "blocked", errors: ["JSON final ausente."], warnings };
  }
  const song = JSON.parse(fs.readFileSync(songPath, "utf8"));
  if (song.id !== entry.id) errors.push("ID final diverge do manifesto canonico.");
  if (song.reviewStatus !== "pending_owner_review") errors.push("Musica nao esta protegida como pendente de revisao.");
  if (!song.sourceProvenance?.canonical) errors.push("Procedencia canonica nao incorporada ao JSON final.");

  for (const level of ["easy", "medium", "hard"]) {
    const validation = validateNotes(level, song.arrangements?.[level]);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }
  if (song.arrangements.easy.some((note) => note.hand !== "right")) errors.push("Easy contem notas que nao sao da mao direita.");

  const expected = entry.source.kind === "midi" ? expectedMidiHard(entry) : expectedTranscriptionEasy(entry);
  const actual = entry.source.kind === "midi" ? song.arrangements.hard : song.arrangements.easy;
  const fidelity = compareExact(expected, actual);
  if (!fidelity.exact) errors.push(`Fidelidade exata falhou: missing=${fidelity.missing}, extra=${fidelity.extra}.`);

  if (entry.easyStrategy !== "harmonic-outline") {
    const easySet = new Set(song.arrangements.easy.map(noteSignature));
    const hardSet = new Set(song.arrangements.hard.map(noteSignature));
    const melodyMissingFromHard = [...easySet].filter((signature) => !hardSet.has(signature)).length;
    if (melodyMissingFromHard) errors.push(`${melodyMissingFromHard} nota(s) da melodia nao aparecem no hard.`);
  }

  const compatibility = harmonyCompatibility(song);
  if (compatibility !== null && compatibility < 0.72) warnings.push(`Compatibilidade melodia/acorde baixa: ${compatibility}.`);

  return {
    id: entry.id,
    title: song.title,
    sourceKind: entry.source.kind,
    status: errors.length ? "blocked" : "ready_for_owner_review",
    counts: Object.fromEntries(Object.entries(song.arrangements).map(([level, notes]) => [level, notes.length])),
    range: {
      min: Math.min(...song.arrangements.hard.map((note) => note.midi)),
      max: Math.max(...song.arrangements.hard.map((note) => note.midi)),
    },
    fidelity,
    harmonyCompatibility: compatibility,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}

function renderMarkdown(report) {
  const rows = report.songs
    .map((song) => `| ${song.title} | ${song.sourceKind} | ${song.status} | ${song.counts.easy}/${song.counts.medium}/${song.counts.hard} | ${song.range.min}-${song.range.max} | ${song.fidelity.exact ? "exata" : "falhou"} | ${song.harmonyCompatibility ?? "fonte"} | ${song.warnings.join(" ") || "-"} |`)
    .join("\n");
  const blocked = report.songs.filter((song) => song.status === "blocked");

  return `# Lote piloto musical do Pianify\n\nGerado em ${report.generatedAt}. Este relatorio compara o resultado com fontes canonicas independentes do JSON final. Nenhuma musica deste lote deve ser publicada antes da aprovacao auditiva do proprietario.\n\n## Resumo\n\n- Musicas: ${report.summary.songs}\n- Prontas para revisao do proprietario: ${report.summary.readyForOwnerReview}\n- Bloqueadas: ${report.summary.blocked}\n- Avisos: ${report.summary.warnings}\n- Fidelidade exata de fonte/transcricao: ${report.summary.exactFidelity}/${report.summary.songs}\n\n## Resultado\n\n| Musica | Fonte | Estado | Easy/Medium/Hard | Faixa MIDI | Fidelidade | Compatibilidade harmonica | Avisos |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${rows}\n\n## Revisao auditiva obrigatoria\n\nPara cada musica, ouvir os tres MIDIs em \`output/music-review\` e conferir: melodia reconhecivel; acordes consonantes; pulsacao natural; maos confortaveis; final completo. Registrar aprovacao ou ajustes antes de trocar \`reviewStatus\` para publicado.\n\n${blocked.length ? `## Bloqueios\n\n${blocked.map((song) => `- ${song.id}: ${song.errors.join(" ")}`).join("\n")}\n` : "## Bloqueios\n\nNenhum bloqueio automatico.\n"}`;
}

function main() {
  const songs = canonicalSongs.map(auditSong);
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      songs: songs.length,
      readyForOwnerReview: songs.filter((song) => song.status === "ready_for_owner_review").length,
      blocked: songs.filter((song) => song.status === "blocked").length,
      warnings: songs.reduce((total, song) => total + song.warnings.length, 0),
      exactFidelity: songs.filter((song) => song.fidelity?.exact).length,
    },
    songs,
  };
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, renderMarkdown(report), "utf8");
  console.log(`Piloto musical: revisao=${report.summary.readyForOwnerReview}, bloqueadas=${report.summary.blocked}, avisos=${report.summary.warnings}.`);
  console.log(`Fidelidade exata: ${report.summary.exactFidelity}/${report.summary.songs}.`);
  if (report.summary.blocked) process.exitCode = 1;
}

main();
