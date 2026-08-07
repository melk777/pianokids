const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const canonicalSongs = require("../music-sources/rebuild/canonical-songs");
const pianoRange = require("../config/piano-range.json");
const songCatalogMetadata = require("./song-catalog-metadata");
const { verifyFrozenMusicPilot } = require("./verify-frozen-music-pilot");
const { buildArrangements } = require("./rebuild-song-utils");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public", "songs");
const REVIEW_DIR = path.join(ROOT_DIR, "output", "music-review-rebuild");

function publicProvenance(entry) {
  const source = entry.source;
  const provenance = {
    canonical: true,
    kind: source.kind,
    title: source.title,
    composer: source.composer,
    edition: source.sourceEdition,
    sourceUrl: source.sourceUrl,
    license: source.license,
    licenseUrl: source.licenseUrl,
    verifiedAt: source.verifiedAt,
    files: {
      midi: { path: source.midiFile, sha256: source.midiSha256 },
      notation: { path: source.notationFile, sha256: source.notationSha256 },
    },
    normalization: [
      "The first sounding note is normalized to 0 seconds.",
      "Exact simultaneous duplicate pitches are reduced to one note.",
      "Repeated pitches are separated by a 20 ms release gap when the source sustain overlaps the next attack.",
      "No pitch is transposed and no source note is removed to fit the visual keyboard.",
    ],
  };
  if (source.scoreFile && source.scoreSha256) {
    provenance.files.score = { path: source.scoreFile, sha256: source.scoreSha256 };
  }
  if (source.externalFacsimile) {
    provenance.sourceReference = source.externalFacsimile;
  }
  if (source.crossCheckReferences) {
    provenance.crossCheckReferences = source.crossCheckReferences;
  }
  if (source.attribution) provenance.attribution = source.attribution;
  if (source.kind === "musicxml-derived-midi") {
    provenance.derivation = {
      method: "deterministic_musicxml_to_midi",
      script: source.derivationScript,
      bpm: source.derivationBpm,
      upstreamMidi: {
        path: source.upstreamMidiFile,
        sha256: source.upstreamMidiSha256,
        status: "rejected_incomplete_upper_staff",
      },
    };
  }
  if (source.kind === "notation-json-derived-midi") {
    provenance.derivation = {
      method: "deterministic_curated_notation_json_to_midi",
      script: source.derivationScript,
      scorePage: source.scorePage,
      melody: source.derivationMelody ||
        "manual transcription of the public-domain historical staff, preserving printed pitch and rhythm",
      harmony: source.editorialHarmony,
      facsimile: source.facsimileFile
        ? { path: source.facsimileFile, sha256: source.facsimileSha256 }
        : undefined,
    };
  }
  return provenance;
}

function existingCoverUrl(outputFile) {
  const songPath = path.join(SONGS_DIR, outputFile);
  if (!fs.existsSync(songPath)) return "/images/covers/placeholder.png";
  try {
    return JSON.parse(fs.readFileSync(songPath, "utf8")).coverUrl || "/images/covers/placeholder.png";
  } catch {
    return "/images/covers/placeholder.png";
  }
}

function buildSong(entry) {
  const metadata = songCatalogMetadata[entry.id] || {};
  const built = buildArrangements(entry);
  const hard = built.arrangements.hard;
  const allArrangementNotes = Object.values(built.arrangements).flat();
  const minMidi = Math.min(...hard.map((note) => note.midi));
  const maxMidi = Math.max(...hard.map((note) => note.midi));
  const duration = Math.ceil(Math.max(...allArrangementNotes.map((note) => note.time + note.duration)) + 1);

  return {
    id: entry.id,
    title: metadata.title || entry.source.title,
    artist: metadata.artist || entry.source.composer,
    difficulty: metadata.difficulty || "Medio",
    bpm: built.bpm,
    timeSignature: built.timeSignature,
    duration,
    category: metadata.category || "Classicos",
    isPremium: metadata.isPremium ?? true,
    coverUrl: existingCoverUrl(entry.outputFile),
    musicalSchemaVersion: 3,
    reviewStatus: "pending_owner_review",
    sourceProvenance: publicProvenance(entry),
    pedagogy: {
      easyStrategy: entry.easyStrategy,
      mediumStrategy: entry.mediumStrategy,
      hardStrategy: "canonical-source",
      keyboardRangeRequired: { minMidi, maxMidi },
      currentPlayerRange: { minMidi: pianoRange.startMidi, maxMidi: pianoRange.endMidi },
    },
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
      track.addNote({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity ?? 0.7,
      });
    }
  }
  fs.writeFileSync(path.join(REVIEW_DIR, `${song.id}-${level}.mid`), Buffer.from(midi.toArray()));
}

function main() {
  verifyFrozenMusicPilot();
  fs.mkdirSync(SONGS_DIR, { recursive: true });
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  const summary = [];

  for (const entry of canonicalSongs) {
    const song = buildSong(entry);
    fs.writeFileSync(path.join(SONGS_DIR, entry.outputFile), `${JSON.stringify(song, null, 2)}\n`, "utf8");
    for (const level of ["easy", "medium", "hard"]) writeReviewMidi(song, level);
    summary.push({
      id: song.id,
      title: song.title,
      outputFile: entry.outputFile,
      reviewStatus: song.reviewStatus,
      duration: song.duration,
      range: song.pedagogy.keyboardRangeRequired,
      counts: Object.fromEntries(
        Object.entries(song.arrangements).map(([level, notes]) => [level, notes.length]),
      ),
    });
  }

  fs.writeFileSync(path.join(REVIEW_DIR, "index.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    path.join(REVIEW_DIR, "README.md"),
    `# Revisao auditiva das musicas reconstruidas\n\nNenhum arquivo desta pasta representa aprovacao para publicacao. Para cada musica, ouvir easy, medium e hard e registrar: fidelidade melodica; harmonia; pulsacao; separacao de maos; conforto; final completo.\n\n${summary
      .map((item) => `- ${item.id}: ${item.id}-easy.mid, ${item.id}-medium.mid, ${item.id}-hard.mid`)
      .join("\n")}\n`,
    "utf8",
  );

  verifyFrozenMusicPilot();
  console.log(`Reconstrucao gerada: ${summary.length} musica(s); 8/8 musicas piloto permaneceram intactas.`);
  for (const item of summary) {
    console.log(
      `${item.id}: easy=${item.counts.easy}, medium=${item.counts.medium}, hard=${item.counts.hard}, range=${item.range.minMidi}-${item.range.maxMidi}.`,
    );
  }
}

main();
