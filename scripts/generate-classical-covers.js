// Covers for the classical catalog (public/images/covers/classicos).
//   node scripts/generate-classical-covers.js && npm run build-song-catalog-index
// Pieces that already had illustrated artwork reuse it; the rest get an SVG cover with the
// composer's palette and a symbol for the piece. The bottom of each cover stays free because
// the library card prints the title and composer there.
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const coversDir = path.join(rootDir, "public", "images", "covers");
const classicalDir = path.join(coversDir, "classicos");

// Illustrated covers that were in public/images/covers but not linked to any song.
const ILLUSTRATED = {
  "fur-elise": "fur_elise_1775056434348.png",
  "moonlight-sonata": "moonlight_sonata.png",
  "nocturne-op9": "nocturne_op9.png",
  "turkish-march": "turkish_march.png",
  "bach-prelude": "bach_prelude.png",
  "minueto-em-sol-maior": "minueto_bach.png",
  "ode-to-joy": "ode_alegria_1775056393157.png",
};

// [light, accent, deep]
const COMPOSERS = {
  Chopin: ["#fbcfe8", "#db2777", "#1e0a24"],
  Mozart: ["#fde68a", "#d4a017", "#0c2433"],
  Tchaikovsky: ["#dbeafe", "#3b82f6", "#0b1238"],
  Bach: ["#fed7aa", "#c2410c", "#1c1210"],
  Debussy: ["#ccfbf1", "#14b8a6", "#04201f"],
  Beethoven: ["#fecaca", "#dc2626", "#1a0606"],
  "Rimsky-Korsakov": ["#fef3c7", "#d97706", "#1c1917"],
};

const PIECES = [
  { id: "the-seasons-januarytchaikovsky", composer: "Tchaikovsky", title: "As Estações: Janeiro", symbol: "candle" },
  { id: "the-seasons-februarytchaikovsky", composer: "Tchaikovsky", title: "As Estações: Fevereiro", symbol: "feather" },
  { id: "the-seasons-augusttchaikovsky", composer: "Tchaikovsky", title: "As Estações: Agosto", symbol: "sun" },
  { id: "old-french-songtchaikosvky", composer: "Tchaikovsky", title: "Canção Francesa Antiga", symbol: "lily" },
  { id: "doumkatchaikosvky", composer: "Tchaikovsky", title: "Dumka", symbol: "wave" },
  { id: "march-of-the-wooden-soldierstchaikovsky", composer: "Tchaikovsky", title: "Marcha dos Soldadinhos de Madeira", symbol: "drum" },
  { id: "morning-prayertchaikovsky", composer: "Tchaikovsky", title: "Oração da Manhã", symbol: "sunrise" },
  { id: "ballade-4chopin", composer: "Chopin", title: "Balada nº 4", symbol: "lyre" },
  { id: "etude-a-mollchopin", composer: "Chopin", title: "Estudo em Lá Menor", symbol: "storm" },
  { id: "chopin-fantaisie-impromptuchopin", composer: "Chopin", title: "Fantasia-Impromptu", symbol: "flame" },
  { id: "preludio-n-15-chopin", composer: "Chopin", title: "Prelúdio nº 15 (Gota d'Água)", symbol: "rain" },
  { id: "preludio-n-20-chopin", composer: "Chopin", title: "Prelúdio nº 20", symbol: "candle" },
  { id: "preludio-n-6-chopin", composer: "Chopin", title: "Prelúdio nº 6", symbol: "wave" },
  { id: "preludio-numero7chopin", composer: "Chopin", title: "Prelúdio nº 7", symbol: "feather" },
  { id: "prelude-op-28-no-4-suffocation-chopin", composer: "Chopin", title: "Prelúdio Op. 28 nº 4", symbol: "lily" },
  { id: "preludio-chopin", composer: "Chopin", title: "Prelúdio Op. 45", symbol: "moon" },
  { id: "sonata-2bmoll-chopin", composer: "Chopin", title: "Sonata nº 2: Finale", symbol: "storm" },
  { id: "trois-nouvelles-etudes-no-1-f-minorchopin", composer: "Chopin", title: "Três Novos Estudos nº 1", symbol: "lyre" },
  { id: "minute-waltz", composer: "Chopin", title: "Valsa do Minuto", symbol: "clock" },
  { id: "fantasy-in-d-minormozart", composer: "Mozart", title: "Fantasia em Ré Menor", symbol: "flame" },
  { id: "fuguefragmentmozart", composer: "Mozart", title: "Fragmento de Fuga", symbol: "spiral" },
  { id: "fugue-in-e-flat-major-kv-153375fmozart", composer: "Mozart", title: "Fuga em Mi Bemol Maior", symbol: "spiral" },
  { id: "gigue-in-g-majormozart", composer: "Mozart", title: "Giga em Sol Maior", symbol: "feather" },
  { id: "marche-funebre-kv-453amozart", composer: "Mozart", title: "Marcha Fúnebre", symbol: "lily" },
  { id: "notteegiornomozart", composer: "Mozart", title: "Noite e Dia", symbol: "daynight" },
  { id: "sonata-in-c-major-fragment-mozart", composer: "Mozart", title: "Sonata em Dó Maior", symbol: "laurel" },
  { id: "piano-sonata-in-c-major-kv-309-1st-part-mozart", composer: "Mozart", title: "Sonata KV 309", symbol: "laurel" },
  { id: "das-wohltemperierte-clavier-ii-praeludium-iijsbach", composer: "Bach", title: "O Cravo Bem Temperado II", symbol: "spiral" },
  { id: "fugue-sur-le-nom-de-bachrimsky-korsakov", composer: "Rimsky-Korsakov", title: "Fuga sobre o Nome de Bach", symbol: "spiral" },
  { id: "suite-bergamasque-clair-de-lunedebussy", composer: "Debussy", title: "Clair de Lune", symbol: "moon" },
  { id: "premiere-arabesquedebussy", composer: "Debussy", title: "Primeira Arabesca", symbol: "wave" },
];

