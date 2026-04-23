const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "public", "images", "covers", "religiosos");

const covers = [
  {
    id: "alvo-mais-que-a-neve",
    title: "Alvo Mais que a Neve",
    subtitle: "pureza e luz",
    palette: ["#f8fafc", "#bae6fd", "#38bdf8"],
    symbol: "snow",
  },
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    subtitle: "graça sublime",
    palette: ["#fef3c7", "#f59e0b", "#7c2d12"],
    symbol: "light",
  },
  {
    id: "aos-pes-da-cruz",
    title: "Aos Pés da Cruz",
    subtitle: "entrega e fé",
    palette: ["#fee2e2", "#fb7185", "#7f1d1d"],
    symbol: "cross",
  },
  {
    id: "castelo-forte",
    title: "Castelo Forte",
    subtitle: "refúgio seguro",
    palette: ["#e0f2fe", "#0284c7", "#0f172a"],
    symbol: "fortress",
  },
  {
    id: "chuvas-de-graca",
    title: "Chuvas de Graça",
    subtitle: "renovo do céu",
    palette: ["#dcfce7", "#22c55e", "#14532d"],
    symbol: "rain",
  },
  {
    id: "conta-as-bencaos",
    title: "Conta as Bênçãos",
    subtitle: "gratidão diária",
    palette: ["#fef9c3", "#eab308", "#713f12"],
    symbol: "blessings",
  },
  {
    id: "coroai",
    title: "Coroai",
    subtitle: "majestade",
    palette: ["#fae8ff", "#c084fc", "#581c87"],
    symbol: "crown",
  },
  {
    id: "deus-velara-por-ti",
    title: "Deus Velará por Ti",
    subtitle: "cuidado constante",
    palette: ["#dbeafe", "#60a5fa", "#1e3a8a"],
    symbol: "shield",
  },
  {
    id: "firme-nas-promessas",
    title: "Firme nas Promessas",
    subtitle: "confiança",
    palette: ["#ede9fe", "#8b5cf6", "#312e81"],
    symbol: "anchor",
  },
  {
    id: "gloria-gloria-aleluia",
    title: "Glória, Glória, Aleluia",
    subtitle: "cântico de vitória",
    palette: ["#ffedd5", "#fb923c", "#7c2d12"],
    symbol: "trumpet",
  },
  {
    id: "jubiloso-te-adoramos",
    title: "Jubiloso, Te Adoramos",
    subtitle: "alegria e adoração",
    palette: ["#fef3c7", "#f97316", "#7c2d12"],
    symbol: "sun",
  },
  {
    id: "mais-perto-quero-estar",
    title: "Mais Perto Quero Estar",
    subtitle: "subida espiritual",
    palette: ["#ccfbf1", "#14b8a6", "#134e4a"],
    symbol: "steps",
  },
  {
    id: "manso-e-suave",
    title: "Manso e Suave",
    subtitle: "paz e convite",
    palette: ["#e0f2fe", "#67e8f9", "#164e63"],
    symbol: "dove",
  },
  {
    id: "noite-feliz",
    title: "Noite Feliz",
    subtitle: "estrela de natal",
    palette: ["#dbeafe", "#facc15", "#1e1b4b"],
    symbol: "star",
  },
  {
    id: "o-vem-o-vem-emanuel",
    title: "Ó Vem, Ó Vem, Emanuel",
    subtitle: "esperança",
    palette: ["#f3e8ff", "#a855f7", "#3b0764"],
    symbol: "candle",
  },
  {
    id: "rocha-eterna",
    title: "Rocha Eterna",
    subtitle: "fundamento firme",
    palette: ["#e5e7eb", "#64748b", "#111827"],
    symbol: "rock",
  },
  {
    id: "santo-santo-santo",
    title: "Santo, Santo, Santo",
    subtitle: "reverência",
    palette: ["#f8fafc", "#38bdf8", "#0f172a"],
    symbol: "halo",
  },
  {
    id: "sou-feliz-com-jesus",
    title: "Sou Feliz com Jesus",
    subtitle: "paz como um rio",
    palette: ["#cffafe", "#06b6d4", "#164e63"],
    symbol: "river",
  },
  {
    id: "tao-sublime-sacramento",
    title: "Tão Sublime Sacramento",
    subtitle: "adoração e mistério",
    palette: ["#fefce8", "#d4af37", "#422006"],
    symbol: "chalice",
  },
  {
    id: "vinde-fieis",
    title: "Vinde Fiéis",
    subtitle: "convite ao louvor",
    palette: ["#ecfccb", "#84cc16", "#365314"],
    symbol: "gathering",
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function symbolMarkup(symbol, accent, deep) {
  const common = `stroke="${accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const fill = `fill="${accent}"`;
  const softFill = `fill="${accent}" opacity="0.24"`;

  const symbols = {
    anchor: `<path ${common} d="M256 156v202"/><circle cx="256" cy="126" r="28" ${common}/><path ${common} d="M182 266h148"/><path ${common} d="M150 336c46 58 166 58 212 0"/><path ${common} d="M150 336l-28 36"/><path ${common} d="M362 336l28 36"/>`,
    blessings: `<path ${common} d="M182 206h148v170H182z"/><path ${common} d="M256 206v170"/><path ${common} d="M182 270h148"/><path ${common} d="M218 206c-36-54 48-78 38 0"/><path ${common} d="M294 206c36-54-48-78-38 0"/>`,
    candle: `<path ${common} d="M256 176c30 42-16 54 0 94 38-36 54-84 0-144z"/><path ${common} d="M214 290h84v98h-84z"/><path ${common} d="M190 388h132"/>`,
    chalice: `<path ${common} d="M188 156h136c0 84-30 132-68 132s-68-48-68-132z"/><path ${common} d="M256 288v70"/><path ${common} d="M210 358h92"/><path ${common} d="M184 396h144"/>`,
    cross: `<path ${common} d="M256 126v260"/><path ${common} d="M178 210h156"/><path ${common} d="M156 394h200"/><circle cx="256" cy="210" r="76" ${softFill}/>`,
    crown: `<path ${common} d="M150 322l32-128 74 76 74-76 32 128z"/><path ${common} d="M164 358h184"/><circle cx="182" cy="194" r="14" ${fill}/><circle cx="256" cy="164" r="14" ${fill}/><circle cx="330" cy="194" r="14" ${fill}/>`,
    dove: `<path ${common} d="M152 292c74-108 168-126 216-40-72-18-126 22-164 72"/><path ${common} d="M214 288c-12-56 10-102 62-136 4 62-10 104-42 140"/><path ${common} d="M318 246l48-42-18 60"/>`,
    fortress: `<path ${common} d="M150 380V190h52v50h54v-50h54v50h52v140"/><path ${common} d="M132 380h248"/><path ${common} d="M224 380v-78c0-42 64-42 64 0v78"/>`,
    gathering: `<circle cx="210" cy="224" r="26" ${common}/><circle cx="302" cy="224" r="26" ${common}/><circle cx="256" cy="188" r="30" ${common}/><path ${common} d="M158 350c12-58 92-58 104 0"/><path ${common} d="M250 350c12-58 92-58 104 0"/><path ${common} d="M196 336c12-70 108-70 120 0"/>`,
    halo: `<ellipse cx="256" cy="160" rx="86" ry="30" ${common}/><path ${common} d="M256 212v138"/><path ${common} d="M194 280h124"/><path ${common} d="M168 380h176"/>`,
    light: `<path ${common} d="M256 124v72"/><path ${common} d="M256 316v72"/><path ${common} d="M124 256h72"/><path ${common} d="M316 256h72"/><path ${common} d="M162 162l54 54"/><path ${common} d="M296 296l54 54"/><path ${common} d="M350 162l-54 54"/><path ${common} d="M216 296l-54 54"/><circle cx="256" cy="256" r="62" ${common}/><circle cx="256" cy="256" r="34" ${fill}/>`,
    rain: `<path ${common} d="M166 250c6-58 58-86 106-58 20-44 100-22 98 34 38 4 58 34 50 68H156"/><path ${common} d="M210 330l-18 42"/><path ${common} d="M270 330l-18 42"/><path ${common} d="M330 330l-18 42"/>`,
    river: `<path ${common} d="M136 248c42-34 88-34 138 0s98 34 142 0"/><path ${common} d="M136 308c42-34 88-34 138 0s98 34 142 0"/><path ${common} d="M136 368c42-34 88-34 138 0s98 34 142 0"/>`,
    rock: `<path ${common} d="M140 370l54-140 90-50 98 88-34 102z"/><path ${common} d="M194 230l54 72 36-122"/><path ${common} d="M248 302l100 68"/>`,
    shield: `<path ${common} d="M256 128l116 48v86c0 74-48 126-116 152-68-26-116-78-116-152v-86z"/><path ${common} d="M214 270l30 30 66-76"/>`,
    snow: `<path ${common} d="M256 134v244"/><path ${common} d="M150 195l212 122"/><path ${common} d="M362 195L150 317"/><path ${common} d="M216 154l40 36 40-36"/><path ${common} d="M216 358l40-36 40 36"/>`,
    star: `<path ${common} d="M256 132l36 78 84 10-62 58 16 84-74-42-74 42 16-84-62-58 84-10z"/><path ${common} d="M156 384h200"/><circle cx="256" cy="256" r="94" ${softFill}/>`,
    steps: `<path ${common} d="M154 376h204"/><path ${common} d="M190 330h150"/><path ${common} d="M226 284h96"/><path ${common} d="M262 238h42"/><path ${common} d="M304 196l44-44"/><path ${common} d="M348 152v54"/><path ${common} d="M348 152h-54"/>`,
    sun: `<circle cx="256" cy="238" r="70" ${common}/><path ${common} d="M256 120v42"/><path ${common} d="M256 314v42"/><path ${common} d="M138 238h42"/><path ${common} d="M332 238h42"/><path ${common} d="M172 154l30 30"/><path ${common} d="M310 292l30 30"/><path ${common} d="M340 154l-30 30"/><path ${common} d="M202 292l-30 30"/>`,
    trumpet: `<path ${common} d="M152 284h94l104-70v140L246 284"/><path ${common} d="M152 284v62c0 28 58 28 58 0v-62"/><path ${common} d="M350 214c38 18 38 122 0 140"/>`,
  };

  return symbols[symbol] || symbols.light;
}

function buildSvg(cover) {
  const [paper, accent, deep] = cover.palette;
  const title = escapeXml(cover.title);
  const subtitle = escapeXml(cover.subtitle);
  const titleLine1 = title.length > 23 ? title.slice(0, 23).trim() : title;
  const titleLine2 = title.length > 23 ? title.slice(23).trim() : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Capa religiosa da Pianify para ${title}</desc>
  <defs>
    <radialGradient id="halo" cx="50%" cy="20%" r="78%">
      <stop offset="0%" stop-color="${paper}" stop-opacity="1"/>
      <stop offset="42%" stop-color="${accent}" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="${deep}" stop-opacity="0.98"/>
    </radialGradient>
    <linearGradient id="stage" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="${paper}" stop-opacity="0.96"/>
      <stop offset="52%" stop-color="${accent}" stop-opacity="0.82"/>
      <stop offset="100%" stop-color="${deep}" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="glass" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58"/>
      <stop offset="54%" stop-color="${paper}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity="0.32"/>
    </filter>
  </defs>
  <rect width="512" height="640" rx="54" fill="${deep}"/>
  <rect width="512" height="640" rx="54" fill="url(#halo)"/>
  <g opacity="0.34" stroke="#fff" stroke-width="1.4">
    <path d="M52 96l102 122L52 340"/>
    <path d="M460 96L358 218l102 122"/>
    <path d="M154 218h204"/>
    <path d="M92 426c68-38 130-36 196 0s124 38 184 2"/>
  </g>
  <g opacity="0.82">
    <circle cx="82" cy="116" r="8" fill="${paper}"/>
    <circle cx="430" cy="122" r="10" fill="${paper}"/>
    <circle cx="92" cy="360" r="6" fill="${paper}"/>
    <circle cx="420" cy="356" r="7" fill="${paper}"/>
    <path d="M128 156c16-14 32-14 48 0" stroke="${paper}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M336 156c16-14 32-14 48 0" stroke="${paper}" stroke-width="5" stroke-linecap="round" fill="none"/>
  </g>
  <path d="M0 420C82 360 142 390 210 420C294 456 372 444 512 360V640H0Z" fill="#020617" opacity="0.30"/>
  <path d="M36 450C98 410 178 418 256 462C334 418 414 410 476 450V586C402 532 312 536 256 586C200 536 110 532 36 586Z" fill="#fff" opacity="0.18"/>
  <g filter="url(#softShadow)">
    <rect x="62" y="72" width="388" height="404" rx="42" fill="url(#glass)" stroke="${paper}" stroke-opacity="0.42" stroke-width="2"/>
    <path d="M96 124h320" stroke="${paper}" stroke-opacity="0.24" stroke-width="3"/>
    <path d="M96 424h320" stroke="${paper}" stroke-opacity="0.24" stroke-width="3"/>
  </g>
  <g opacity="0.42" fill="${paper}">
    <path d="M112 290c0-16 22-16 22 0v46c0 18-30 18-30 0 0-12 14-20 30-16v-30z"/>
    <path d="M382 300c0-16 22-16 22 0v46c0 18-30 18-30 0 0-12 14-20 30-16v-30z"/>
    <path d="M150 372c0-12 17-12 17 0v34c0 14-24 14-24 0 0-9 11-15 24-12v-22z"/>
  </g>
  <g transform="translate(0, -18)" filter="url(#glow)">
    <circle cx="256" cy="258" r="136" fill="url(#stage)" opacity="0.36"/>
    <circle cx="256" cy="258" r="114" fill="#020617" opacity="0.18"/>
    ${symbolMarkup(cover.symbol, paper, deep)}
  </g>
  <g transform="translate(0, 16)">
    <rect x="86" y="484" width="340" height="92" rx="28" fill="#020617" opacity="0.32"/>
    <text x="256" y="522" text-anchor="middle" fill="${paper}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleLine2 ? 30 : 35}" font-weight="800">
      ${titleLine1}
    </text>
    ${titleLine2 ? `<text x="256" y="558" text-anchor="middle" fill="${paper}" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="800">${titleLine2}</text>` : ""}
    <text x="256" y="${titleLine2 ? 600 : 570}" text-anchor="middle" fill="${paper}" opacity="0.88" font-family="Arial, sans-serif" font-size="13" font-weight="800" letter-spacing="3.2">
      ${subtitle.toUpperCase()}
    </text>
  </g>
</svg>
`;
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const cover of covers) {
    fs.writeFileSync(path.join(outputDir, `${cover.id}.svg`), buildSvg(cover), "utf8");
  }

  console.log(`Generated ${covers.length} religious covers.`);
}

main();
