const fs = require("fs");
const path = require("path");
const songManifest = require("./song-manifest");
const { repairMojibake } = require("./text-normalization");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public/songs");
const PLAYER_MIN_MIDI = 36;
const PLAYER_MAX_MIDI = 84;
const GROUP_WINDOW_SECONDS = 0.12;

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function noteEnd(note) {
  return note.time + note.duration;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function foldIntoKeyboardRange(midi) {
  let folded = Math.round(midi);
  while (folded < PLAYER_MIN_MIDI) folded += 12;
  while (folded > PLAYER_MAX_MIDI) folded -= 12;
  return clamp(folded, PLAYER_MIN_MIDI, PLAYER_MAX_MIDI);
}

function inferHand(note) {
  if (note.hand === "left" && note.midi <= 72) return "left";
  if (note.hand === "right" && note.midi >= 48) return "right";
  return note.midi < 60 ? "left" : "right";
}

function normalizeNote(note) {
  const midi = foldIntoKeyboardRange(note.midi);
  return {
    midi,
    time: round(Math.max(0, note.time)),
    duration: round(clamp(note.duration, 0.06, 10)),
    velocity: round(clamp(typeof note.velocity === "number" ? note.velocity : 0.72, 0.08, 1), 2),
    hand: inferHand({ ...note, midi }),
  };
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi || a.duration - b.duration);
}

function groupByTime(notes, window = GROUP_WINDOW_SECONDS) {
  const groups = [];
  for (const note of sortNotes(notes)) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(note.time - previous.time) > window) {
      groups.push({ time: note.time, notes: [note] });
    } else {
      previous.notes.push(note);
    }
  }
  return groups;
}

function cleanSameKey(notes) {
  const cleaned = [];
  const latestByMidi = new Map();

  for (const rawNote of sortNotes(notes.map(normalizeNote))) {
    const previous = latestByMidi.get(rawNote.midi);
    if (previous && rawNote.time - previous.time <= 0.1) {
      previous.duration = round(clamp(Math.max(noteEnd(previous), noteEnd(rawNote)) - previous.time, 0.06, 10));
      previous.velocity = round(Math.max(previous.velocity, rawNote.velocity), 2);
      continue;
    }

    const note = { ...rawNote };
    cleaned.push(note);
    latestByMidi.set(note.midi, note);
  }

  const byMidi = new Map();
  for (const note of cleaned) {
    if (!byMidi.has(note.midi)) byMidi.set(note.midi, []);
    byMidi.get(note.midi).push(note);
  }

  for (const notesForMidi of byMidi.values()) {
    notesForMidi.sort((a, b) => a.time - b.time);
    for (let index = 0; index < notesForMidi.length - 1; index += 1) {
      const current = notesForMidi[index];
      const next = notesForMidi[index + 1];
      if (noteEnd(current) > next.time - 0.015) {
        current.duration = round(clamp(next.time - current.time - 0.015, 0.06, 10));
      }
    }
  }

  return sortNotes(cleaned);
}

function upperMelody(groups) {
  return groups
    .map((group) => {
      const candidates = group.notes.filter((note) => note.hand !== "left" && note.midi >= 52);
      const source = candidates.length ? candidates : group.notes;
      return [...source].sort((a, b) => b.midi - a.midi || b.duration - a.duration)[0];
    })
    .filter(Boolean);
}

function collapseByMinimumGap(notes, minimumGap) {
  const result = [];
  let lastAcceptedTime = -Infinity;

  for (const note of sortNotes(notes)) {
    if (note.time - lastAcceptedTime < minimumGap) continue;
    result.push(note);
    lastAcceptedTime = note.time;
  }

  return result;
}

function buildEasy(hardNotes, bpm) {
  const beat = 60 / clamp(bpm || 90, 50, 160);
  const minimumGap = Math.max(0.55, beat * 0.9);
  const melody = upperMelody(groupByTime(hardNotes)).map((note) => {
    let midi = note.midi;
    while (midi < 55) midi += 12;
    return {
      ...note,
      midi: foldIntoKeyboardRange(midi),
      duration: round(clamp(Math.max(note.duration, beat * 0.6), 0.24, 2.4)),
      hand: "right",
    };
  });

  return cleanSameKey(collapseByMinimumGap(melody, minimumGap)).map((note) => ({ ...note, hand: "right" }));
}

function pickMediumNotes(group) {
  const sorted = [...group.notes].sort((a, b) => a.midi - b.midi);
  const rawBass = sorted.find((note) => note.hand === "left") || sorted[0];
  const melody = [...sorted].reverse().find((note) => note.hand === "right") || sorted[sorted.length - 1];
  let bass = rawBass ? { ...rawBass } : null;

  if (bass && melody) {
    while (melody.midi - bass.midi > 16 && bass.midi + 12 < 60) {
      bass.midi += 12;
    }
    if (Math.abs(melody.midi - bass.midi) > 16) {
      bass = null;
    }
  }

  const chosen = [];

  if (bass) chosen.push(bass);
  if (melody && melody.midi !== bass?.midi) chosen.push(melody);

  return chosen.slice(0, 2);
}

function buildMedium(hardNotes, bpm) {
  const beat = 60 / clamp(bpm || 90, 50, 160);
  const minimumGroupGap = Math.max(0.68, beat * 0.75);
  const result = [];
  let lastGroupTime = -Infinity;

  for (const group of groupByTime(hardNotes)) {
    if (group.time - lastGroupTime < minimumGroupGap) continue;
    const chosen = pickMediumNotes(group);
    for (const note of chosen) {
      result.push({
        ...note,
        duration: round(clamp(Math.max(note.duration, beat * 0.35), 0.1, 3.5)),
      });
    }
    lastGroupTime = group.time;
  }

  return cleanSameKey(result);
}