const escapeXml = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const seeded = (index, salt) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function stars(seed) {
  return Array.from({ length: 46 }, (_, i) => {
    const x = (seeded(i + seed, 1) * 512).toFixed(1);
    const y = (seeded(i + seed, 2) * 470).toFixed(1);
    const r = (seeded(i + seed, 3) * 1.6 + 0.5).toFixed(2);
    const o = (seeded(i + seed, 4) * 0.6 + 0.25).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
  }).join("");
}

// Five golden staff lines sweeping behind the symbol.
function staff(light, seed) {
  const tilt = (seeded(seed, 9) - 0.5) * 60;
  return Array.from({ length: 5 }, (_, i) => {
    const y = 236 + i * 14;
    return `<path d="M-20 ${y + tilt} C 140 ${y - 70}, 360 ${y + 70}, 532 ${y - tilt}" stroke="${light}" stroke-opacity="0.22" stroke-width="2" fill="none"/>`;
  }).join("");
}

function note(x, y, color, scale) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" opacity="0.75"><ellipse cx="0" cy="40" rx="14" ry="10" transform="rotate(-20 0 40)"/><rect x="11" y="-6" width="4" height="46"/><path d="M15 -6c14 6 22 14 24 28-6-8-14-12-24-14z"/></g>`;
}

