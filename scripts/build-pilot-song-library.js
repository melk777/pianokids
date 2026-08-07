const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const canonicalSongs = require("../music-sources/pilot/canonical-songs");
const pianoRange = require("../config/piano-range.json");
const songCatalogMetadata = require("./song-catalog-metadata");
const {
  buildTranscriptionArrangements,
  round,
  sortNotes,
  stripInternalFields,
} = require("./pilot-arrangement-utils");

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "music-sources", "pilot");
const SONGS_DIR = path.join(ROOT_DIR, "public", "songs");
const REVIEW_DIR = path.join(ROOT_DIR, "output", "music-review");

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function assertChecksum(relativePath, expected) {
  const filePath = path.join(SOURCE_DIR, relativePath);
  if (!fs.existsSync(filePath)) throw new Error(`Fonte ausente: ${relativePath}`);
  const actual = sha256(filePath);
  if (actual !== expected) {
    throw new Error(`Checksum divergente em ${relativePath}. Esperado ${expected}; atual ${actual}.`);
  }
  return filePath;
}

function validateMidiTracks(entry, midi) {
  for (const mapping of entry.tracks) {
    const track = midi.tracks[mapping.index];
    if (!track) throw new Error(`${entry.id}: faixa MIDI ${mapping.index} nao existe.`);
    if (track.instrument.percussion) throw new Error(`${entry.id}: faixa ${mapping.index} e percussiva.`);
    if (track.instrument.family !== "piano") {
      throw new Error(`${entry.id}: faixa ${mapping.index} nao e piano (${track.instrument.name}).`);
    }
    if (!track.notes.length) throw new Error(`${entry.id}: faixa ${mapping.index} nao contem notas.`);
  }
}

function loadMidiNotes(entry) {
  const midiPath = assertChecksum(entry.source.midiFile, entry.source.midiSha256);
  assertChecksum(entry.source.notationFile, entry.source.notationSha256);
  const midi = new Midi(fs.readFileSync(midiPath));
  validateMidiTracks(entry, midi);
  const selected = [];
  const trimEndTicks = entry.trimEndTicks ?? Infinity;

  for (const mapping of entry.tracks) {
    const track = midi.tracks[mapping.index];
    for (const note of track.notes) {
      if (note.ticks >= trimEndTicks) continue;
      const durationTicks = Math.min(note.durationTicks, trimEndTicks - note.ticks);
      if (durationTicks <= 0) continue;
      selected.push({
        midi: note.midi,
        time: note.time,
        duration: note.duration * (durationTicks / note.durationTicks),
        velocity: note.velocity,
        hand: mapping.hand,
        role: mapping.role,
        trackIndex: mapping.index,
        ticks: note.ticks,
        durationTicks,
      });
    }
  }

  selected.sort((left, right) => left.time - right.time || left.midi - right.midi);
  const firstTime = selected[0]?.time ?? 0;
  const firstTick = Math.min(...selected.map((note) => note.ticks));
  const normalized = selected.map((note) => ({
    ...note,
    time: round(note.time - firstTime),
    duration: round(note.duration),
    velocity: round(note.velocity, 2),
    beat: (note.ticks - firstTick) / midi.header.ppq,
    durationBeats: note.durationTicks / midi.header.ppq,
  }));

  return {
    midi,
    notes: normalized,
    bpm: Math.round(midi.header.tempos[0]?.bpm || 120),
    timeSignature: midi.header.timeSignatures[0]?.timeSignature || [4, 4],
  };
}

function groupHighestByTick(notes) {
  const groups = [];
  for (const note of [...notes].sort((left, right) => left.ticks - right.ticks || right.midi - left.midi)) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(note.ticks - previous.ticks) > 2) {
      groups.push({ ticks: note.ticks, notes: [note] });
    } else {
      previous.notes.push(note);
    }
  }
  return groups.map((group) => [...group.notes].sort((left, right) => right.midi - left.midi)[0]);
}

function outline(notes, windowBeats, bpm, choose) {
  const secondsPerBeat = 60 / bpm;
  const lastBeat = Math.max(...notes.map((note) => note.beat + note.durationBeats));
  const result = [];
  for (let startBeat = 0; startBeat < lastBeat; startBeat += windowBeats) {
    const candidates = notes.filter((note) => note.beat >= startBeat && note.beat < startBeat + windowBeats);
    if (!candidates.length) continue;
    const selected = [...candidates].sort((left, right) =>
      choose === "lowest" ? left.midi - right.midi : right.midi - left.midi,
    )[0];
    result.push({
      midi: selected.midi,
      time: round(startBeat * secondsPerBeat),
      duration: round(Math.min(windowBeats, lastBeat - startBeat) * secondsPerBeat * 0.92),
      velocity: choose === "lowest" ? 0.54 : 0.66,
      hand: choose === "lowest" ? "left" : "right",
      beat: startBeat,
      durationBeats: windowBeats,
    });
  }
  return result;
}

