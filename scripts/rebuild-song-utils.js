const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT_DIR, "music-sources", "rebuild");

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function sortNotes(notes) {
  return [...notes].sort(
    (left, right) => left.time - right.time || left.midi - right.midi || left.duration - right.duration,
  );
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function assertSourceFile(relativePath, expectedChecksum) {
  const filePath = path.join(SOURCE_DIR, relativePath);
  if (!fs.existsSync(filePath)) throw new Error(`Fonte ausente: ${relativePath}`);
  const actualChecksum = sha256(filePath);
  if (actualChecksum !== expectedChecksum) {
    throw new Error(`Checksum divergente em ${relativePath}. Esperado ${expectedChecksum}; atual ${actualChecksum}.`);
  }
  return filePath;
}

function verifySourceBundle(entry) {
  const source = entry.source;
  const bundle = {
    midiPath: assertSourceFile(source.midiFile, source.midiSha256),
    notationPath: assertSourceFile(source.notationFile, source.notationSha256),
  };
  if (Boolean(source.scoreFile) !== Boolean(source.scoreSha256)) {
    throw new Error(`${entry.id}: scoreFile e scoreSha256 devem ser informados juntos.`);
  }
  if (source.scoreFile && source.scoreSha256) {
    bundle.scorePath = assertSourceFile(source.scoreFile, source.scoreSha256);
  }
  if (source.upstreamMidiFile && source.upstreamMidiSha256) {
    bundle.upstreamMidiPath = assertSourceFile(source.upstreamMidiFile, source.upstreamMidiSha256);
  }
  if (source.facsimileFile && source.facsimileSha256) {
    bundle.facsimilePath = assertSourceFile(source.facsimileFile, source.facsimileSha256);
  }
  if (source.kind === "musicxml-derived-midi") {
    const { musicXmlToMidiBuffer } = require("./musicxml-to-midi");
    const regenerated = musicXmlToMidiBuffer(fs.readFileSync(bundle.notationPath, "utf8"), source.derivationBpm);
    const regeneratedChecksum = sha256Buffer(regenerated);
    if (regeneratedChecksum !== source.midiSha256) {
      throw new Error(
        `${entry.id}: o MIDI canonico nao pode ser reproduzido exatamente do MusicXML. ` +
        `Esperado ${source.midiSha256}; regenerado ${regeneratedChecksum}.`,
      );
    }
  }
  if (source.kind === "notation-json-derived-midi") {
    const { notationJsonToMidiBuffer } = require("./notation-json-to-midi");
    const regenerated = notationJsonToMidiBuffer(fs.readFileSync(bundle.notationPath, "utf8"));
    const regeneratedChecksum = sha256Buffer(regenerated);
    if (regeneratedChecksum !== source.midiSha256) {
      throw new Error(
        `${entry.id}: o MIDI canonico nao pode ser reproduzido exatamente da notacao JSON. ` +
        `Esperado ${source.midiSha256}; regenerado ${regeneratedChecksum}.`,
      );
    }
  }
  return bundle;
}

function validateTrackMappings(entry, midi) {
  if (!Array.isArray(entry.tracks) || entry.tracks.length === 0) {
    throw new Error(`${entry.id}: nenhuma faixa MIDI foi mapeada.`);
  }
  for (const mapping of entry.tracks) {
    const track = midi.tracks[mapping.index];
    if (!track) throw new Error(`${entry.id}: faixa MIDI ${mapping.index} nao existe.`);
    if (track.instrument.percussion) throw new Error(`${entry.id}: faixa MIDI ${mapping.index} e percussiva.`);
    if (!track.notes.length) throw new Error(`${entry.id}: faixa MIDI ${mapping.index} nao contem notas.`);
    if (mapping.hand !== "right" && mapping.hand !== "left" && mapping.hand !== "split") {
      throw new Error(`${entry.id}: mao invalida na faixa MIDI ${mapping.index}.`);
    }
    if (mapping.hand === "split" && !Number.isInteger(mapping.splitMidi)) {
      throw new Error(`${entry.id}: faixa MIDI ${mapping.index} exige splitMidi inteiro.`);
    }
  }
}

function dedupeSimultaneousPitches(notes) {
  const selected = new Map();
  for (const note of sortNotes(notes)) {
    const key = `${note.midi}|${round(note.time)}`;
    const current = selected.get(key);
    if (!current) {
      selected.set(key, note);
      continue;
    }
    const preferCandidate =
      note.duration > current.duration ||
      (note.duration === current.duration && note.velocity > current.velocity) ||
      (note.duration === current.duration && note.velocity === current.velocity && note.hand === "right");
    if (preferCandidate) selected.set(key, note);
  }
  return sortNotes([...selected.values()]);
}

function trimSamePitchOverlaps(notes, gapSeconds = 0.02) {
  const result = dedupeSimultaneousPitches(notes).map((note) => ({ ...note }));
  const byPitch = new Map();
  for (const note of result) {
    const pitchNotes = byPitch.get(note.midi) || [];
    pitchNotes.push(note);
    byPitch.set(note.midi, pitchNotes);
  }
  for (const pitchNotes of byPitch.values()) {
    pitchNotes.sort((left, right) => left.time - right.time || left.duration - right.duration);
    for (let index = 0; index < pitchNotes.length - 1; index += 1) {
      const current = pitchNotes[index];
      const next = pitchNotes[index + 1];
      if (current.time + current.duration <= next.time) continue;
      current.duration = round(Math.max(0.03, next.time - current.time - gapSeconds));
    }
  }
  return sortNotes(result);
}

function loadCanonicalMidi(entry) {
  const { midiPath } = verifySourceBundle(entry);
  const midi = new Midi(fs.readFileSync(midiPath));
  validateTrackMappings(entry, midi);
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
        hand: mapping.hand === "split"
          ? (note.midi < mapping.splitMidi ? "left" : "right")
          : mapping.hand,
        role: mapping.role,
        trackIndex: mapping.index,
        ticks: note.ticks,
        durationTicks,
      });
    }
  }

  if (!selected.length) throw new Error(`${entry.id}: a fonte MIDI nao produziu notas.`);
  const firstTime = Math.min(...selected.map((note) => note.time));
  const firstTick = Math.min(...selected.map((note) => note.ticks));
  const ppq = midi.header.ppq;
  const notes = selected.map((note) => ({
    ...note,
    time: round(note.time - firstTime),
    duration: round(note.duration),
    velocity: round(note.velocity, 2),
    ticks: note.ticks - firstTick,
    beat: (note.ticks - firstTick) / ppq,
    durationBeats: note.durationTicks / ppq,
  }));

  return {
    midi,
    notes: trimSamePitchOverlaps(notes),
    bpm: Math.round(midi.header.tempos[0]?.bpm || 120),
    timeSignature: midi.header.timeSignatures[0]?.timeSignature || [4, 4],
  };
}