function ensureEndingCoverage(arrangement, hardNotes, kind) {
  const hardLastEnd = maxEnd(hardNotes);
  if (!arrangement.length || hardLastEnd - maxEnd(arrangement) <= 6) return arrangement;

  const lastGroup = groupByTime(hardNotes).at(-1);
  if (!lastGroup) return arrangement;

  const note = kind === "easy" ? upperMelody([lastGroup])[0] : pickMediumNotes(lastGroup).at(-1);
  if (!note) return arrangement;

  const appended =
    kind === "easy"
      ? {
          ...note,
          midi: foldIntoKeyboardRange(Math.max(note.midi, 55)),
          duration: round(clamp(hardLastEnd - note.time, 0.3, 10)),
          hand: "right",
        }
      : {
          ...note,
          duration: round(clamp(hardLastEnd - note.time, 0.12, 10)),
        };

  return cleanSameKey([...arrangement, appended]);
}

function removeSemitoneClashes(notes) {
  const prioritized = [...notes].sort((a, b) => {
    const aPriority = a.hand === "right" ? 0 : 1;
    const bPriority = b.hand === "right" ? 0 : 1;
    return aPriority - bPriority || b.midi - a.midi;
  });
  const kept = [];

  for (const note of prioritized) {
    if (kept.some((candidate) => Math.abs(candidate.midi - note.midi) === 1)) continue;
    kept.push(note);
  }

  return kept.sort((a, b) => a.midi - b.midi);
}

function addSimpleLeftHandIfMissing(notes, bpm) {
  const hasLeft = notes.some((note) => note.hand === "left");
  if (hasLeft || notes.length < 12) return notes;

  const beat = 60 / clamp(bpm || 90, 50, 160);
  const leftNotes = [];
  let lastBassTime = -Infinity;

  for (const melody of upperMelody(groupByTime(notes))) {
    if (melody.time - lastBassTime < beat * 4) continue;
    let midi = melody.midi - 24;
    while (midi < PLAYER_MIN_MIDI) midi += 12;
    if (midi > 59) midi -= 12;
    leftNotes.push({
      midi: foldIntoKeyboardRange(midi),
      time: melody.time,
      duration: round(clamp(beat * 1.5, 0.5, 2.5)),
      velocity: round(Math.max(0.35, (melody.velocity || 0.7) * 0.75), 2),
      hand: "left",
    });
    lastBassTime = melody.time;
  }

  return cleanSameKey([...notes, ...leftNotes]);
}

function softenHardClusters(hardNotes) {
  const result = [];
  for (const group of groupByTime(hardNotes)) {
    const left = group.notes.filter((note) => note.hand === "left").sort((a, b) => a.midi - b.midi);
    const right = group.notes.filter((note) => note.hand !== "left").sort((a, b) => b.midi - a.midi);
    const chosen = removeSemitoneClashes([...left.slice(0, 2), ...right.slice(0, 4)]);
    result.push(...chosen);
  }
  return cleanSameKey(result);
}

function maxEnd(notes) {
  return notes.length ? Math.max(...notes.map(noteEnd)) : 0;
}

function estimateDifficulty(notes, duration) {
  const groups = groupByTime(notes);
  const maxChord = groups.reduce((max, group) => Math.max(max, group.notes.length), 0);
  const density = notes.length / Math.max((duration || maxEnd(notes)) / 60, 0.01);
  const hasTwoHands = notes.some((note) => note.hand === "left") && notes.some((note) => note.hand === "right");

  if (density > 190 || maxChord >= 4) return "Difícil";
  if (density > 55 || maxChord >= 3 || hasTwoHands) return "Médio";
  return "Fácil";
}

function repairSong(song) {
  const bpm = clamp(Math.round(song.bpm || 90), 45, 180);
  const hard = addSimpleLeftHandIfMissing(softenHardClusters(cleanSameKey(song.notes || [])), bpm);
  const easy = ensureEndingCoverage(buildEasy(hard, bpm), hard, "easy");
  const medium = ensureEndingCoverage(buildMedium(hard, bpm), hard, "medium");
  const duration = Math.max(1, Math.ceil(Math.max(maxEnd(hard), maxEnd(medium), maxEnd(easy)) + 1));

  return {
    ...song,
    title: repairMojibake(song.title),
    artist: repairMojibake(song.artist),
    category: repairMojibake(song.category),
    difficulty: estimateDifficulty(hard, duration),
    bpm,
    duration,
    notes: hard,
    arrangements: {
      ...(song.arrangements || {}),
      easy,
      medium,
      hard,
    },
    notes1Hand: easy,
    notes2Hands: hard,
  };
}

function main() {
  let changed = 0;

  for (const entry of songManifest) {
    const filePath = path.join(SONGS_DIR, entry.outputFile);
    const before = fs.readFileSync(filePath, "utf8");
    const song = JSON.parse(before);
    const repaired = repairSong(song);
    const after = `${JSON.stringify(repaired, null, 2)}\n`;
    if (after !== before) {
      fs.writeFileSync(filePath, after, "utf8");
      changed += 1;
    }
  }

  console.log(`Fase 2 concluida. Musicas atualizadas: ${changed}/${songManifest.length}.`);
}

main();
