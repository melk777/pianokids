const REPLACEMENTS = [
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00A1", "á"],
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00A9", "é"],
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00AD", "í"],
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00B3", "ó"],
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00BA", "ú"],
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00A3", "ã"],
  ["\u00C3\u0192\u00C6\u2019\u00C3\u201A\u00C2\u00A7", "ç"],
  ["\u00C3\u0192\u00C2\u00A1", "á"],
  ["\u00C3\u0192\u00C2\u00A9", "é"],
  ["\u00C3\u0192\u00C2\u00AD", "í"],
  ["\u00C3\u0192\u00C2\u00B3", "ó"],
  ["\u00C3\u0192\u00C2\u00BA", "ú"],
  ["\u00C3\u0192\u00C2\u00A3", "ã"],
  ["\u00C3\u0192\u00C2\u00A7", "ç"],
  ["\u00C3\u00A1", "á"],
  ["\u00C3\u00A9", "é"],
  ["\u00C3\u00AD", "í"],
  ["\u00C3\u00B3", "ó"],
  ["\u00C3\u00BA", "ú"],
  ["\u00C3\u00A3", "ã"],
  ["\u00C3\u00B5", "õ"],
  ["\u00C3\u00A7", "ç"],
  ["\u00C3\u00A0", "à"],
  ["\u00C3\u00A2", "â"],
  ["\u00C3\u00AA", "ê"],
  ["\u00C3\u00B4", "ô"],
  ["\u00C3\u0081", "Á"],
  ["\u00C3\u0089", "É"],
  ["\u00C3\u008D", "Í"],
  ["\u00C3\u0093", "Ó"],
  ["\u00C3\u009A", "Ú"],
  ["\u00C3\u0080", "À"],
  ["\u00C3\u0082", "Â"],
  ["\u00C3\u008A", "Ê"],
  ["\u00C3\u0094", "Ô"],
  ["\u00C2\u00BA", "º"],
  ["\u00C2\u00AA", "ª"],
  ["\u00E2\u20AC\u201C", "–"],
  ["\u00E2\u20AC\u201D", "—"],
  ["\u00E2\u20AC\u02DC", "‘"],
  ["\u00E2\u20AC\u2122", "’"],
  ["\u00E2\u20AC\u0153", "“"],
  ["\u00E2\u20AC\u009D", "”"],
];

function repairMojibake(value) {
  if (typeof value !== "string") return value;

  let normalized = value.replace(/\u0000/g, "").trim();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const previous = normalized;

    for (const [broken, fixed] of REPLACEMENTS) {
      normalized = normalized.split(broken).join(fixed);
    }

    if (normalized === previous) break;
  }

  return normalized;
}

module.exports = {
  repairMojibake,
};
