const fs = require("fs");
const path = require("path");
const songManifest = require("./song-manifest");
const songCatalogMetadata = require("./song-catalog-metadata");
const { repairMojibake } = require("./text-normalization");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public/songs");
const MIDI_DIR = path.join(ROOT_DIR, "public/midi");
const REPORT_JSON = path.join(ROOT_DIR, "docs/song-library-quality-audit.json");
const REPORT_MD = path.join(ROOT_DIR, "docs/song-library-quality-audit.md");

const PLAYER_MIN_MIDI = 36;
const PLAYER_MAX_MIDI = 84;
const GROUP_WINDOW = 0.09;
const NOTE_MATCH_WINDOW = 0.25;

const ISSUE_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function normalizeText(value) {
  return repairMojibake(String(value || "").replace(/\0/g, "").trim());
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function issue(severity, code, message, details = {}) {
  return { severity, code, message, ...details };
}

function getNotes(song, key) {
  if (key === "notes") return Array.isArray(song.notes) ? song.notes : [];
  if (key === "notes1Hand") return Array.isArray(song.notes1Hand) ? song.notes1Hand : [];
  if (key === "notes2Hands") return Array.isArray(song.notes2Hands) ? song.notes2Hands : [];
  const level = key.replace("arrangements.", "");
  return Array.isArray(song.arrangements?.[level]) ? song.arrangements[level] : [];
}

function isLeft(note) {
  if (note.hand === "left") return true;
  if (note.hand === "right") return false;
  return note.midi < 60;
}

function noteEnd(note) {
  return Number(note.time) + Number(note.duration);
}

function samePitchAtSameTime(a, b) {
  return a.midi === b.midi && Math.abs(a.time - b.time) <= 0.01;
}

function groupByTime(notes, window = GROUP_WINDOW) {
  const sorted = [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi);
  const groups = [];
  for (const note of sorted) {
    const previous = groups[groups.length - 1];
    if (!previous || Math.abs(note.time - previous.time) > window) {
      groups.push({ time: note.time, notes: [note] });
    } else {
      previous.notes.push(note);
    }
  }
  return groups;
}

function handCounts(notes) {
  return notes.reduce(
    (acc, note) => {
      if (isLeft(note)) acc.left += 1;
      else acc.right += 1;
      return acc;
    },
    { left: 0, right: 0 },
  );
}

function normalizeDifficulty(value) {
  const text = normalizeText(value).toLowerCase();
  if (text.includes("facil") || text.includes("fácil")) return "easy";
  if (text.includes("medio") || text.includes("médio")) return "medium";
  if (text.includes("dificil") || text.includes("difícil") || text.includes("pro")) return "hard";
  return "unknown";
}

function selectForPlayer(song, difficulty, handMode) {
  const arrangementLevel = difficulty === "easy" ? "easy" : difficulty === "medium" ? "medium" : "hard";
  const wantsRight = handMode === "right" || handMode === "both";
  const wantsLeft = handMode === "left" || handMode === "both";
  const applyHand = (notes) =>
    notes.filter((note) => {
      const left = isLeft(note);
      return (left && wantsLeft) || (!left && wantsRight);
    });

  const preferOneHand = handMode !== "both";
  const candidates = [];

  if (preferOneHand && handMode === "right") candidates.push(getNotes(song, "notes1Hand"));
  candidates.push(getNotes(song, `arrangements.${arrangementLevel}`));
  if (!preferOneHand) candidates.push(getNotes(song, "notes2Hands"));
  if (preferOneHand && handMode !== "left") candidates.push(getNotes(song, "notes1Hand"));
  candidates.push(getNotes(song, "notes2Hands"), getNotes(song, "notes"));

  for (const candidate of candidates) {
    const selected = applyHand(candidate);
    if (selected.length > 0) return selected;
  }

  return [];
}

function arrayMetrics(notes, declaredDuration) {
  if (!notes.length) {
    return {
      count: 0,
      firstTime: 0,
      lastEnd: 0,
      density: 0,
      minMidi: null,
      maxMidi: null,
      maxChord: 0,
      maxHandSpan: 0,
      chordRatio: 0,
      leftRatio: 0,
      shortestDuration: 0,
      longestDuration: 0,
      longestGap: 0,
      largeLeaps: 0,
      semitoneClashGroups: 0,
    };
  }

  const sorted = [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi);
  const groups = groupByTime(sorted);
  const durationBase = Math.max(declaredDuration || 0, noteEnd(sorted[sorted.length - 1]));
  const hands = handCounts(sorted);
  let longestGap = Math.max(0, sorted[0].time);
  let largeLeaps = 0;
  let previousRight = null;
  let maxHandSpan = 0;
  let semitoneClashGroups = 0;

  for (let i = 1; i < sorted.length; i += 1) {
    longestGap = Math.max(longestGap, sorted[i].time - noteEnd(sorted[i - 1]));
  }

  for (const note of sorted) {
    if (!isLeft(note)) {
      if (previousRight && Math.abs(note.midi - previousRight.midi) >= 12 && note.time - previousRight.time < 1.2) {
        largeLeaps += 1;
      }
      previousRight = note;
    }
  }

  for (const group of groups) {
    const byHand = { left: [], right: [] };
    for (const note of group.notes) {
      byHand[isLeft(note) ? "left" : "right"].push(note.midi);
    }
    for (const notesForHand of Object.values(byHand)) {
      if (notesForHand.length > 1) {
        maxHandSpan = Math.max(maxHandSpan, Math.max(...notesForHand) - Math.min(...notesForHand));
      }
    }

    const sortedMidis = [...new Set(group.notes.map((note) => note.midi))].sort((a, b) => a - b);
    for (let i = 1; i < sortedMidis.length; i += 1) {
      if (sortedMidis[i] - sortedMidis[i - 1] === 1) {
        semitoneClashGroups += 1;
        break;
      }
    }
  }

  const chordGroups = groups.filter((group) => group.notes.length > 1).length;
  return {
    count: sorted.length,
    firstTime: round(sorted[0].time),
    lastEnd: round(noteEnd(sorted[sorted.length - 1])),
    density: round(sorted.length / Math.max(durationBase / 60, 0.01), 2),
    minMidi: Math.min(...sorted.map((note) => note.midi)),
    maxMidi: Math.max(...sorted.map((note) => note.midi)),
    maxChord: Math.max(...groups.map((group) => group.notes.length)),
    maxHandSpan,
    chordRatio: round(chordGroups / Math.max(groups.length, 1), 3),
    leftRatio: round(hands.left / sorted.length, 3),
    shortestDuration: round(Math.min(...sorted.map((note) => note.duration))),
    longestDuration: round(Math.max(...sorted.map((note) => note.duration))),
    longestGap: round(longestGap),
    largeLeaps,
    semitoneClashGroups,
  };
}

function estimateLevel(metrics) {
  let score = 0;
  if (metrics.density > 95) score += 3;
  else if (metrics.density > 55) score += 2;
  else if (metrics.density > 32) score += 1;

  if (metrics.maxChord >= 5) score += 3;
  else if (metrics.maxChord >= 3) score += 2;
  else if (metrics.maxChord >= 2) score += 1;

  if (metrics.maxHandSpan > 14) score += 2;
  else if (metrics.maxHandSpan > 9) score += 1;

  if (metrics.chordRatio > 0.35) score += 2;
  else if (metrics.chordRatio > 0.15) score += 1;

  if (metrics.leftRatio > 0.22 && metrics.leftRatio < 0.78) score += 1;
  if (metrics.shortestDuration > 0 && metrics.shortestDuration < 0.12) score += 1;
  if (metrics.largeLeaps > Math.max(8, metrics.count * 0.08)) score += 1;

  if (score <= 2) return "easy";
  if (score <= 5) return "medium";
  if (score <= 8) return "hard";
  return "pro";
}

function levelLabel(level) {
  return {
    easy: "facil",
    medium: "intermediario",
    hard: "dificil",
    pro: "profissional",
    unknown: "desconhecido",
  }[level] || level;
}

function melodyPreservation(sourceNotes, easyNotes) {
  if (!sourceNotes.length || !easyNotes.length) return { ratio: 0, matched: 0, compared: easyNotes.length };
  const sourceGroups = groupByTime(sourceNotes);
  const melody = sourceGroups.map((group) => [...group.notes].sort((a, b) => b.midi - a.midi)[0]);
  let matched = 0;
  for (const note of easyNotes) {
    let best = null;
    let bestDistance = Infinity;
    for (const candidate of melody) {
      const distance = Math.abs(candidate.time - note.time);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
      if (candidate.time > note.time + NOTE_MATCH_WINDOW) break;
    }
    if (best && bestDistance <= NOTE_MATCH_WINDOW) {
      const exactOrNeighbor = Math.abs(best.midi - note.midi) <= 2 || best.midi % 12 === note.midi % 12;
      if (exactOrNeighbor) matched += 1;
    }
  }
  return { ratio: round(matched / easyNotes.length, 3), matched, compared: easyNotes.length };
}

function auditArray(song, arrayName, notes, declaredDuration) {
  const issues = [];
  if (!Array.isArray(notes)) {
    issues.push(issue("critical", "array_missing", `${arrayName} nao e um array.`));
    return { metrics: arrayMetrics([], declaredDuration), issues };
  }

  let previous = null;
  const duplicates = [];
  const invalidNotes = [];
  const rangeNotes = [];
  const overlaps = [];
  const unsorted = [];
  const byMidi = new Map();

  notes.forEach((note, index) => {
    const valid =
      Number.isFinite(note.midi) &&
      Number.isFinite(note.time) &&
      Number.isFinite(note.duration) &&
      note.duration > 0 &&
      note.time >= 0;

    if (!valid) invalidNotes.push(index);
    if (note.hand && note.hand !== "left" && note.hand !== "right") {
      invalidNotes.push(index);
    }
    if (Number.isFinite(note.midi) && (note.midi < PLAYER_MIN_MIDI || note.midi > PLAYER_MAX_MIDI)) {
      rangeNotes.push({ index, midi: note.midi, time: note.time });
    }
    if (previous && note.time < previous.time - 0.001) {
      unsorted.push({ index, previousTime: previous.time, time: note.time });
    }
    previous = note;

    const sameMidi = byMidi.get(note.midi) || [];
    const duplicate = sameMidi.find((candidate) => samePitchAtSameTime(candidate, note));
    if (duplicate) duplicates.push({ midi: note.midi, time: note.time });
    const overlap = sameMidi.find((candidate) => note.time > candidate.time + 0.01 && note.time < noteEnd(candidate) - 0.01);
    if (overlap) overlaps.push({ midi: note.midi, previousTime: overlap.time, time: note.time });
    sameMidi.push(note);
    byMidi.set(note.midi, sameMidi);
  });

  const metrics = arrayMetrics(notes, declaredDuration);

  if (notes.length === 0) issues.push(issue("critical", "empty_notes", `${arrayName} esta vazio.`));
  if (invalidNotes.length > 0) {
    issues.push(issue("critical", "invalid_note_values", `${arrayName} tem notas com midi/time/duration/hand invalidos.`, { count: invalidNotes.length }));
  }
  if (unsorted.length > 0) {
    issues.push(issue("medium", "unsorted_notes", `${arrayName} nao esta ordenado por tempo.`, { count: unsorted.length, examples: unsorted.slice(0, 5) }));
  }
  if (rangeNotes.length > 0) {
    issues.push(issue("high", "out_of_keyboard_range", `${arrayName} tem notas fora do teclado do player (${PLAYER_MIN_MIDI}-${PLAYER_MAX_MIDI}).`, { count: rangeNotes.length, examples: rangeNotes.slice(0, 5) }));
  }
  if (duplicates.length > 0) {
    issues.push(issue("medium", "duplicate_notes", `${arrayName} tem notas duplicadas no mesmo instante.`, { count: duplicates.length, examples: duplicates.slice(0, 5) }));
  }
  if (overlaps.length > 0) {
    issues.push(issue("medium", "same_pitch_overlap", `${arrayName} tem sobreposicao da mesma tecla antes da nota anterior terminar.`, { count: overlaps.length, examples: overlaps.slice(0, 5) }));
  }
  if (metrics.firstTime > 4) {
    issues.push(issue("medium", "late_start", `${arrayName} demora ${metrics.firstTime}s para a primeira nota cair.`));
  }
  if (metrics.longestGap > 10) {
    issues.push(issue("medium", "long_silence", `${arrayName} tem silencio interno longo de ${metrics.longestGap}s.`));
  }
  if (declaredDuration > 0 && metrics.lastEnd > declaredDuration + 1) {
    issues.push(issue("high", "declared_duration_short", `${arrayName} termina depois da duracao declarada.`, { lastEnd: metrics.lastEnd, declaredDuration }));
  }
  if (declaredDuration > 0 && declaredDuration - metrics.lastEnd > 8) {
    issues.push(issue("medium", "declared_duration_long", `${arrayName} termina cedo demais para a duracao declarada.`, { lastEnd: metrics.lastEnd, declaredDuration }));
  }
  if (metrics.shortestDuration > 0 && metrics.shortestDuration < 0.04) {
    issues.push(issue("medium", "too_short_durations", `${arrayName} tem duracoes curtas demais para leitura/score.`, { shortestDuration: metrics.shortestDuration }));
  }
  if (metrics.longestDuration > 12) {
    issues.push(issue("low", "very_long_durations", `${arrayName} tem notas sustentadas muito longas; precisa renderizar sustain corretamente.`, { longestDuration: metrics.longestDuration }));
  }

  return { metrics, issues };
}

function auditSong(entry) {
  const issues = [];
  const filePath = path.join(SONGS_DIR, entry.outputFile);
  const metadata = songCatalogMetadata[entry.id] || {};
  const midiSizes = entry.midiFiles.map((fileName) => {
    const midiPath = path.join(MIDI_DIR, fileName);
    return fs.existsSync(midiPath) ? fs.statSync(midiPath).size : 0;
  });

  if (!fs.existsSync(filePath)) {
    return {
      id: entry.id,
      outputFile: entry.outputFile,
      title: entry.id,
      loadOk: false,
      severityScore: ISSUE_WEIGHT.critical,
      status: "critical",
      issues: [issue("critical", "missing_json", "Arquivo JSON da musica nao existe.")],
      metrics: {},
      midiSizes,
    };
  }

  let song;
  try {
    song = readJson(filePath);
  } catch (error) {
    return {
      id: entry.id,
      outputFile: entry.outputFile,
      title: entry.id,
      loadOk: false,
      severityScore: ISSUE_WEIGHT.critical,
      status: "critical",
      issues: [issue("critical", "json_parse_error", `JSON invalido: ${error.message}`)],
      metrics: {},
      midiSizes,
    };
  }

  const title = normalizeText(song.title) || entry.id;
  const declaredDifficulty = normalizeDifficulty(song.difficulty);

  if (song.id !== entry.id) {
    issues.push(issue("medium", "id_mismatch", "ID interno do JSON difere do manifest.", { jsonId: song.id, manifestId: entry.id }));
  }
  if (!Number.isFinite(song.bpm) || song.bpm <= 0) {
    issues.push(issue("critical", "invalid_bpm", "BPM invalido."));
  } else if (song.bpm < 45 || song.bpm > 180) {
    issues.push(issue("medium", "suspicious_bpm", `BPM suspeito para aula: ${song.bpm}.`));
  }
  if (!Number.isFinite(song.duration) || song.duration <= 0) {
    issues.push(issue("critical", "invalid_duration", "Duracao invalida."));
  }
  if (!metadata.allowCompactSource && midiSizes.every((size) => size > 0 && size < 1000)) {
    issues.push(issue("medium", "tiny_midi_source", "Fonte MIDI muito pequena; risco de arranjo pobre/incompleto.", { midiSizes }));
  }

  const arrays = {
    notes: getNotes(song, "notes"),
    notes1Hand: getNotes(song, "notes1Hand"),
    notes2Hands: getNotes(song, "notes2Hands"),
    "arrangements.easy": getNotes(song, "arrangements.easy"),
    "arrangements.medium": getNotes(song, "arrangements.medium"),
    "arrangements.hard": getNotes(song, "arrangements.hard"),
  };

  const metrics = {};
  for (const [name, notes] of Object.entries(arrays)) {
    const result = auditArray(song, name, notes, song.duration);
    metrics[name] = result.metrics;
    issues.push(...result.issues);
  }

  if (arrays.notes.length > 0 && arrays["arrangements.hard"].length > 0) {
    const ratio = arrays["arrangements.hard"].length / arrays.notes.length;
    if (ratio < 0.92 || ratio > 1.08) {
      issues.push(issue("medium", "hard_not_equivalent_to_notes", "arrangements.hard nao representa bem o conjunto principal notes.", { notes: arrays.notes.length, hard: arrays["arrangements.hard"].length, ratio: round(ratio) }));
    }
  }

  const easyHands = handCounts(arrays["arrangements.easy"]);
  const oneHandHands = handCounts(arrays.notes1Hand);
  if (arrays.notes1Hand.length > 0 && oneHandHands.left > 0) {
    issues.push(issue("high", "notes1hand_has_left_hand", "notes1Hand deveria ser tocavel com uma mao direita, mas contem mao esquerda.", oneHandHands));
  }
  if (arrays["arrangements.easy"].length > 0 && easyHands.left / arrays["arrangements.easy"].length > 0.05) {
    issues.push(issue("medium", "easy_has_too_much_left_hand", "Arranjo facil tem muita mao esquerda para iniciante.", easyHands));
  }

  const hardHands = handCounts(arrays.notes2Hands.length ? arrays.notes2Hands : arrays.notes);
  if (hardHands.left === 0 && hardHands.right > 80) {
    issues.push(issue("low", "no_left_hand_content", "Musica nao tem material de mao esquerda; modo 2 maos fica pouco completo."));
  }

  const suspiciousRightLow = arrays.notes.filter((note) => note.hand === "right" && note.midi < 48).length;
  const suspiciousLeftHigh = arrays.notes.filter((note) => note.hand === "left" && note.midi > 72).length;
  if (suspiciousRightLow + suspiciousLeftHigh > Math.max(3, arrays.notes.length * 0.02)) {
    issues.push(issue("medium", "suspicious_hand_marking", "Marcacao de maos parece incoerente em parte das notas.", { rightBelowC3: suspiciousRightLow, leftAboveC5: suspiciousLeftHigh }));
  }

  const playerModes = {};
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const handMode of ["right", "left", "both"]) {
      const selected = selectForPlayer(song, difficulty, handMode);
      playerModes[`${difficulty}.${handMode}`] = selected.length;
      if (selected.length === 0 && (handMode !== "left" || hardHands.left > 0)) {
        issues.push(issue("high", "player_mode_empty", `Player ficaria sem notas em ${difficulty}/${handMode}.`));
      }
    }
  }

  const easyMelody = melodyPreservation(arrays.notes, arrays["arrangements.easy"].length ? arrays["arrangements.easy"] : arrays.notes1Hand);
  if (easyMelody.compared > 8 && easyMelody.ratio < 0.65) {
    issues.push(issue("high", "easy_melody_not_preserved", "Versao facil parece distante da melodia principal.", easyMelody));
  }

  const easyMetrics = metrics["arrangements.easy"];
  if (easyMetrics.maxChord > 2 || easyMetrics.maxHandSpan > 11 || easyMetrics.density > 115 || easyMetrics.shortestDuration < 0.12) {
    issues.push(issue("medium", "easy_too_hard", "Versao facil ainda parece dificil para iniciante.", {
      density: easyMetrics.density,
      maxChord: easyMetrics.maxChord,
      maxHandSpan: easyMetrics.maxHandSpan,
      shortestDuration: easyMetrics.shortestDuration,
    }));
  }

  const mediumMetrics = metrics["arrangements.medium"];
  if (mediumMetrics.count > 0 && (mediumMetrics.density < 12 || mediumMetrics.maxChord === 0)) {
    issues.push(issue("low", "medium_too_sparse", "Versao intermediaria esta simples/esparsa demais."));
  }
  if (mediumMetrics.maxChord > 5 || mediumMetrics.maxHandSpan > 16 || mediumMetrics.density > 190) {
    issues.push(issue("medium", "medium_too_hard", "Versao intermediaria pode estar dificil demais.", {
      density: mediumMetrics.density,
      maxChord: mediumMetrics.maxChord,
      maxHandSpan: mediumMetrics.maxHandSpan,
    }));
  }

  const hardMetrics = metrics["arrangements.hard"];
  if (declaredDifficulty === "hard" && hardMetrics.density < 20 && hardMetrics.maxChord <= 1) {
    issues.push(issue("medium", "hard_label_too_easy", "Musica marcada como dificil parece simples demais pelo material atual."));
  }

  const estimated = {
    easy: estimateLevel(easyMetrics),
    medium: estimateLevel(mediumMetrics),
    hard: estimateLevel(hardMetrics),
    catalog: estimateLevel(metrics.notes),
  };

  if (declaredDifficulty !== "unknown") {
    const expected = declaredDifficulty === "easy" ? ["easy"] : declaredDifficulty === "medium" ? ["medium", "hard"] : ["hard", "pro"];
    if (!expected.includes(estimated.catalog)) {
      issues.push(issue("low", "catalog_difficulty_mismatch", "Dificuldade do catalogo nao combina com a estimativa tecnica.", { declared: declaredDifficulty, estimated: estimated.catalog }));
    }
  }

  if (hardMetrics.maxChord >= 8) {
    issues.push(issue("medium", "dense_chord_cluster", "Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.", { maxChord: hardMetrics.maxChord }));
  }
  if (hardMetrics.semitoneClashGroups > Math.max(5, groupByTime(arrays.notes).length * 0.08)) {
    issues.push(issue("low", "many_semitone_clashes", "Ha muitas segundas menores simultaneas; revisar harmonia/voicing se nao for intencional.", { semitoneClashGroups: hardMetrics.semitoneClashGroups }));
  }

  const severityScore = issues.reduce((sum, item) => sum + ISSUE_WEIGHT[item.severity], 0);
  const worst = issues.reduce((current, item) => (ISSUE_WEIGHT[item.severity] > ISSUE_WEIGHT[current] ? item.severity : current), "low");
  const status = issues.some((item) => item.severity === "critical")
    ? "critical"
    : issues.some((item) => item.severity === "high")
      ? "needs_fix"
      : issues.length > 0
        ? "review"
        : "ok";

  return {
    id: entry.id,
    outputFile: entry.outputFile,
    title,
    artist: normalizeText(song.artist),
    category: normalizeText(song.category),
    difficulty: normalizeText(song.difficulty),
    declaredDifficulty,
    estimated,
    loadOk: true,
    bpm: song.bpm,
    duration: song.duration,
    midiSizes,
    severityScore,
    worstSeverity: worst,
    status,
    playerModes,
    melodyPreservation: easyMelody,
    metrics,
    issues,
  };
}

