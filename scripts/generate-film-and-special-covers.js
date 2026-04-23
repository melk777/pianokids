const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const filmDir = path.join(rootDir, "public", "images", "covers", "intro-filmes");
const classicalDir = path.join(rootDir, "public", "images", "covers", "classicos");

const filmCovers = [
  {
    id: "ave-maria-schubert",
    title: "Ave Maria",
    mood: "catedral iluminada",
    palette: ["#fef3c7", "#f59e0b", "#3b0764"],
    symbol: "cathedral",
  },
  {
    id: "bella-ciao-lacasadepapel",
    title: "Bella Ciao",
    mood: "assalto cinematográfico",
    palette: ["#fee2e2", "#ef4444", "#111827"],
    symbol: "mask",
  },
  {
    id: "gymnopedie-no-1",
    title: "Gymnopédie nº 1",
    mood: "piano de cinema antigo",
    palette: ["#e0f2fe", "#38bdf8", "#172554"],
    symbol: "piano-reel",
  },
  {
    id: "swan-lake-napolitan-dance",
    title: "Lago dos Cisnes",
    mood: "ballet no lago",
    palette: ["#f8fafc", "#60a5fa", "#1e1b4b"],
    symbol: "swan",
  },
  {
    id: "in-the-hall-of-the-mountain-king",
    title: "Na Gruta do Rei da Montanha",
    mood: "aventura na caverna",
    palette: ["#fed7aa", "#f97316", "#431407"],
    symbol: "mountain",
  },
  {
    id: "toccata-and-fugue-d-minor",
    title: "Tocata e Fuga em Ré Menor",
    mood: "órgão dramático",
    palette: ["#e9d5ff", "#9333ea", "#020617"],
    symbol: "organ",
  },
];