function groupHighestByTick(notes) {
  const groups = [];
  for (const note of [...notes].sort((left, right) => left.ticks - right.ticks || right.midi - left.midi)) {
    const current = groups[groups.length - 1];
    if (!current || Math.abs(note.ticks - current.ticks) > 2) {
      groups.push({ ticks: note.ticks, notes: [note] });
    } else {
      current.notes.push(note);
    }
  }
  return groups.map((group) => group.notes.sort((left, right) => right.midi - left.midi)[0]);
}

function outline(notes, windowBeats, bpm, choose = "lowest") {
  if (!notes.length) return [];
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
      ticks: Math.round(startBeat * 480),
    });
  }
  return result;
}

function stripInternalFields(notes) {
  return trimSamePitchOverlaps(notes).map((note) => {
    const publicNote = { ...note };
    delete publicNote.beat;
    delete publicNote.ticks;
    delete publicNote.durationBeats;
    delete publicNote.durationTicks;
    delete publicNote.role;
    delete publicNote.trackIndex;
    return publicNote;
  });
}

function buildArrangements(entry) {
  const loaded = loadCanonicalMidi(entry);
  const melodySource = loaded.notes.filter((note) => entry.melodyTrackIndexes.includes(note.trackIndex));
  const easyMelodySource = entry.easyStrategy === "sustained-top-voice"
    ? melodySource.filter((note) => note.durationBeats >= (entry.easyMinimumDurationBeats || 0.75))
    : melodySource;
  if (!easyMelodySource.length) throw new Error(`${entry.id}: a estrategia easy nao encontrou notas melodicas.`);
  const melody = groupHighestByTick(easyMelodySource).map((note) => ({ ...note, hand: "right" }));
  const right = loaded.notes.filter((note) => note.hand === "right");
  const left = loaded.notes.filter((note) => note.hand === "left");
  const bass = outline(left, entry.bassOutlineBeats || 2, loaded.bpm, "lowest");

  const easy = entry.easyStrategy === "upper-outline"
    ? outline(right, entry.outlineBeats || 1, loaded.bpm, "highest")
    : melody;
  const medium = entry.mediumStrategy === "upper-with-bass-outline"
    ? [...right, ...bass]
    : [...melody, ...bass];

  return {
    bpm: loaded.bpm,
    timeSignature: loaded.timeSignature,
    sourceNotes: stripInternalFields(loaded.notes),
    arrangements: {
      easy: stripInternalFields(easy),
      medium: stripInternalFields(medium),
      hard: stripInternalFields(loaded.notes),
    },
  };
}

function noteSignature(note) {
  return `${note.midi}|${round(note.time)}|${round(note.duration)}|${note.hand}`;
}

module.exports = {
  SOURCE_DIR,
  buildArrangements,
  noteSignature,
  round,
  sha256,
  sortNotes,
  trimSamePitchOverlaps,
  verifySourceBundle,
};
