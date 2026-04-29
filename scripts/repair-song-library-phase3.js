const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const songManifest = require("./song-manifest");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public/songs");
const MIDI_DIR = path.join(ROOT_DIR, "public/midi");
const TARGET_IDS = new Set(["trois-nouvelles-etudes-no-1-f-minorchopin"]);
const GROUP_WINDOW = 0.12;
const PLAYER_MIN_MIDI = 36;
const PLAYER_MAX_MIDI = 84;

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function foldIntoKeyboardRange(midi) {
  let folded = Math.round(midi);
  while (folded < PLAYER_MIN_MIDI) folded += 12;
  while (folded > PLAYER_MAX_MIDI) folded -= 12;
  return Math.max(PLAYER_MIN_MIDI, Math.min(PLAYER_MAX_MIDI, folded));
}

function noteEnd(note) {
  return note.time + note.duration;
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi);
}

function groupByTime(notes) {
  const groups = [];
  for (const note of sortNotes(notes)) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(note.time - previous.time) > GROUP_WINDOW) {
      groups.push({ time: note.time, notes: [note] });
    } else {
      previous.notes.push(note);
    }
  }
  return groups;
}

function normalizeSource(fileName) {
  const midi = new Midi(fs.readFileSync(path.join(MIDI_DIR, fileName)));
  const notes = [];
  for (const track of midi.tracks) {
    for (const note of track.notes) {
      notes.push({
        midi: note.midi,
        time: round(note.time),
        duration: round(Math.max(0.08, note.duration)),
        velocity: round(Math.max(0.1, note.velocity), 2),
      });
    }
  }
  const firstTime = notes.length ? Math.min(...notes.map((note) => note.time)) : 0;
  return sortNotes(
    notes.map((note) => ({
      ...note,
      time: round(Math.max(0, note.time - firstTime)),
    })),
  );
}

function sourceMelody(notes) {
  return groupByTime(notes)
    .map((group) => [...group.notes].sort((a, b) => b.midi - a.midi || b.duration - a.duration)[0])
    .filter(Boolean);
}

function sourceBass(notes) {
  return groupByTime(notes)
    .map((group) => [...group.notes].sort((a, b) => a.midi - b.midi || b.duration - a.duration)[0])
    .filter(Boolean);
}

function collapse(notes, minimumGap) {
  const result = [];
  let lastTime = -Infinity;
  for (const note of sortNotes(notes)) {
    if (note.time - lastTime < minimumGap) continue;
    result.push(note);
    lastTime = note.time;
  }
  return result;
}

function cleanSameKey(notes) {
  const sorted = sortNotes(notes);
  const cleaned = [];
  const latestByMidi = new Map();
  for (const note of sorted) {
    const previous = latestByMidi.get(note.midi);
    if (previous && note.time - previous.time < 0.08) {
      previous.duration = round(Math.max(previous.duration, noteEnd(note) - previous.time));
      continue;
    }
    const cloned = { ...note };
    cleaned.push(cloned);
    latestByMidi.set(cloned.midi, cloned);
  }
  return sortNotes(cleaned);
}

function makeEasy(melody) {
  return cleanSameKey(
    collapse(melody, 0.55).map((note) => {
      let midi = note.midi;
      while (midi < 55) midi += 12;
      return {
        midi: foldIntoKeyboardRange(midi),
        time: note.time,
        duration: round(Math.max(0.3, Math.min(2.4, note.duration))),
        velocity: note.velocity,
        hand: "right",
      };
    }),
  );
}

function makeMedium(melody, bass) {
  const melodyLine = collapse(melody, 0.42).map((note) => ({
    midi: foldIntoKeyboardRange(note.midi),
    time: note.time,
    duration: round(Math.max(0.14, Math.min(3.2, note.duration))),
    velocity: note.velocity,
    hand: "right",
  }));

  const bassLine = collapse(bass, 1.1).map((note) => {
    let midi = note.midi;
    while (midi > 59) midi -= 12;
    return {
      midi: foldIntoKeyboardRange(midi),
      time: note.time,
      duration: round(Math.max(0.35, Math.min(2.8, note.duration))),
      velocity: round(Math.max(0.25, note.velocity * 0.8), 2),
      hand: "left",
    };
  });

  return cleanSameKey([...melodyLine, ...bassLine]);
}

function main() {
  let changed = 0;

  for (const entry of songManifest) {
    if (!TARGET_IDS.has(entry.id)) continue;

    const source = normalizeSource(entry.midiFiles[entry.midiFiles.length - 1]);
    const melody = sourceMelody(source);
    const bass = sourceBass(source);
    const filePath = path.join(SONGS_DIR, entry.outputFile);
    const before = fs.readFileSync(filePath, "utf8");
    const song = JSON.parse(before);
    const easy = makeEasy(melody);
    const medium = makeMedium(melody, bass);
    const duration = Math.max(
      song.duration,
      Math.ceil(Math.max(...song.arrangements.hard.map(noteEnd), ...easy.map(noteEnd), ...medium.map(noteEnd)) + 1),
    );
    const repaired = {
      ...song,
      duration,
      arrangements: {
        ...song.arrangements,
        easy,
        medium,
      },
      notes1Hand: easy,
    };
    const after = `${JSON.stringify(repaired, null, 2)}\n`;
    if (after !== before) {
      fs.writeFileSync(filePath, after, "utf8");
      changed += 1;
    }
  }

  console.log(`Fase 3 concluida. Musicas atualizadas: ${changed}/${TARGET_IDS.size}.`);
}

main();
