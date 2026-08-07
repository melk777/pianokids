const CHORDS = {
  C: { root: 48, notes: [48, 52, 55] },
  F: { root: 41, notes: [41, 45, 48] },
  G7: { root: 43, notes: [43, 47, 50, 53] },
  Am: { root: 45, notes: [45, 48, 52] },
  G: { root: 43, notes: [43, 47, 50] },
  D7: { root: 38, notes: [38, 42, 45, 48] },
  Em: { root: 40, notes: [40, 43, 47] },
  E: { root: 40, notes: [40, 44, 47] },
  A: { root: 45, notes: [45, 49, 52] },
  B7: { root: 47, notes: [47, 51, 54, 57] },
  "F#m": { root: 42, notes: [42, 45, 49] },
  "C#m": { root: 37, notes: [37, 40, 44] },
};

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function sortNotes(notes) {
  return [...notes].sort((left, right) => left.time - right.time || left.midi - right.midi);
}

function dedupeNotes(notes) {
  const seen = new Set();
  return sortNotes(notes).filter((note) => {
    const signature = `${note.midi}|${note.time}|${note.duration}|${note.hand}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function stripInternalFields(notes) {
  return dedupeNotes(notes).map((note) => {
    const publicNote = { ...note };
    delete publicNote.beat;
    delete publicNote.ticks;
    delete publicNote.durationBeats;
    delete publicNote.role;
    delete publicNote.trackIndex;
    delete publicNote.durationTicks;
    return publicNote;
  });
}

function transcriptionMelody(entry) {
  const secondsPerBeat = 60 / entry.bpm;
  return entry.melody.map(([midi, beat, durationBeats]) => ({
    midi,
    time: round(beat * secondsPerBeat),
    duration: round(durationBeats * secondsPerBeat),
    velocity: 0.72,
    hand: "right",
    beat,
    durationBeats,
  }));
}

function chordPitchClasses(symbol) {
  const chord = CHORDS[symbol];
  if (!chord) throw new Error(`Acorde nao configurado: ${symbol}`);
  return new Set(chord.notes.map((midi) => midi % 12));
}

function overlap(leftStart, leftDuration, rightStart, rightDuration) {
  return Math.max(0, Math.min(leftStart + leftDuration, rightStart + rightDuration) - Math.max(leftStart, rightStart));
}

function buildExplicitHarmony(entry, melody) {
  const progression = entry.harmony?.progression;
  if (!Array.isArray(progression) || progression.length === 0) {
    throw new Error(`${entry.id}: transcricao sem progressao harmonica explicita.`);
  }

  const lastBeat = Math.max(...melody.map((note) => note.beat + note.durationBeats));
  const result = [];
  let coveredUntil = 0;

  for (const [index, event] of progression.entries()) {
    const { symbol, startBeat, durationBeats } = event;
    if (!CHORDS[symbol]) throw new Error(`${entry.id}: acorde nao configurado na progressao: ${symbol}.`);
    if (!Number.isFinite(startBeat) || !Number.isFinite(durationBeats) || durationBeats <= 0) {
      throw new Error(`${entry.id}: evento harmonico ${index} invalido.`);
    }
    if (Math.abs(startBeat - coveredUntil) > 0.001) {
      throw new Error(`${entry.id}: lacuna ou sobreposicao harmonica em ${startBeat}; esperado ${coveredUntil}.`);
    }

    const notes = melody.filter(
      (note) => overlap(note.beat, note.durationBeats, startBeat, durationBeats) > 0,
    );
    const pitchClasses = chordPitchClasses(symbol);
    let compatible = 0;
    let total = 0;
    for (const note of notes) {
      const weight = overlap(note.beat, note.durationBeats, startBeat, durationBeats);
      total += weight;
      if (pitchClasses.has(note.midi % 12)) compatible += weight;
    }

    result.push({
      symbol,
      startBeat,
      durationBeats,
      compatibility: total > 0 ? round(compatible / total, 3) : 1,
    });
    coveredUntil = startBeat + durationBeats;
  }

  if (coveredUntil + 0.001 < lastBeat) {
    throw new Error(`${entry.id}: progressao termina em ${coveredUntil}, antes da melodia em ${lastBeat}.`);
  }

  return result;
}

function accompanimentFromHarmony(entry, harmony, style) {
  const secondsPerBeat = 60 / entry.bpm;
  const notes = [];

  for (const event of harmony) {
    const chord = CHORDS[event.symbol];
    const time = round(event.startBeat * secondsPerBeat);
    const duration = round(event.durationBeats * secondsPerBeat * 0.94);
    const chordNotes = style === "root" ? [chord.root] : chord.notes;

    for (const midi of chordNotes) {
      notes.push({
        midi,
        time,
        duration,
        velocity: style === "root" ? 0.56 : 0.5,
        hand: "left",
        beat: event.startBeat,
        durationBeats: event.durationBeats,
      });
    }
  }

  return notes;
}

function buildTranscriptionArrangements(entry) {
  const melody = transcriptionMelody(entry);
  const harmony = buildExplicitHarmony(entry, melody);
  const mediumBass = accompanimentFromHarmony(entry, harmony, "root");
  const hardChords = accompanimentFromHarmony(entry, harmony, "chord");

  return {
    bpm: entry.bpm,
    timeSignature: entry.timeSignature,
    hardSourceNotes: [...melody, ...hardChords],
    harmony,
    arrangements: {
      easy: stripInternalFields(melody),
      medium: stripInternalFields([...melody, ...mediumBass]),
      hard: stripInternalFields([...melody, ...hardChords]),
    },
  };
}

module.exports = {
  CHORDS,
  buildTranscriptionArrangements,
  chordPitchClasses,
  dedupeNotes,
  round,
  sortNotes,
  stripInternalFields,
};
