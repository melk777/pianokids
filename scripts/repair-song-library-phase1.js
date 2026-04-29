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

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function foldIntoKeyboardRange(midi) {
  let folded = Math.round(midi);
  while (folded < PLAYER_MIN_MIDI) folded += 12;
  while (folded > PLAYER_MAX_MIDI) folded -= 12;
  return Math.max(PLAYER_MIN_MIDI, Math.min(PLAYER_MAX_MIDI, folded));
}

function inferHand(note) {
  const hand = typeof note.hand === "string" ? note.hand.toLowerCase() : "";
  if (hand === "left" || hand === "right") {
    if (hand === "right" && note.midi < 48) return "left";
    if (hand === "left" && note.midi > 72) return "right";
    return hand;
  }
  return note.midi < 60 ? "left" : "right";
}

function noteEnd(note) {
  return note.time + note.duration;
}

function repairNote(note) {
  if (!isFiniteNumber(note?.midi) || !isFiniteNumber(note?.time) || !isFiniteNumber(note?.duration)) {
    return null;
  }

  const midi = foldIntoKeyboardRange(note.midi);
  const repaired = {
    midi,
    time: round(Math.max(0, note.time)),
    duration: round(Math.max(0.05, note.duration)),
    velocity: round(Math.max(0.08, Math.min(1, isFiniteNumber(note.velocity) ? note.velocity : 0.72)), 2),
  };

  repaired.hand = inferHand({ ...note, midi });
  return repaired;
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi || a.duration - b.duration);
}

function mergeDuplicates(notes) {
  const merged = [];

  for (const note of sortNotes(notes)) {
    const previous = merged.find((candidate) => candidate.midi === note.midi && Math.abs(candidate.time - note.time) <= 0.01);
    if (previous) {
      const end = Math.max(noteEnd(previous), noteEnd(note));
      previous.duration = round(Math.max(0.05, end - previous.time));
      previous.velocity = round(Math.max(previous.velocity ?? 0, note.velocity ?? 0), 2);
      previous.hand = previous.hand === "right" || note.hand === "right" ? "right" : "left";
    } else {
      merged.push({ ...note });
    }
  }

  return sortNotes(merged);
}

function removeRapidSameKeyRepeats(notes) {
  const cleaned = [];
  const latestByMidi = new Map();

  for (const note of sortNotes(notes)) {
    const previous = latestByMidi.get(note.midi);
    if (previous && note.time - previous.time < 0.08) {
      previous.duration = round(Math.max(previous.duration, noteEnd(note) - previous.time));
      previous.velocity = round(Math.max(previous.velocity ?? 0, note.velocity ?? 0), 2);
    } else {
      const cloned = { ...note };
      cleaned.push(cloned);
      latestByMidi.set(note.midi, cloned);
    }
  }

  return cleaned;
}

function trimSameKeyOverlaps(notes) {
  const byMidi = new Map();
  const repaired = sortNotes(notes).map((note) => ({ ...note }));

  repaired.forEach((note, index) => {
    if (!byMidi.has(note.midi)) byMidi.set(note.midi, []);
    byMidi.get(note.midi).push({ note, index });
  });

  for (const entries of byMidi.values()) {
    entries.sort((a, b) => a.note.time - b.note.time);
    for (let index = 0; index < entries.length - 1; index += 1) {
      const current = entries[index].note;
      const next = entries[index + 1].note;
      if (noteEnd(current) > next.time - 0.01) {
        current.duration = round(Math.max(0.05, next.time - current.time - 0.01));
      }
    }
  }

  return sortNotes(repaired);
}

function cleanNotes(notes) {
  if (!Array.isArray(notes)) return [];
  const repaired = notes.map(repairNote).filter(Boolean);
  return trimSameKeyOverlaps(removeRapidSameKeyRepeats(mergeDuplicates(repaired)));
}

function shiftToZero(notes) {
  if (!notes.length) return [];
  const firstTime = Math.min(...notes.map((note) => note.time));
  if (firstTime <= 0) return notes;
  return notes.map((note) => ({
    ...note,
    time: round(Math.max(0, note.time - firstTime)),
  }));
}

