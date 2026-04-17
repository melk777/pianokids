const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const songManifest = require("./song-manifest");
const songCatalogMetadata = require("./song-catalog-metadata");
const { normalizeSongHands, sanitizeSingleHandArrangements, validateSongHands } = require("./song-hand-utils");

const MIDI_DIR = path.resolve(__dirname, "../public/midi");
const SONGS_DIR = path.resolve(__dirname, "../public/songs");
const GROUP_WINDOW_SECONDS = 0.09;
const CLASSICAL_IDS = new Set([
  "ode-to-joy",
  "fur-elise",
  "minueto-em-sol-maior",
  "moonlight-sonata",
  "bach-prelude",
  "turkish-march",
  "minute-waltz",
  "nocturne-op9",
  "ballade-4chopin",
  "chopin-fantaisie-impromptuchopin",
  "das-wohltemperierte-clavier-ii-praeludium-iijsbach",
  "doumkatchaikosvky",
  "etude-a-mollchopin",
  "fantasy-in-d-minormozart",
  "fugue-in-e-flat-major-kv-153375fmozart",
  "fugue-sur-le-nom-de-bachrimsky-korsakov",
  "fuguefragmentmozart",
  "gigue-in-g-majormozart",
  "march-of-the-wooden-soldierstchaikovsky",
  "marche-funebre-kv-453amozart",
  "morning-prayertchaikovsky",
  "notteegiornomozart",
  "old-french-songtchaikosvky",
  "piano-sonata-in-c-major-kv-309-1st-part-mozart",
  "prelude-op-28-no-4-suffocation-chopin",
  "preludio-chopin",
  "preludio-n-15-chopin",
  "preludio-n-20-chopin",
  "preludio-n-6-chopin",
  "preludio-numero7chopin",
  "premiere-arabesquedebussy",
  "sonata-2bmoll-chopin",
  "sonata-in-c-major-fragment-mozart",
  "suite-bergamasque-clair-de-lunedebussy",
  "the-seasons-augusttchaikovsky",
  "the-seasons-februarytchaikovsky",
  "the-seasons-januarytchaikovsky",
  "trois-nouvelles-etudes-no-1-f-minorchopin",
]);
const FILM_INTRO_IDS = new Set([
  "toccata-and-fugue-d-minor",
  "in-the-hall-of-the-mountain-king",
  "gymnopedie-no-1",
  "ave-maria-schubert",
  "swan-lake-napolitan-dance",
]);

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function humanize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isUnusableSourceTitle(value) {
  if (!value) return true;

  const normalized = value.replace(/\0/g, "").trim().toLowerCase();
  if (!normalized) return true;

  return (
    normalized === "control track" ||
    normalized === "track 0" ||
    normalized === "piano" ||
    normalized === "piano0" ||
    normalized.includes("control track") ||
    normalized.includes("left hand") ||
    normalized.includes("right hand")
  );
}

function inferHand(track, note) {
  if (track.name) {
    const trackName = track.name.toLowerCase();
    if (trackName.includes("left")) return "left";
    if (trackName.includes("right")) return "right";
  }

  return note.midi < 60 ? "left" : "right";
}

function normalizeNotes(midi) {
  const bpm = Math.round(midi.header.tempos[0]?.bpm || 120);
  const beatSeconds = 60 / bpm;
  const quantizeStep = beatSeconds / 4;
  const notes = [];

  midi.tracks.forEach((track, trackIndex) => {
    track.notes.forEach((note) => {
      const hand = inferHand(track, note);
      const quantizedTime = Math.round(note.time / quantizeStep) * quantizeStep;
      const quantizedDuration = Math.max(quantizeStep / 2, Math.round(note.duration / quantizeStep) * quantizeStep);

      notes.push({
        midi: note.midi,
        time: round(quantizedTime),
        duration: round(quantizedDuration),
        velocity: round(note.velocity, 2),
        hand,
        trackIndex,
      });
    });
  });

  notes.sort((a, b) => a.time - b.time || a.midi - b.midi);

  const deduped = [];
  for (const note of notes) {
    const previous = deduped[deduped.length - 1];
    const isDuplicate =
      previous &&
      previous.midi === note.midi &&
      Math.abs(previous.time - note.time) < 0.01 &&
      Math.abs(previous.duration - note.duration) < 0.02;

    if (!isDuplicate) {
      deduped.push(note);
    }
  }

  return {
    notes: deduped,
    bpm,
    duration: Math.round(midi.duration),
    title: midi.name || "",
  };
}

