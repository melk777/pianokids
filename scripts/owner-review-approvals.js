// Songs the owner approved by listening to the review MIDIs (easy, medium and
// hard in output/music-review-rebuild). Approved songs are built with
// reviewStatus "published"; every other song stays "pending_owner_review".
// Add an entry only after listening to all three levels of the song.

const WAVE_5_HYMNS = [
  "que-seguranca",
  "a-deus-demos-gloria",
  "alegria-ao-mundo",
  "eis-dos-anjos-a-harmonia",
  "vem-tu-onipotente",
  "o-deus-nosso-socorro",
  "guiado-pela-mao",
  "formoso-senhor-jesus",
  "o-primeiro-natal",
  "junto-ao-rio",
  "louvai-ao-senhor-rei-poderoso",
  "sou-teu-senhor",
  "mais-amor-a-ti",
  "mil-linguas-eu-quisera-ter",
  "tal-qual-estou",
  "minha-fe-contempla-a-ti",
  "anjos-das-alturas",
  "como-um-pastor",
  "abre-meus-olhos",
  "jesus-chama",
  "doxologia",
  "comigo-habita",
];

const approvals = {};
for (const id of WAVE_5_HYMNS) {
  approvals[id] = {
    approvedAt: "2026-09-26",
    approvedBy: "owner",
    note: "Wave 5 hymns approved after listening review.",
  };
}

module.exports = approvals;