function issueSummary(songs) {
  const summary = {
    songs: songs.length,
    ok: songs.filter((song) => song.status === "ok").length,
    review: songs.filter((song) => song.status === "review").length,
    needsFix: songs.filter((song) => song.status === "needs_fix").length,
    critical: songs.filter((song) => song.status === "critical").length,
    issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    issuesByCode: {},
  };

  for (const song of songs) {
    for (const item of song.issues) {
      summary.issuesBySeverity[item.severity] += 1;
      summary.issuesByCode[item.code] = (summary.issuesByCode[item.code] || 0) + 1;
    }
  }

  return summary;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function topIssues(song, limit = 3) {
  return [...song.issues]
    .sort((a, b) => ISSUE_WEIGHT[b.severity] - ISSUE_WEIGHT[a.severity])
    .slice(0, limit)
    .map((item) => `[${item.severity}] ${item.message}`)
    .join("<br>");
}

function renderMarkdown(report) {
  const topSongs = [...report.songs].sort((a, b) => b.severityScore - a.severityScore).slice(0, 20);
  const codeCounts = Object.entries(report.summary.issuesByCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([code, count]) => `- ${code}: ${count}`)
    .join("\n");

  const rows = report.songs
    .map((song) => {
      const easy = song.metrics["arrangements.easy"];
      const hard = song.metrics["arrangements.hard"];
      return [
        song.id,
        song.title,
        song.difficulty,
        levelLabel(song.estimated.catalog),
        levelLabel(song.estimated.easy),
        `${easy.count}/${hard.count}`,
        `${easy.maxChord}/${hard.maxChord}`,
        `${easy.density}/${hard.density}`,
        song.status,
        topIssues(song, 2) || "Sem alertas",
      ]
        .map(mdEscape)
        .join(" | ");
    })
    .join("\n");

  const topRows = topSongs
    .map((song) => `- ${song.id}: ${song.severityScore} pontos, status ${song.status}. ${topIssues(song, 3) || "Sem alertas"}`)
    .join("\n");

  return `# Auditoria da biblioteca de musicas

Gerado em ${report.generatedAt}.

Esta auditoria verifica consistencia interna, tocabilidade no player, marcacao de maos, dificuldade pedagogica, duracoes, lacunas, duplicidades e sinais harmonicos suspeitos. Fidelidade absoluta a cada obra original precisa de conferencia com partitura/audio de referencia por musica; aqui o relatorio aponta onde essa revisao humana deve entrar primeiro.

## Resumo

- Musicas analisadas: ${report.summary.songs}
- OK: ${report.summary.ok}
- Revisao leve: ${report.summary.review}
- Precisa correcao: ${report.summary.needsFix}
- Criticas: ${report.summary.critical}
- Issues por severidade: critical=${report.summary.issuesBySeverity.critical}, high=${report.summary.issuesBySeverity.high}, medium=${report.summary.issuesBySeverity.medium}, low=${report.summary.issuesBySeverity.low}

## Problemas mais frequentes

${codeCounts || "- Nenhum problema encontrado"}

## Prioridade de revisao

${topRows || "- Nenhuma musica prioritaria"}

## Tabela por musica

| ID | Titulo | Nivel catalogo | Nivel estimado | Easy estimado | Notas easy/hard | Acordes easy/hard | Densidade easy/hard | Status | Principais alertas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function main() {
  const songs = songManifest.map(auditSong);
  const report = {
    generatedAt: new Date().toISOString(),
    assumptions: {
      playerMidiRange: [PLAYER_MIN_MIDI, PLAYER_MAX_MIDI],
      groupWindowSeconds: GROUP_WINDOW,
      melodyMatchWindowSeconds: NOTE_MATCH_WINDOW,
      originalFidelity: "Requires external score/audio references for final musicological approval.",
    },
    summary: issueSummary(songs),
    songs,
  };

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, renderMarkdown(report), "utf8");

  console.log(`Auditadas ${report.summary.songs} musica(s).`);
  console.log(`OK=${report.summary.ok} | revisao=${report.summary.review} | precisa correcao=${report.summary.needsFix} | criticas=${report.summary.critical}`);
  console.log(`Issues: critical=${report.summary.issuesBySeverity.critical}, high=${report.summary.issuesBySeverity.high}, medium=${report.summary.issuesBySeverity.medium}, low=${report.summary.issuesBySeverity.low}`);
  console.log(`Relatorios gerados:`);
  console.log(`- ${path.relative(ROOT_DIR, REPORT_MD)}`);
  console.log(`- ${path.relative(ROOT_DIR, REPORT_JSON)}`);
}

main();