const specialClassicalCovers = [
  {
    id: "fugue-sur-le-nom-de-bachrimsky-korsakov",
    title: "Fuga sobre o Nome de Bach",
    mood: "motivo B-A-C-H",
    palette: ["#fef3c7", "#d97706", "#1c1917"],
    symbol: "bach-name",
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sparkle(x, y, color = "#fff") {
  return `<path d="M${x} ${y - 18}l7 14 15 4-15 5-7 14-7-14-15-5 15-4z" fill="${color}" opacity="0.82"/>`;
}

function musicNote(x, y, color = "#fff", scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" opacity="0.7">
    <path d="M0 44c0-13 16-20 30-14V0h9v58c0 13-16 21-30 15C-4 67-8 51 0 44z"/>
    <path d="M39 0c22 4 38 14 52 30v13C76 30 60 22 39 18z"/>
  </g>`;
}

function filmStrip() {
  const holes = Array.from({ length: 8 }, (_, index) => {
    const x = 82 + index * 44;
    return `<rect x="${x}" y="86" width="22" height="28" rx="5" fill="#020617" opacity="0.48"/>
      <rect x="${x}" y="398" width="22" height="28" rx="5" fill="#020617" opacity="0.48"/>`;
  }).join("");

  return `<rect x="54" y="64" width="404" height="384" rx="38" fill="#fff" opacity="0.16" stroke="#fff" stroke-opacity="0.34" stroke-width="3"/>
  <path d="M70 132h372M70 380h372" stroke="#fff" stroke-opacity="0.28" stroke-width="5"/>
  ${holes}`;
}

function symbolMarkup(symbol, palette) {
  const [light, accent, deep] = palette;
  const stroke = `stroke="#111827" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const whiteStroke = `stroke="${light}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;

  const symbols = {
    cathedral: `<path d="M158 386V232l98-78 98 78v154z" fill="${light}" ${stroke}/><path d="M256 154v232" ${stroke} fill="none"/><path d="M206 386v-88c0-62 100-62 100 0v88" fill="${accent}" ${stroke}/><path d="M182 232l74-112 74 112" fill="none" ${stroke}/><circle cx="256" cy="236" r="28" fill="${accent}" ${stroke}/><path d="M256 206v60M226 236h60" ${stroke} fill="none"/>`,
    mask: `<path d="M154 232c52-52 152-52 204 0 14 76-20 142-102 168-82-26-116-92-102-168z" fill="#f8fafc" ${stroke}/><path d="M190 268c34-18 66-18 100 0M222 324c22 18 46 18 68 0" ${stroke} fill="none"/><circle cx="218" cy="292" r="12" fill="#111827"/><circle cx="294" cy="292" r="12" fill="#111827"/><path d="M156 386c74 44 126 44 200 0" stroke="${accent}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
    "piano-reel": `<rect x="126" y="258" width="260" height="126" rx="24" fill="#111827" stroke="${light}" stroke-width="7"/><path d="M154 326h204" stroke="${light}" stroke-width="5"/><g>${Array.from({ length: 10 }, (_, i) => `<rect x="${160 + i * 20}" y="326" width="14" height="48" fill="#fff"/><rect x="${171 + i * 20}" y="326" width="8" height="28" fill="#111827"/>`).join("")}</g><circle cx="196" cy="196" r="52" fill="${light}" ${stroke}/><circle cx="316" cy="196" r="52" fill="${light}" ${stroke}/><circle cx="196" cy="196" r="16" fill="${accent}"/><circle cx="316" cy="196" r="16" fill="${accent}"/><path d="M196 248h120" ${stroke} fill="none"/>`,
    swan: `<path d="M146 352c72-86 182-86 252 0-66 54-186 54-252 0z" fill="${light}" ${stroke}/><path d="M274 312c-8-82 48-140 116-120-46 28-70 68-76 120z" fill="${light}" ${stroke}/><path d="M376 194l38 18-36 18" fill="${accent}" ${stroke}/><circle cx="370" cy="194" r="6" fill="#111827"/><path d="M102 418c54-24 102-24 156 0s104 24 160 0" ${whiteStroke} fill="none"/>`,
    mountain: `<path d="M92 384l112-190 64 104 52-78 100 164z" fill="${deep}" stroke="${light}" stroke-width="7" stroke-linejoin="round"/><path d="M204 194l34 58 30-54 32 58 20-36" fill="none" ${whiteStroke}/><path d="M204 168l52-48 52 48-52 34z" fill="${accent}" ${stroke}/><path d="M256 120v82" ${stroke} fill="none"/><circle cx="256" cy="140" r="10" fill="${light}"/>`,
    organ: `<rect x="132" y="238" width="248" height="142" rx="22" fill="#111827" stroke="${light}" stroke-width="7"/><path d="M160 238V138h34v100M214 238V104h34v134M268 238V124h34v114M322 238V158h34v80" stroke="${light}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M158 324h196" stroke="${light}" stroke-width="5"/><g>${Array.from({ length: 9 }, (_, i) => `<rect x="${166 + i * 21}" y="324" width="15" height="44" fill="#fff"/><rect x="${178 + i * 21}" y="324" width="8" height="25" fill="#111827"/>`).join("")}</g>`,
    "bach-name": `<rect x="116" y="168" width="280" height="220" rx="28" fill="#fff8dc" ${stroke}/><path d="M154 228h204M154 260h204M154 292h204M154 324h204" stroke="#1c1917" stroke-width="4"/><text x="256" y="278" text-anchor="middle" fill="${deep}" font-family="Georgia, serif" font-size="54" font-weight="900">B-A-C-H</text><path d="M162 370c56-30 132-30 188 0" stroke="${accent}" stroke-width="10" fill="none" stroke-linecap="round"/>${musicNote(356, 146, accent, 0.55)}${musicNote(116, 338, accent, 0.48)}`,
  };

  return symbols[symbol] || symbols["piano-reel"];
}

function titleLines(title) {
  if (title.length <= 22) return [title];
  const words = title.split(" ");
  const lines = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if (`${current} ${word}`.trim().length > 22 && lines.length < 2) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`.trim();
    }
  }
  return lines;
}

function buildSvg(cover, kind) {
  const [light, accent, deep] = cover.palette;
  const title = escapeXml(cover.title);
  const mood = escapeXml(cover.mood);
  const lines = titleLines(title);
  const badge = kind === "film" ? "INTRO DE FILMES" : "CLÁSSICOS";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Capa da Pianify para ${title}</desc>
  <defs>
    <radialGradient id="bg" cx="48%" cy="20%" r="84%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="48%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#020617" flood-opacity="0.36"/>
    </filter>
  </defs>
  <rect width="512" height="640" rx="54" fill="${deep}"/>
  <rect width="512" height="640" rx="54" fill="url(#bg)"/>
  ${filmStrip()}
  ${sparkle(92, 176, light)}
  ${sparkle(420, 210, light)}
  ${musicNote(92, 330, light, 0.56)}
  ${musicNote(396, 338, light, 0.5)}
  <path d="M0 424C82 360 146 386 224 426c98 50 176 34 288-38v252H0z" fill="#020617" opacity="0.32"/>
  <g filter="url(#shadow)">
    ${symbolMarkup(cover.symbol, cover.palette)}
  </g>
  <rect x="58" y="474" width="396" height="120" rx="32" fill="#020617" opacity="0.48"/>
  <text x="256" y="508" text-anchor="middle" fill="${light}" opacity="0.88" font-family="Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="3.4">${badge}</text>
  <text x="256" y="${lines.length > 1 ? 546 : 564}" text-anchor="middle" fill="#fff" font-family="Georgia, 'Times New Roman', serif" font-size="${lines.length > 1 ? 30 : 36}" font-weight="900">${escapeXml(lines[0])}</text>
  ${lines[1] ? `<text x="256" y="580" text-anchor="middle" fill="#fff" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="900">${escapeXml(lines[1])}</text>` : ""}
  <text x="256" y="618" text-anchor="middle" fill="#fff" opacity="0.72" font-family="Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="2.6">${mood.toUpperCase()}</text>
</svg>
`;
}

function writeCovers(dir, covers, kind) {
  fs.mkdirSync(dir, { recursive: true });
  for (const cover of covers) {
    fs.writeFileSync(path.join(dir, `${cover.id}.svg`), buildSvg(cover, kind), "utf8");
  }
}

function main() {
  writeCovers(filmDir, filmCovers, "film");
  writeCovers(classicalDir, specialClassicalCovers, "classic");
  console.log(`Generated ${filmCovers.length} film covers and ${specialClassicalCovers.length} special classical cover.`);
}

main();
