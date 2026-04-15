const VALID_HANDS = new Set(["left", "right"]);

function inferHandFromNote(note) {
  if (typeof note?.hand === "string") {
    const normalizedHand = note.hand.toLowerCase();
    if (VALID_HANDS.has(normalizedHand)) {
      return normalizedHand;
    }
  }

  return Number(note?.midi) < 60 ? "left" : "right";
}

function normalizeNotesWithHands(notes) {
  if (!Array.isArray(notes)) return [];

  return notes.map((note) => ({
    ...note,
    hand: inferHandFromNote(note),
  }));
}

function normalizeSongHands(songJson) {
  const arrangements = songJson?.arrangements ?? {};

  return {
    ...songJson,
    notes: normalizeNotesWithHands(songJson?.notes),
    notes1Hand: normalizeNotesWithHands(songJson?.notes1Hand),
    notes2Hands: normalizeNotesWithHands(songJson?.notes2Hands),
    arrangements: {
      ...arrangements,
      easy: normalizeNotesWithHands(arrangements.easy),
      medium: normalizeNotesWithHands(arrangements.medium),
      hard: normalizeNotesWithHands(arrangements.hard),
    },
  };
}

function keepOnlyRightHandNotes(notes) {
  return normalizeNotesWithHands(notes).filter((note) => note.hand === "right");
}

function sanitizeSingleHandArrangements(songJson) {
  const normalizedSong = normalizeSongHands(songJson);

  return {
    ...normalizedSong,
    notes1Hand: keepOnlyRightHandNotes(normalizedSong.notes1Hand),
    arrangements: {
      ...normalizedSong.arrangements,
      easy: keepOnlyRightHandNotes(normalizedSong.arrangements?.easy),
    },
  };
}

function countLeftHandNotes(notes) {
  if (!Array.isArray(notes)) return 0;
  return notes.reduce((count, note) => count + (inferHandFromNote(note) === "left" ? 1 : 0), 0);
}

function validateSongHands(songJson) {
  const normalizedSong = normalizeSongHands(songJson);
  const notes1HandLeftCount = countLeftHandNotes(normalizedSong.notes1Hand);
  const easyLeftCount = countLeftHandNotes(normalizedSong.arrangements?.easy);

  return {
    normalizedSong,
    warnings: [
      ...(notes1HandLeftCount > 0
        ? [
            {
              code: "NOTES1HAND_CONTAINS_LEFT",
              count: notes1HandLeftCount,
              message: `notes1Hand ainda contem ${notes1HandLeftCount} nota(s) de mao esquerda.`,
            },
          ]
        : []),
      ...(easyLeftCount > 0
        ? [
            {
              code: "EASY_CONTAINS_LEFT",
              count: easyLeftCount,
              message: `arrangements.easy ainda contem ${easyLeftCount} nota(s) de mao esquerda.`,
            },
          ]
        : []),
    ],
  };
}

module.exports = {
  inferHandFromNote,
  normalizeNotesWithHands,
  normalizeSongHands,
  keepOnlyRightHandNotes,
  sanitizeSingleHandArrangements,
  countLeftHandNotes,
  validateSongHands,
};
