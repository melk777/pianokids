const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public", "songs");
const REPORT_JSON = path.join(ROOT_DIR, "docs", "player-mode-audit.json");
const REPORT_MD = path.join(ROOT_DIR, "docs", "player-mode-audit.md");

const PLAYER_MIN_MIDI = 36;
const PLAYER_MAX_MIDI = 84;
const DIFFICULTIES = ["beginner", "medium", "pro"];
const HAND_MODES = [
  { id: "right", includeLeftHand: false, includeRightHand: true },
  { id: "left", includeLeftHand: true, includeRightHand: false },
  { id: "both", includeLeftHand: true, includeRightHand: true },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function noteEnd(note) {
  return Number(note.time) + Number(note.duration);
}

function isLeft(note) {
  if (note.hand === "left") return true;
  if (note.hand === "right") return false;
  return note.midi < 60;
}

function arrangementLevel(difficulty) {
  if (difficulty === "beginner") return "easy";
  if (difficulty === "medium") return "medium";
  return "hard";
}

function getNotes(song, key) {
  if (key === "notes") return Array.isArray(song.notes) ? song.notes : [];
  if (key === "notes1Hand") return Array.isArray(song.notes1Hand) ? song.notes1Hand : [];
  if (key === "notes2Hands") return Array.isArray(song.notes2Hands) ? song.notes2Hands : [];
  const level = key.replace("arrangements.", "");
  return Array.isArray(song.arrangements?.[level]) ? song.arrangements[level] : [];
}

function filterByDifficulty(notes, difficulty) {
  if (difficulty !== "beginner") return notes;
  return notes.filter((note) => note.midi >= 60 && note.duration >= 0.15 && note.hand !== "left");
}

function filterByHand(notes, handMode) {
  return notes.filter((note) => {
    const left = isLeft(note);
    return (left && handMode.includeLeftHand) || (!left && handMode.includeRightHand);
  });
}

function selectPlayerNotes(song, difficulty, handMode) {
  const level = arrangementLevel(difficulty);
  const wantsLeftOnly = handMode.includeLeftHand && !handMode.includeRightHand;
  const wantsRightOnly = handMode.includeRightHand && !handMode.includeLeftHand;
  const preferOneHand = wantsLeftOnly || wantsRightOnly;
  const candidates = [];

  if (preferOneHand && wantsRightOnly) candidates.push(getNotes(song, "notes1Hand"));
  candidates.push(getNotes(song, `arrangements.${level}`));
  if (!preferOneHand) candidates.push(getNotes(song, "notes2Hands"));
  if (preferOneHand && !wantsLeftOnly) candidates.push(getNotes(song, "notes1Hand"));
  candidates.push(getNotes(song, "notes2Hands"), filterByDifficulty(getNotes(song, "notes"), difficulty), getNotes(song, "notes"));

  for (const candidate of candidates) {
    const selected = filterByHand(candidate, handMode);
    if (selected.length === 0) continue;

    const lastEnd = Math.max(...selected.map(noteEnd));
    const sparseOneHandMode =
      handMode.includeLeftHand !== handMode.includeRightHand &&
      (Number(song.duration) || 0) > 12 &&
      selected.length < 3 &&
      (Number(song.duration) || 0) - lastEnd > Math.max(8, (Number(song.duration) || 0) * 0.22);

    if (sparseOneHandMode) continue;

    return selected;
  }

  return [];
}

function selectAccompaniment(song, difficulty, handMode) {
  const bothHands = handMode.includeLeftHand && handMode.includeRightHand;
  if (bothHands) return [];

  const arrangement = selectPlayerNotes(song, difficulty, {
    includeLeftHand: true,
    includeRightHand: true,
  });
  const backing = filterByHand(arrangement.length > 0 ? arrangement : getNotes(song, "notes"), {
    includeLeftHand: handMode.includeRightHand,
    includeRightHand: handMode.includeLeftHand,
  });

  if (backing.length > 0) return backing;

  const fallbackBacking = filterByHand(getNotes(song, "notes"), {
    includeLeftHand: handMode.includeRightHand,
    includeRightHand: handMode.includeLeftHand,
  });
  if (fallbackBacking.length > 0) return fallbackBacking;

  return filterByHand(getNotes(song, "notes2Hands"), {
    includeLeftHand: handMode.includeRightHand,
    includeRightHand: handMode.includeLeftHand,
  });
}

function addIssue(issues, severity, code, message, details = {}) {
  issues.push({ severity, code, message, ...details });
}

function auditMode(song, difficulty, handMode) {
  const issues = [];
  const notes = selectPlayerNotes(song, difficulty, handMode);
  const studentNoteKeys = new Set(notes.map((note) => `${Math.round(note.time * 100)}:${note.midi}`));
  const accompaniment = selectAccompaniment(song, difficulty, handMode).filter(
    (note) => !studentNoteKeys.has(`${Math.round(note.time * 100)}:${note.midi}`),
  );
  const duration = Number(song.duration) || 0;
  const sorted = [...notes].sort((a, b) => Number(a.time) - Number(b.time) || Number(a.midi) - Number(b.midi));
  const lastEnd = sorted.length > 0 ? Math.max(...sorted.map(noteEnd)) : 0;
  const accompanimentLastEnd = accompaniment.length > 0 ? Math.max(...accompaniment.map(noteEnd)) : 0;

  if (notes.length === 0) {
    addIssue(issues, "critical", "mode_empty", "Modo do player ficou sem notas.");
  }

  for (const note of notes) {
    if (!Number.isFinite(note.midi) || note.midi < PLAYER_MIN_MIDI || note.midi > PLAYER_MAX_MIDI) {
      addIssue(issues, "critical", "out_of_range", "Nota fora do alcance do teclado do player.", { midi: note.midi });
    }
    if (!Number.isFinite(note.time) || note.time < 0) {
      addIssue(issues, "critical", "bad_time", "Nota com tempo invalido.", { time: note.time });
    }
    if (!Number.isFinite(note.duration) || note.duration <= 0 || note.duration > 12) {
      addIssue(issues, "high", "bad_duration", "Nota com duracao suspeita para o player.", { duration: note.duration });
    }
    const left = isLeft(note);
    if (handMode.id === "right" && left) addIssue(issues, "high", "wrong_hand", "Modo mao direita recebeu nota de mao esquerda.");
    if (handMode.id === "left" && !left) addIssue(issues, "high", "wrong_hand", "Modo mao esquerda recebeu nota de mao direita.");
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.time < previous.time) {
      addIssue(issues, "medium", "unsorted", "Notas fora de ordem temporal.");
      break;
    }
  }

  if (duration > 0 && lastEnd > duration + 2) {
    addIssue(issues, "high", "ends_after_duration", "Modo termina depois da duracao declarada.", {
      lastEnd: Number(lastEnd.toFixed(2)),
      duration,
    });
  }

  if (duration > 12 && Math.max(lastEnd, accompanimentLastEnd) > 0 && duration - Math.max(lastEnd, accompanimentLastEnd) > Math.max(8, duration * 0.22)) {
    addIssue(issues, "medium", "long_tail_silence", "Modo pode terminar cedo demais e deixar silencio longo no player.", {
      lastEnd: Number(lastEnd.toFixed(2)),
      accompanimentLastEnd: Number(accompanimentLastEnd.toFixed(2)),
      duration,
    });
  }

  if (handMode.id !== "both" && accompaniment.length === 0) {
    addIssue(issues, "low", "missing_accompaniment", "Modo de uma mao ficou sem acompanhamento separado.");
  }

  const overlap = new Set(notes.map((note) => `${Math.round(note.time * 100)}:${note.midi}`));
  const accompanimentOverlap = accompaniment.filter((note) => overlap.has(`${Math.round(note.time * 100)}:${note.midi}`)).length;
  if (handMode.id !== "both" && accompanimentOverlap > Math.max(4, notes.length * 0.2)) {
    addIssue(issues, "medium", "accompaniment_overlap", "Acompanhamento toca notas demais que deveriam ser do aluno.", {
      overlap: accompanimentOverlap,
    });
  }

  return {
    difficulty,
    handMode: handMode.id,
    notes: notes.length,
    accompaniment: accompaniment.length,
    firstTime: sorted[0]?.time ?? 0,
    lastEnd: Number(lastEnd.toFixed(3)),
    issues,
  };
}

