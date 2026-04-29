const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const songManifest = require("./song-manifest");
const { repairMojibake } = require("./text-normalization");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public/songs");
const MIDI_DIR = path.join(ROOT_DIR, "public/midi");
const REPORT_JSON = path.join(ROOT_DIR, "docs/song-source-fidelity-audit.json");
const REPORT_MD = path.join(ROOT_DIR, "docs/song-source-fidelity-audit.md");
const GROUP_WINDOW = 0.12;

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function noteEnd(note) {
  return note.time + note.duration;
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi);
}

function groupByTime(notes, window = GROUP_WINDOW) {
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

function foldPitchClassDistance(a, b) {
  const diff = Math.abs((a % 12) - (b % 12));
  return Math.min(diff, 12 - diff);
}

function normalizeMidiFile(fileName) {
  const midi = new Midi(fs.readFileSync(path.join(MIDI_DIR, fileName)));
  const notes = [];
  for (const track of midi.tracks) {
    for (const note of track.notes) {
      notes.push({
        midi: note.midi,
        time: round(note.time),
        duration: round(Math.max(0.05, note.duration)),
        velocity: round(note.velocity, 2),
        hand: note.midi < 60 ? "left" : "right",
      });
    }
  }
  const firstTime = notes.length ? Math.min(...notes.map((note) => note.time)) : 0;
  const shiftedNotes = notes.map((note) => ({
    ...note,
    time: round(Math.max(0, note.time - firstTime)),
  }));
  return {
    fileName,
    bpm: Math.round(midi.header.tempos[0]?.bpm || 120),
    duration: round(Math.max(0, midi.duration - firstTime)),
    notes: sortNotes(shiftedNotes),
  };
}

function pickReferenceSource(entry) {
  const sources = entry.midiFiles.map(normalizeMidiFile);
  return sources.sort((a, b) => b.notes.length - a.notes.length)[0];
}

function melodyFrom(notes) {
  return groupByTime(notes)
    .map((group) => [...group.notes].sort((a, b) => b.midi - a.midi || b.duration - a.duration)[0])
    .filter(Boolean);
}

function bassFrom(notes) {
  return groupByTime(notes)
    .map((group) => [...group.notes].sort((a, b) => a.midi - b.midi || b.duration - a.duration)[0])
    .filter(Boolean);
}

function nearestByTime(notes, time, tolerance) {
  let best = null;
  let bestDistance = Infinity;
  for (const note of notes) {
    const distance = Math.abs(note.time - time);
    if (distance < bestDistance) {
      best = note;
      bestDistance = distance;
    }
    if (note.time > time + tolerance) break;
  }
  return bestDistance <= tolerance ? best : null;
}

function compareLine(referenceLine, candidateLine, tolerance) {
  if (!referenceLine.length || !candidateLine.length) {
    return {
      coverage: 0,
      pitchClassMatch: 0,
      contourMatch: 0,
      compared: 0,
      matched: 0,
    };
  }

  let matched = 0;
  let pitchClassMatched = 0;
  let contourMatched = 0;
  let contourCompared = 0;
  let previousReference = null;
  let previousCandidate = null;

  for (const referenceNote of referenceLine) {
    const candidate = nearestByTime(candidateLine, referenceNote.time, tolerance);
    if (!candidate) continue;
    matched += 1;
    if (foldPitchClassDistance(referenceNote.midi, candidate.midi) <= 1) {
      pitchClassMatched += 1;
    }
    if (previousReference && previousCandidate) {
      const referenceDirection = Math.sign(referenceNote.midi - previousReference.midi);
      const candidateDirection = Math.sign(candidate.midi - previousCandidate.midi);
      if (referenceDirection === candidateDirection || referenceDirection === 0 || candidateDirection === 0) {
        contourMatched += 1;
      }
      contourCompared += 1;
    }
    previousReference = referenceNote;
    previousCandidate = candidate;
  }

  return {
    coverage: round(matched / referenceLine.length, 3),
    pitchClassMatch: round(pitchClassMatched / Math.max(matched, 1), 3),
    contourMatch: round(contourMatched / Math.max(contourCompared, 1), 3),
    compared: referenceLine.length,
    matched,
  };
}

function compareReduction(referenceLine, candidateLine, tolerance) {
  if (!referenceLine.length || !candidateLine.length) {
    return {
      coverage: 0,
      pitchClassMatch: 0,
      contourMatch: 0,
      compared: candidateLine.length,
      matched: 0,
    };
  }

  let matched = 0;
  let pitchClassMatched = 0;
  let contourMatched = 0;
  let contourCompared = 0;
  let previousReference = null;
  let previousCandidate = null;

  for (const candidate of candidateLine) {
    const referenceNote = nearestByTime(referenceLine, candidate.time, tolerance);
    if (!referenceNote) continue;
    matched += 1;
    if (foldPitchClassDistance(referenceNote.midi, candidate.midi) <= 1) {
      pitchClassMatched += 1;
    }
    if (previousReference && previousCandidate) {
      const referenceDirection = Math.sign(referenceNote.midi - previousReference.midi);
      const candidateDirection = Math.sign(candidate.midi - previousCandidate.midi);
      if (referenceDirection === candidateDirection || referenceDirection === 0 || candidateDirection === 0) {
        contourMatched += 1;
      }
      contourCompared += 1;
    }
    previousReference = referenceNote;
    previousCandidate = candidate;
  }

  return {
    coverage: round(matched / candidateLine.length, 3),
    pitchClassMatch: round(pitchClassMatched / Math.max(matched, 1), 3),
    contourMatch: round(contourMatched / Math.max(contourCompared, 1), 3),
    compared: candidateLine.length,
    matched,
  };
}

function density(notes, duration) {
  return round(notes.length / Math.max(duration / 60, 0.01), 2);
}

function auditSong(entry) {
  const song = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, entry.outputFile), "utf8"));
  const reference = pickReferenceSource(entry);
  const hard = song.arrangements?.hard || song.notes || [];
  const medium = song.arrangements?.medium || [];
  const easy = song.arrangements?.easy || song.notes1Hand || [];
  const referenceMelody = melodyFrom(reference.notes);
  const referenceBass = bassFrom(reference.notes);
  const hardMelody = melodyFrom(hard);
  const mediumMelody = melodyFrom(medium);
  const easyMelody = melodyFrom(easy);
  const hardBass = bassFrom(hard);
  const timeTolerance = Math.max(0.28, 60 / Math.max(reference.bpm, 45) / 2);

  const hardMelodyMatch = compareLine(referenceMelody, hardMelody, timeTolerance);
  const easyMelodyMatch = compareReduction(referenceMelody, easyMelody, timeTolerance * 1.5);
  const mediumMelodyMatch = compareReduction(referenceMelody, mediumMelody, timeTolerance * 1.25);
  const bassMatch = compareLine(referenceBass, hardBass, timeTolerance);
  const durationRatio = round((song.duration || 0) / Math.max(reference.duration, 1), 3);
  const hardDensityRatio = round(density(hard, song.duration || reference.duration) / Math.max(density(reference.notes, reference.duration), 0.01), 3);
  const issues = [];

  if (hardMelodyMatch.pitchClassMatch < 0.65 || hardMelodyMatch.contourMatch < 0.75) {
    issues.push({
      severity: "high",
      code: "hard_melody_drift",
      message: "A versao hard parece distante da melodia do MIDI fonte.",
    });
  }
  if (easyMelodyMatch.coverage < 0.82 || easyMelodyMatch.pitchClassMatch < 0.62 || easyMelodyMatch.contourMatch < 0.55) {
    issues.push({
      severity: "medium",
      code: "easy_melody_weak",
      message: "A versao facil preserva pouco da melodia/contorno do MIDI fonte.",
    });
  }
  if (mediumMelodyMatch.coverage < 0.82 || mediumMelodyMatch.pitchClassMatch < 0.68) {
    issues.push({
      severity: "medium",
      code: "medium_melody_weak",
      message: "A versao intermediaria precisa preservar melhor a melodia principal.",
    });
  }
  if (bassMatch.pitchClassMatch < 0.55 && referenceBass.length > 20) {
    issues.push({
      severity: "low",
      code: "bass_harmony_changed",
      message: "O baixo/harmonia da versao hard mudou bastante em relacao ao MIDI fonte.",
    });
  }
  if (durationRatio < 0.92 || durationRatio > 1.12) {
    issues.push({
      severity: "medium",
      code: "duration_drift",
      message: "Duracao final diverge muito do MIDI fonte.",
    });
  }
  if (hardDensityRatio < 0.35 && hardMelodyMatch.pitchClassMatch < 0.8) {
    issues.push({
      severity: "low",
      code: "hard_over_simplified",
      message: "A versao hard foi simplificada demais em relacao ao MIDI fonte.",
    });
  }

  return {
    id: entry.id,
    title: repairMojibake(song.title),
    referenceFile: reference.fileName,
    bpm: song.bpm,
    referenceBpm: reference.bpm,
    duration: song.duration,
    referenceDuration: reference.duration,
    durationRatio,
    noteCounts: {
      reference: reference.notes.length,
      hard: hard.length,
      medium: medium.length,
      easy: easy.length,
    },
    hardDensityRatio,
    hardMelodyMatch,
    mediumMelodyMatch,
    easyMelodyMatch,
    bassMatch,
    issues,
    status: issues.some((issue) => issue.severity === "high")
      ? "needs_fix"
      : issues.length
        ? "review"
        : "ok",
  };
}

