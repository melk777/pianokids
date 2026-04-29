const DIRECT_REPLACEMENTS = [
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€¦", "…"],
  ["â€¢", "•"],
  ["â„¢", "™"],
  ["â˜…", "★"],
  ["âœ•", "✕"],
  ["âœ“", "✓"],
  ["ðŸŒŸ", "🌟"],
  ["ðŸ’ª", "💪"],
];

const SUSPECT_SEQUENCE_PATTERN = /Ã.|Â.|â€|â€|â„|â˜|âœ|ðŸ|�/;

function scoreMojibake(value) {
  return (value.match(/Ã|Â|â€|â„|â˜|âœ|ðŸ|�/g) || []).length;
}

function decodeLatin1Utf8(value) {
  return Buffer.from(value, "latin1").toString("utf8");
}

function applyDirectReplacements(value) {
  return DIRECT_REPLACEMENTS.reduce((text, [broken, fixed]) => text.split(broken).join(fixed), value);
}

function repairMojibake(value) {
  if (typeof value !== "string") return value;

  let normalized = value.replace(/\u0000/g, "").trim();
  normalized = applyDirectReplacements(normalized);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!SUSPECT_SEQUENCE_PATTERN.test(normalized)) break;

    const decoded = applyDirectReplacements(decodeLatin1Utf8(normalized));
    if (scoreMojibake(decoded) > scoreMojibake(normalized)) break;
    if (decoded === normalized) break;

    normalized = decoded;
  }

  return normalized;
}

module.exports = {
  repairMojibake,
};