function symbolMarkup(symbol, [light, accent, deep]) {
  const line = `stroke="${light}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const thin = `stroke="${light}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;
  const cx = 256;
  const cy = 250;
  const symbols = {
    moon: `<circle cx="${cx}" cy="${cy}" r="96" fill="${light}" opacity="0.14"/><path d="M${cx + 30} ${cy - 92}a96 96 0 1 0 54 168 78 78 0 1 1-54-168z" fill="${light}"/><circle cx="${cx - 74}" cy="${cy - 60}" r="5" fill="${light}"/><circle cx="${cx + 82}" cy="${cy + 44}" r="4" fill="${light}"/>`,
    sun: `<circle cx="${cx}" cy="${cy}" r="58" fill="${light}"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${(cx + Math.cos(a) * 78).toFixed(1)} ${(cy + Math.sin(a) * 78).toFixed(1)}L${(cx + Math.cos(a) * 108).toFixed(1)} ${(cy + Math.sin(a) * 108).toFixed(1)}" ${line}/>`; }).join("")}`,
    sunrise: `<path d="M${cx - 120} ${cy + 50}h240" ${line}/><path d="M${cx - 66} ${cy + 50}a66 66 0 0 1 132 0z" fill="${light}"/>${Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i * Math.PI) / 6; return `<path d="M${(cx + Math.cos(a) * 88).toFixed(1)} ${(cy + 50 + Math.sin(a) * 88).toFixed(1)}L${(cx + Math.cos(a) * 116).toFixed(1)} ${(cy + 50 + Math.sin(a) * 116).toFixed(1)}" ${line}/>`; }).join("")}<path d="M${cx - 90} ${cy + 84}h180M${cx - 56} ${cy + 112}h112" ${thin} opacity="0.7"/>`,
    candle: `<circle cx="${cx}" cy="${cy - 70}" r="70" fill="${light}" opacity="0.16"/><path d="M${cx} ${cy - 118}c26 30 22 58 0 66-22-8-26-36 0-66z" fill="${light}"/><path d="M${cx} ${cy - 84}c8 10 6 20 0 24-6-4-8-14 0-24z" fill="${accent}"/><rect x="${cx - 26}" y="${cy - 46}" width="52" height="130" rx="10" fill="${light}" opacity="0.92"/><path d="M${cx - 70} ${cy + 96}h140" ${line}/>`,
    feather: `<path d="M${cx + 86} ${cy - 110}C${cx - 40} ${cy - 90} ${cx - 90} ${cy + 10} ${cx - 96} ${cy + 110}c60-30 150-80 182-220z" fill="${light}" opacity="0.92"/><path d="M${cx - 110} ${cy + 126}L${cx + 70} ${cy - 92}" stroke="${deep}" stroke-width="4" stroke-linecap="round"/>${[0, 1, 2, 3].map((i) => `<path d="M${cx - 40 + i * 30} ${cy + 50 - i * 36}l${30 - i * 4} -6" stroke="${deep}" stroke-width="3" opacity="0.5"/>`).join("")}`,
    lily: `<path d="M${cx} ${cy + 120}V${cy - 10}" ${line}/>${[-1, 0, 1].map((s) => `<path d="M${cx} ${cy - 10}c${s * 70} -20 ${s * 70} -100 0 -120c${s * -10} 40 ${s * -6} 80 0 120z" fill="${light}" opacity="${s === 0 ? 1 : 0.85}" transform="rotate(${s * 32} ${cx} ${cy - 10})"/>`).join("")}<path d="M${cx} ${cy + 70}c40-10 60-40 64-70-36 6-58 30-64 70z" fill="${accent}"/>`,
    wave: [0, 1, 2].map((i) => `<path d="M${cx - 150} ${cy - 40 + i * 48}c50-46 100-46 150 0s100 46 150 0" ${line} fill="none" opacity="${1 - i * 0.25}"/>`).join("") + note(cx + 70, cy - 150, light, 0.9),
    drum: `<ellipse cx="${cx}" cy="${cy - 40}" rx="96" ry="28" fill="${light}"/><path d="M${cx - 96} ${cy - 40}v120c0 16 43 28 96 28s96-12 96-28V${cy - 40}" fill="${accent}" ${line}/><path d="M${cx - 96} ${cy - 30}l40 120M${cx - 40} ${cy - 10}l40 110M${cx + 20} ${cy - 10}l40 110M${cx + 96} ${cy - 30}l-36 120" ${thin}/><path d="M${cx - 60} ${cy - 140}l40 80M${cx + 60} ${cy - 140}l-40 80" stroke="${light}" stroke-width="9" stroke-linecap="round"/>`,
    lyre: `<path d="M${cx - 70} ${cy + 100}c-60-60-50-170 10-200M${cx + 70} ${cy + 100}c60-60 50-170-10-200" ${line} fill="none"/><path d="M${cx - 78} ${cy + 100}h156" ${line}/><path d="M${cx - 64} ${cy - 70}h128" ${line}/>${[-36, -12, 12, 36].map((dx) => `<path d="M${cx + dx} ${cy - 70}V${cy + 100}" stroke="${light}" stroke-width="3" opacity="0.8"/>`).join("")}`,
    storm: `<path d="M${cx - 110} ${cy - 40}a50 50 0 0 1 60-60 66 66 0 0 1 124 10 46 46 0 0 1 36 86H${cx - 104}a40 40 0 0 1-6-36z" fill="${light}" opacity="0.9"/><path d="M${cx + 4} ${cy + 0}l-40 70h36l-24 70 70-92h-38l26-48z" fill="${accent}" stroke="${light}" stroke-width="4" stroke-linejoin="round"/>`,
    rain: `<path d="M${cx - 110} ${cy - 60}a50 50 0 0 1 60-60 66 66 0 0 1 124 10 46 46 0 0 1 36 86H${cx - 104}a40 40 0 0 1-6-36z" fill="${light}" opacity="0.9"/>${[[-70, 60], [-20, 90], [30, 60], [80, 96], [-40, 140], [50, 140]].map(([dx, dy]) => `<path d="M${cx + dx} ${cy + dy - 24}c10 14 14 22 0 30-14-8-10-16 0-30z" fill="${light}"/>`).join("")}`,
    flame: `<circle cx="${cx}" cy="${cy}" r="100" fill="${accent}" opacity="0.25"/><path d="M${cx} ${cy - 130}c70 60 90 120 60 170-14 24-38 40-60 40s-46-16-60-40c-24-42-8-90 26-120 0 30 10 50 30 56-10-46 0-80 4-106z" fill="${light}"/><path d="M${cx} ${cy - 10}c26 30 30 56 14 74-6 6-14 8-14 8s-8-2-14-8c-14-16-8-44 14-74z" fill="${accent}"/>`,
    spiral: `<path d="M${cx} ${cy}m-8 0a8 8 0 1 1 16 0a20 20 0 1 1-40 0a36 36 0 1 1 72 0a54 54 0 1 1-108 0a74 74 0 1 1 148 0a96 96 0 1 1-192 0" ${line} fill="none"/>${note(cx + 96, cy - 150, light, 0.8)}`,
    daynight: `<circle cx="${cx}" cy="${cy}" r="100" fill="${light}" opacity="0.12"/><path d="M${cx} ${cy - 90}a90 90 0 0 1 0 180z" fill="${light}"/><path d="M${cx} ${cy - 90}a90 90 0 0 0 0 180 64 64 0 0 1 0-180z" fill="${accent}"/>${Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; return `<path d="M${(cx + Math.cos(a) * 108).toFixed(1)} ${(cy + Math.sin(a) * 108).toFixed(1)}L${(cx + Math.cos(a) * 130).toFixed(1)} ${(cy + Math.sin(a) * 130).toFixed(1)}" ${thin}/>`; }).join("")}<circle cx="${cx - 120}" cy="${cy - 40}" r="5" fill="${light}"/><circle cx="${cx - 96}" cy="${cy + 70}" r="4" fill="${light}"/>`,
    laurel: `${[-1, 1].map((s) => `<path d="M${cx} ${cy + 120}c${s * -90} -20 ${s * -120} -120 ${s * -70} -220" ${line} fill="none"/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${cx + s * (-78 - (i % 2) * 8 + i * 6)}" cy="${cy + 90 - i * 46}" rx="22" ry="10" fill="${light}" transform="rotate(${s * (-40 + i * 6)} ${cx + s * (-78 + i * 6)} ${cy + 90 - i * 46})"/>`).join("")}`).join("")}${note(cx - 18, cy - 70, accent, 1.5)}`,
    clock: `<circle cx="${cx}" cy="${cy}" r="96" fill="${light}" opacity="0.95"/><circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="${accent}" stroke-width="8"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<circle cx="${(cx + Math.cos(a) * 76).toFixed(1)}" cy="${(cy + Math.sin(a) * 76).toFixed(1)}" r="${i % 3 === 0 ? 6 : 3}" fill="${deep}"/>`; }).join("")}<path d="M${cx} ${cy}V${cy - 60}M${cx} ${cy}l44 22" stroke="${deep}" stroke-width="8" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="${accent}"/>${note(cx + 100, cy - 150, light, 0.8)}`,
  };
  return symbols[symbol] ?? symbols.lyre;
}

function buildSvg(piece, index) {
  const palette = COMPOSERS[piece.composer];
  const [light, accent, deep] = palette;
  const title = escapeXml(piece.title);
  const long = piece.composer.length > 11;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640" role="img" aria-labelledby="title">
  <title id="title">${title} · ${piece.composer}</title>
  <defs>
    <radialGradient id="glow" cx="50%" cy="36%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.75"/>
      <stop offset="55%" stop-color="${deep}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${deep}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="${deep}" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.92"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="512" height="640" fill="${deep}"/>
  <rect width="512" height="640" fill="url(#glow)"/>
  ${stars(index * 47)}
  ${staff(light, index)}
  <g filter="url(#soft)">${symbolMarkup(piece.symbol, palette)}</g>
  ${note(70, 330 + (index % 3) * 20, light, 0.55)}${note(420, 120 + (index % 4) * 18, light, 0.5)}
  <path d="M${long ? 116 : 176} 66h-${long ? 70 : 80}M${long ? 396 : 336} 66h${long ? 70 : 80}" stroke="${light}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="256" y="72" text-anchor="middle" fill="${light}" font-family="Georgia, 'Times New Roman', serif" font-size="${long ? 17 : 22}" font-weight="700" letter-spacing="${long ? 4 : 7}">${escapeXml(piece.composer.toUpperCase())}</text>
  <rect width="512" height="640" fill="url(#fade)"/>
  <rect x="14" y="14" width="484" height="612" rx="30" fill="none" stroke="${light}" stroke-opacity="0.18" stroke-width="2"/>
</svg>
`;
}

function main() {
  fs.mkdirSync(classicalDir, { recursive: true });
  for (const [id, file] of Object.entries(ILLUSTRATED)) {
    fs.copyFileSync(path.join(coversDir, file), path.join(classicalDir, `${id}.png`));
  }
  PIECES.forEach((piece, index) => {
    fs.writeFileSync(path.join(classicalDir, `${piece.id}.svg`), buildSvg(piece, index), "utf8");
  });
  console.log(`Linked ${Object.keys(ILLUSTRATED).length} illustrated covers and generated ${PIECES.length} SVG covers.`);
}

main();