function groupNotesByTime(notes) {
  const groups = [];

  for (const note of notes) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(previous.time - note.time) > GROUP_WINDOW_SECONDS) {
      groups.push({ time: note.time, notes: [note] });
    } else {
      previous.notes.push(note);
    }
  }

  return groups;
}

function collapseRapidRepeats(notes, minGap) {
  const latestByMidi = new Map();
  return notes.filter((note) => {
    const previousTime = latestByMidi.get(note.midi);
    if (typeof previousTime === "number" && note.time - previousTime < minGap) {
      return false;
    }

    latestByMidi.set(note.midi, note.time);
    return true;
  });
}

function stripTrackIndex(notes) {
  return notes.map(({ trackIndex, ...note }) => note);
}

function simplifyMedium(notes, bpm) {
  const beatSeconds = 60 / bpm;
  const groups = groupNotesByTime(notes);
  const simplified = [];

  for (const group of groups) {
    const filtered = group.notes.filter((note) => note.duration >= beatSeconds / 8);
    if (filtered.length === 0) continue;

    const sorted = [...filtered].sort((a, b) => a.midi - b.midi);
    const bass = sorted[0];
    const melody = sorted[sorted.length - 1];
    const middle = sorted.length > 2 ? sorted[Math.floor(sorted.length / 2)] : null;

    const chosen = [melody];
    if (bass !== melody) chosen.push(bass);
    if (middle && middle !== bass && middle !== melody) chosen.push(middle);

    chosen
      .sort((a, b) => a.midi - b.midi)
      .forEach((note) => simplified.push({ ...note, duration: round(Math.max(note.duration, beatSeconds / 4)) }));
  }

  return stripTrackIndex(collapseRapidRepeats(simplified, beatSeconds / 6));
}

function simplifyEasy(notes, bpm, options = {}) {
  const beatSeconds = 60 / bpm;
  const groups = groupNotesByTime(notes);
  const simplified = [];
  const strictRightHand = options.strictRightHand ?? false;
  const minimumDuration = options.minimumDuration ?? (strictRightHand ? beatSeconds / 5 : beatSeconds / 8);
  const repeatGap = options.repeatGap ?? (strictRightHand ? beatSeconds / 1.75 : beatSeconds / 4);
  const minimumMidi = options.minimumMidi ?? 60;
  const minimumAcceptedGap = options.minimumAcceptedGap ?? (strictRightHand ? beatSeconds / 2 : 0);
  const forcedDuration = options.forcedDuration ?? (strictRightHand ? beatSeconds / 2 : beatSeconds / 3);
  let lastAcceptedTime = -Infinity;

  for (const group of groups) {
    const usable = group.notes.filter((note) => note.duration >= minimumDuration);
    if (usable.length === 0) continue;

    const rightHand = usable.filter((note) => note.hand !== "left" && note.midi >= minimumMidi);
    const source = strictRightHand ? rightHand : rightHand.length > 0 ? rightHand : usable;
    if (source.length === 0) continue;
    const melody = [...source].sort((a, b) => b.midi - a.midi)[0];

    if (minimumAcceptedGap > 0 && melody.time - lastAcceptedTime < minimumAcceptedGap) {
      continue;
    }

    simplified.push({
      ...melody,
      duration: round(Math.max(melody.duration, forcedDuration)),
      hand: "right",
    });
    lastAcceptedTime = melody.time;
  }

  return stripTrackIndex(collapseRapidRepeats(simplified, repeatGap));
}

function readMidiFile(fileName) {
  const filePath = path.join(MIDI_DIR, fileName);
  const buffer = fs.readFileSync(filePath);
  const midi = new Midi(buffer);
  return normalizeNotes(midi);
}