function groupByTime(notes) {
  const groups = [];
  for (const note of sortNotes(notes)) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(note.time - previous.time) > GROUP_WINDOW_SECONDS) {
      groups.push({ time: note.time, notes: [note] });
    } else {
      previous.notes.push(note);
    }
  }
  return groups;
}

function collapseByGap(notes, minGap) {
  const result = [];
  let lastTime = -Infinity;

  for (const note of sortNotes(notes)) {
    if (note.time - lastTime < minGap) continue;
    result.push(note);
    lastTime = note.time;
  }

  return result;
}

function simplifyEasy(sourceNotes, bpm) {
  const beatSeconds = 60 / Math.max(45, Math.min(180, bpm || 90));
  const minGap = Math.max(0.32, beatSeconds * 0.5);
  const forcedDuration = Math.max(0.28, beatSeconds * 0.5);
  const melody = [];

  for (const group of groupByTime(sourceNotes)) {
    const candidates = group.notes.filter((note) => note.hand !== "left" && note.midi >= 55);
    const source = candidates.length > 0 ? candidates : group.notes;
    const note = [...source].sort((a, b) => b.midi - a.midi || b.duration - a.duration)[0];
    if (!note) continue;
    melody.push({
      ...note,
      duration: round(Math.max(note.duration, forcedDuration)),
      hand: "right",
    });
  }

  return cleanNotes(collapseByGap(melody, minGap)).map((note) => {
    let midi = note.midi;
    while (midi < 48) midi += 12;
    return {
      ...note,
      midi: foldIntoKeyboardRange(midi),
      hand: "right",
    };
  });
}

function simplifyMedium(sourceNotes, bpm) {
  const beatSeconds = 60 / Math.max(45, Math.min(180, bpm || 90));
  const minDuration = Math.max(0.08, beatSeconds / 8);
  const simplified = [];

  for (const group of groupByTime(sourceNotes)) {
    const usable = group.notes.filter((note) => note.duration >= minDuration);
    if (usable.length === 0) continue;

    const sorted = [...usable].sort((a, b) => a.midi - b.midi);
    const bass = sorted[0];
    const melody = sorted[sorted.length - 1];
    const middle = sorted.length > 2 ? sorted[Math.floor(sorted.length / 2)] : null;

    const chosen = [bass, middle, melody]
      .filter(Boolean)
      .filter((note, index, notes) => notes.findIndex((candidate) => candidate.midi === note.midi) === index)
      .slice(0, 3);

    for (const note of chosen) {
      simplified.push({
        ...note,
        duration: round(Math.max(note.duration, beatSeconds / 4)),
      });
    }
  }

  return cleanNotes(simplified);
}

function maxEnd(notes) {
  if (!notes.length) return 0;
  return Math.max(...notes.map(noteEnd));
}

function repairSong(song) {
  const bpm = isFiniteNumber(song.bpm) && song.bpm > 0 ? Math.round(song.bpm) : 90;
  const baseNotes = shiftToZero(cleanNotes(song.notes));
  const hard = baseNotes;
  const medium = simplifyMedium(hard, bpm);
  const easy = simplifyEasy(hard, bpm);
  const lastEnd = Math.max(maxEnd(hard), maxEnd(medium), maxEnd(easy));

  return {
    ...song,
    title: repairMojibake(song.title),
    artist: repairMojibake(song.artist),
    difficulty: repairMojibake(song.difficulty),
    category: repairMojibake(song.category),
    bpm,
    duration: Math.max(1, Math.ceil(lastEnd + 2)),
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
  let repairedCount = 0;

  for (const entry of songManifest) {
    const filePath = path.join(SONGS_DIR, entry.outputFile);
    const before = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(before);
    const repaired = repairSong(parsed);
    const after = `${JSON.stringify(repaired, null, 2)}\n`;

    if (after !== before) {
      fs.writeFileSync(filePath, after, "utf8");
      repairedCount += 1;
    }
  }

  console.log(`Fase 1 concluida. Musicas atualizadas: ${repairedCount}/${songManifest.length}.`);
}

main();
