const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

const MIDI_DIR = path.resolve(__dirname, "../public/midi");
const SONGS_DIR = path.resolve(__dirname, "../public/songs");
const GROUP_WINDOW_SECONDS = 0.09;

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
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

function simplifyHard(notes) {
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

    const chosen = [];
    chosen.push(melody);
    if (bass !== melody) chosen.push(bass);
    if (middle && middle !== bass && middle !== melody) chosen.push(middle);

    chosen
      .sort((a, b) => a.midi - b.midi)
      .forEach((note) => simplified.push({ ...note, duration: round(Math.max(note.duration, beatSeconds / 4)) }));
  }

  return collapseRapidRepeats(simplified, beatSeconds / 6).map(({ trackIndex, ...note }) => note);
}

function simplifyEasy(notes, bpm) {
  const beatSeconds = 60 / bpm;
  const groups = groupNotesByTime(notes);
  const simplified = [];

  for (const group of groups) {
    const usable = group.notes.filter((note) => note.duration >= beatSeconds / 8);
    if (usable.length === 0) continue;

    const rightHand = usable.filter((note) => note.hand !== "left");
    const source = rightHand.length > 0 ? rightHand : usable;
    const melody = [...source].sort((a, b) => b.midi - a.midi)[0];
    simplified.push({
      ...melody,
      duration: round(Math.max(melody.duration, beatSeconds / 3)),
      hand: "right",
    });
  }

  return collapseRapidRepeats(simplified, beatSeconds / 4).map(({ trackIndex, ...note }) => note);
}

function buildSongJson(fileName, midiData) {
  const { notes, bpm, duration, title } = midiData;
  const id = slugify(path.basename(fileName, path.extname(fileName)));

  const hard = simplifyHard(notes);
  const medium = simplifyMedium(notes, bpm);
  const easy = simplifyEasy(notes, bpm);

  return {
    id,
    title: title || id.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    artist: "MIDI Source",
    difficulty: "Médio",
    bpm,
    duration,
    category: "A revisar",
    isPremium: true,
    coverUrl: "/images/covers/placeholder.png",
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

function convertMidiFile(fileName) {
  const filePath = path.join(MIDI_DIR, fileName);
  const buffer = fs.readFileSync(filePath);
  const midi = new Midi(buffer);
  const midiData = normalizeNotes(midi);
  const songJson = buildSongJson(fileName, midiData);
  const outputPath = path.join(SONGS_DIR, `${songJson.id}.json`);

  fs.writeFileSync(outputPath, `${JSON.stringify(songJson, null, 2)}\n`);

  return {
    id: songJson.id,
    outputPath,
    counts: {
      easy: songJson.arrangements.easy.length,
      medium: songJson.arrangements.medium.length,
      hard: songJson.arrangements.hard.length,
    },
  };
}

function getMidiFilesFromArgs() {
  const argFile = process.argv[2];
  if (argFile) {
    return [argFile];
  }

  if (!fs.existsSync(MIDI_DIR)) {
    throw new Error("Pasta public/midi nao encontrada.");
  }

  return fs.readdirSync(MIDI_DIR).filter((file) => file.toLowerCase().endsWith(".mid"));
}

function main() {
  const files = getMidiFilesFromArgs();

  if (!fs.existsSync(SONGS_DIR)) {
    fs.mkdirSync(SONGS_DIR, { recursive: true });
  }

  if (files.length === 0) {
    console.log("Nenhum arquivo MIDI encontrado.");
    return;
  }

  console.log(`Processando ${files.length} arquivo(s) MIDI...`);

  files.forEach((fileName) => {
    const result = convertMidiFile(fileName);
    console.log(
      `OK ${result.id}: easy=${result.counts.easy}, medium=${result.counts.medium}, hard=${result.counts.hard}`
    );
  });

  console.log("Conversao concluida.");
}

main();