function summarize(songs) {
  const summary = {
    songs: songs.length,
    ok: songs.filter((song) => song.status === "ok").length,
    review: songs.filter((song) => song.status === "review").length,
    needsFix: songs.filter((song) => song.status === "needs_fix").length,
    issuesBySeverity: { high: 0, medium: 0, low: 0 },
    issuesByCode: {},
  };

  for (const song of songs) {
    for (const issue of song.issues) {
      summary.issuesBySeverity[issue.severity] += 1;
      summary.issuesByCode[issue.code] = (summary.issuesByCode[issue.code] || 0) + 1;
    }
  }

  return summary;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function renderMarkdown(report) {
  const top = [...report.songs]
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 25)
    .map((song) => `- ${song.id}: ${song.status}. ${song.issues.map((issue) => `[${issue.severity}] ${issue.code}`).join(", ") || "Sem alertas"}`)
    .join("\n");

  const rows = report.songs
    .map((song) =>
      [
        song.id,
        song.title,
        song.referenceFile,
        song.status,
        song.hardMelodyMatch.pitchClassMatch,
        song.easyMelodyMatch.pitchClassMatch,
        song.easyMelodyMatch.contourMatch,
        song.bassMatch.pitchClassMatch,
        song.durationRatio,
        song.hardDensityRatio,
        song.issues.map((issue) => issue.code).join(", ") || "ok",
      ]
        .map(mdEscape)
        .join(" | "),
    )
    .join("\n");

  return `# Auditoria de fidelidade musical contra MIDI fonte

Gerado em ${report.generatedAt}.

Este relatorio compara os JSONs finais com os MIDIs locais em public/midi. Ele mede preservacao de melodia, contorno, baixo/harmonia, duracao e densidade. Nao substitui conferencia com partitura oficial, mas aponta desvios musicais provaveis usando a fonte local disponivel.

## Resumo

- Musicas analisadas: ${report.summary.songs}
- OK: ${report.summary.ok}
- Revisao: ${report.summary.review}
- Precisa correcao: ${report.summary.needsFix}
- Issues: high=${report.summary.issuesBySeverity.high}, medium=${report.summary.issuesBySeverity.medium}, low=${report.summary.issuesBySeverity.low}

## Prioridade

${top}

## Tabela

| ID | Titulo | MIDI fonte | Status | Hard melodia | Easy melodia | Easy contorno | Baixo | Duracao | Densidade hard | Alertas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function main() {
  const songs = songManifest.map(auditSong);
  const report = {
    generatedAt: new Date().toISOString(),
    summary: summarize(songs),
    songs,
  };

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, renderMarkdown(report), "utf8");

  console.log(`Fidelidade MIDI: OK=${report.summary.ok} | revisao=${report.summary.review} | precisa correcao=${report.summary.needsFix}`);
  console.log(`Issues: high=${report.summary.issuesBySeverity.high}, medium=${report.summary.issuesBySeverity.medium}, low=${report.summary.issuesBySeverity.low}`);
  console.log(`Relatorios gerados:`);
  console.log(`- ${path.relative(ROOT_DIR, REPORT_MD)}`);
  console.log(`- ${path.relative(ROOT_DIR, REPORT_JSON)}`);
}

main();