function severityScore(severity) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[severity] ?? 0;
}

function statusFor(issues) {
  const max = Math.max(0, ...issues.map((item) => severityScore(item.severity)));
  if (max >= 4) return "precisa correcao";
  if (max >= 2) return "revisao";
  return "OK";
}

function main() {
  const songFiles = fs
    .readdirSync(SONGS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const songs = songFiles.map((file) => readJson(path.join(SONGS_DIR, file)));
  const modes = [];

  for (const song of songs) {
    for (const difficulty of DIFFICULTIES) {
      for (const handMode of HAND_MODES) {
        const result = auditMode(song, difficulty, handMode);
        modes.push({
          songId: song.id,
          title: song.title,
          ...result,
          status: statusFor(result.issues),
        });
      }
    }
  }

  const issues = modes.flatMap((mode) =>
    mode.issues.map((issue) => ({
      songId: mode.songId,
      title: mode.title,
      difficulty: mode.difficulty,
      handMode: mode.handMode,
      ...issue,
    })),
  );
  const statusCounts = modes.reduce((acc, mode) => {
    acc[mode.status] = (acc[mode.status] ?? 0) + 1;
    return acc;
  }, {});
  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] ?? 0) + 1;
    return acc;
  }, {});

  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(
    REPORT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        songs: songs.length,
        modes: modes.length,
        statusCounts,
        severityCounts,
        issues,
        modes,
      },
      null,
      2,
    ),
  );

  const rows = modes
    .filter((mode) => mode.status !== "OK")
    .slice(0, 120)
    .map((mode) => {
      const issueText = mode.issues.map((item) => `${item.severity}:${item.code}`).join(", ");
      return `| ${mode.songId} | ${mode.difficulty} | ${mode.handMode} | ${mode.notes} | ${mode.accompaniment} | ${mode.status} | ${issueText} |`;
    });
  const md = [
    "# Auditoria dos modos reais do player",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    "",
    `Musicas: ${songs.length}`,
    `Modos testados: ${modes.length}`,
    `OK: ${statusCounts.OK ?? 0}`,
    `Revisao: ${statusCounts.revisao ?? 0}`,
    `Precisa correcao: ${statusCounts["precisa correcao"] ?? 0}`,
    "",
    `Issues: critical=${severityCounts.critical ?? 0}, high=${severityCounts.high ?? 0}, medium=${severityCounts.medium ?? 0}, low=${severityCounts.low ?? 0}`,
    "",
    "## Modos com alerta",
    "",
    "| Musica | Dificuldade | Mao | Notas | Acompanhamento | Status | Alertas |",
    "|---|---:|---:|---:|---:|---|---|",
    ...(rows.length > 0 ? rows : ["| - | - | - | - | - | OK | Nenhum alerta |"]),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD, md);

  console.log(`Modos auditados: ${modes.length} (${songs.length} musicas).`);
  console.log(`OK=${statusCounts.OK ?? 0} | revisao=${statusCounts.revisao ?? 0} | precisa correcao=${statusCounts["precisa correcao"] ?? 0}`);
  console.log(`Issues: critical=${severityCounts.critical ?? 0}, high=${severityCounts.high ?? 0}, medium=${severityCounts.medium ?? 0}, low=${severityCounts.low ?? 0}`);
  console.log("Relatorios gerados:");
  console.log(`- ${path.relative(ROOT_DIR, REPORT_MD)}`);
  console.log(`- ${path.relative(ROOT_DIR, REPORT_JSON)}`);

  if ((severityCounts.critical ?? 0) > 0 || (severityCounts.high ?? 0) > 0) {
    process.exitCode = 1;
  }
}

main();