function buildMidiArrangements(entry) {
  const loaded = loadMidiNotes(entry);
  const sourceMelodyNotes = loaded.notes.filter((note) => entry.melodyTrackIndexes.includes(note.trackIndex));
  const melody = groupHighestByTick(sourceMelodyNotes).map((note) => ({ ...note, hand: "right" }));
  const right = loaded.notes.filter((note) => note.hand === "right");
  const left = loaded.notes.filter((note) => note.hand === "left");
  const bass = outline(left, entry.bassOutlineBeats || 2, loaded.bpm, "lowest");
  const easy =
    entry.easyStrategy === "harmonic-outline"
      ? outline(right, entry.outlineBeats || 1, loaded.bpm, "highest")
      : melody;
  const medium =
    entry.mediumStrategy === "upper-with-bass-outline"
      ? [...right, ...bass]
      : [...melody, ...bass];

  return {
    bpm: loaded.bpm,
    timeSignature: loaded.timeSignature,
    hardSourceNotes: loaded.notes,
    harmony: null,
    arrangements: {
      easy: stripInternalFields(easy),
      medium: stripInternalFields(medium),
      hard: stripInternalFields(loaded.notes),
    },
  };
}

function publicProvenance(entry) {
  const source = entry.source;
  return {
    canonical: true,
    kind: source.kind,
    title: source.title,
    composer: source.composer,
    edition: source.sourceEdition,
    sourceUrl: source.sourceUrl,
    license: source.license,
    licenseUrl: source.licenseUrl,
    verifiedAt: source.verifiedAt,
    transcriber: source.transcriber || null,
    transpositionSemitones: source.transpositionSemitones || 0,
  };
}

function buildSong(entry) {
  const metadata = songCatalogMetadata[entry.id] || {};
  const built = entry.source.kind === "midi" ? buildMidiArrangements(entry) : buildTranscriptionArrangements(entry);
  const hard = sortNotes(built.arrangements.hard);
  const duration = Math.ceil(Math.max(...hard.map((note) => note.time + note.duration)) + 1);
  const requiredMidi = hard.map((note) => note.midi);

  return {
    id: entry.id,
    title: metadata.title || entry.source.title,
    artist: metadata.artist || entry.source.composer,
    difficulty: metadata.difficulty || "Medio",
    bpm: built.bpm,
    duration,
    category: metadata.category || "A revisar",
    isPremium: metadata.isPremium ?? true,
    coverUrl: "/images/covers/placeholder.png",
    musicalSchemaVersion: 2,
    reviewStatus: "pending_owner_review",
    sourceProvenance: publicProvenance(entry),
    pedagogy: {
      easyStrategy: entry.easyStrategy || "melody",
      mediumStrategy: entry.mediumStrategy || "melody-with-bass-outline",
      hardStrategy: "canonical-source",
      keyboardRangeRequired: {
        minMidi: Math.min(...requiredMidi),
        maxMidi: Math.max(...requiredMidi),
      },
      currentPlayerRange: { minMidi: pianoRange.startMidi, maxMidi: pianoRange.endMidi },
    },
    harmonyPlan: built.harmony,
    notes: hard,
    arrangements: built.arrangements,
    notes1Hand: built.arrangements.easy,
    notes2Hands: hard,
  };
}

function writeReviewMidi(song, level) {
  const midi = new Midi();
  midi.name = `${song.title} - ${level}`;
  midi.header.setTempo(song.bpm);
  for (const hand of ["right", "left"]) {
    const notes = song.arrangements[level].filter((note) => note.hand === hand);
    if (!notes.length) continue;
    const track = midi.addTrack();
    track.name = hand === "right" ? "Right hand" : "Left hand";
    track.instrument.number = 0;
    for (const note of notes) {
      track.addNote({ midi: note.midi, time: note.time, duration: note.duration, velocity: note.velocity ?? 0.7 });
    }
  }
  fs.writeFileSync(path.join(REVIEW_DIR, `${song.id}-${level}.mid`), Buffer.from(midi.toArray()));
}

function main() {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  const summary = [];

  for (const entry of canonicalSongs) {
    const song = buildSong(entry);
    fs.writeFileSync(path.join(SONGS_DIR, entry.outputFile), `${JSON.stringify(song, null, 2)}\n`, "utf8");
    for (const level of ["easy", "medium", "hard"]) writeReviewMidi(song, level);
    summary.push({
      id: song.id,
      outputFile: entry.outputFile,
      duration: song.duration,
      counts: Object.fromEntries(Object.entries(song.arrangements).map(([level, notes]) => [level, notes.length])),
    });
  }

  fs.writeFileSync(path.join(REVIEW_DIR, "index.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    path.join(REVIEW_DIR, "README.md"),
    `# Revisao auditiva do lote piloto\n\nEstes arquivos sao locais e ainda nao foram publicados. Para cada musica, ouca na ordem \`easy\`, \`medium\` e \`hard\`. Confira se a melodia e imediatamente reconhecivel, se o acompanhamento permanece consonante, se a pulsacao e natural e se as duas maos parecem confortaveis.\n\n${summary
      .map((item) => `- ${item.id}: ${item.id}-easy.mid, ${item.id}-medium.mid, ${item.id}-hard.mid`)
      .join("\n")}\n`,
    "utf8",
  );
  console.log(`Lote piloto gerado: ${summary.length} musicas, sem alterar as outras ${90 - summary.length}.`);
  for (const item of summary) {
    console.log(`${item.id}: easy=${item.counts.easy}, medium=${item.counts.medium}, hard=${item.counts.hard}, ${item.duration}s`);
  }
  console.log(`MIDIs de revisao: ${path.relative(ROOT_DIR, REVIEW_DIR)}`);
}

main();