function buildSongJson(entry) {
  const metadata = songCatalogMetadata[entry.id] || {};
  const sources = entry.midiFiles.map((fileName) => ({
    fileName,
    ...readMidiFile(fileName),
  }));

  sources.sort((left, right) => left.notes.length - right.notes.length);

  const easySource = sources[0];
  const hardSource = sources[sources.length - 1];
  const middleSource = sources.length > 2 ? sources[Math.floor(sources.length / 2)] : null;
  const strictRightHandEasy = CLASSICAL_IDS.has(entry.id);
  const cinematicEasy = FILM_INTRO_IDS.has(entry.id);
  const easyOptions = cinematicEasy
    ? {
        strictRightHand: true,
        minimumDuration: hardSource.bpm >= 120 ? 60 / hardSource.bpm / 3 : 60 / hardSource.bpm / 4,
        minimumAcceptedGap: 60 / hardSource.bpm,
        repeatGap: 60 / hardSource.bpm / 1.2,
        minimumMidi: 62,
        forcedDuration: 60 / hardSource.bpm / 1.5,
      }
    : { strictRightHand: true };

  const easy =
    strictRightHandEasy || cinematicEasy
      ? simplifyEasy(hardSource.notes, hardSource.bpm, easyOptions)
      : sources.length > 1
        ? stripTrackIndex(easySource.notes)
        : simplifyEasy(hardSource.notes, hardSource.bpm);
  const medium = middleSource ? stripTrackIndex(middleSource.notes) : simplifyMedium(hardSource.notes, hardSource.bpm);
  const hard = stripTrackIndex(hardSource.notes);
  const sourceTitle = isUnusableSourceTitle(hardSource.title) ? "" : hardSource.title.trim();

  return {
    id: entry.id,
    title: metadata.title || entry.title || sourceTitle || humanize(entry.id),
    artist: metadata.artist || entry.artist || "MIDI Source",
    difficulty: metadata.difficulty || "M�dio",
    bpm: hardSource.bpm,
    duration: Math.max(...sources.map((source) => source.duration)),
    category: metadata.category || entry.category || "A revisar",
    isPremium:
      typeof metadata.isPremium === "boolean"
        ? metadata.isPremium
        : typeof entry.isPremium === "boolean"
          ? entry.isPremium
          : true,
    coverUrl: entry.coverUrl || "/images/covers/placeholder.png",
    notes: hard,
    arrangements: {
      easy,
      medium,
      hard,
    },
    notes1Hand: easy,
    notes2Hands: hard,
  };
}

function ensureSongsDir() {
  if (!fs.existsSync(SONGS_DIR)) {
    fs.mkdirSync(SONGS_DIR, { recursive: true });
  }
}

function cleanSongsDir() {
  ensureSongsDir();

  fs.readdirSync(SONGS_DIR)
    .filter((fileName) => fileName.toLowerCase().endsWith(".json"))
    .forEach((fileName) => {
      fs.unlinkSync(path.join(SONGS_DIR, fileName));
    });
}

function writeSongJson(entry) {
  const rawSongJson = normalizeSongHands(buildSongJson(entry));
  const outputPath = path.join(SONGS_DIR, entry.outputFile);
  const { warnings } = validateSongHands(rawSongJson);
  const songJson = sanitizeSingleHandArrangements(rawSongJson);

  fs.writeFileSync(outputPath, `${JSON.stringify(songJson, null, 2)}\n`);

  warnings.forEach((warning) => {
    console.warn(`WARN ${entry.outputFile}: ${warning.message} Corrigido automaticamente.`);
  });

  return {
    id: songJson.id,
    outputFile: entry.outputFile,
    counts: {
      easy: songJson.arrangements.easy.length,
      medium: songJson.arrangements.medium.length,
      hard: songJson.arrangements.hard.length,
    },
    warningCount: warnings.length,
  };
}

function main() {
  cleanSongsDir();
  let warningCount = 0;

  console.log(`Reconstruindo ${songManifest.length} musica(s) em public/songs...`);

  for (const entry of songManifest) {
    const result = writeSongJson(entry);
    warningCount += result.warningCount;
    console.log(
      `OK ${result.outputFile}: easy=${result.counts.easy}, medium=${result.counts.medium}, hard=${result.counts.hard}`,
    );
  }

  if (warningCount > 0) {
    console.warn(`Pipeline concluido com ${warningCount} alerta(s) de mao para revisao.`);
  }

  console.log("Biblioteca JSON regenerada com sucesso.");
}

main();

