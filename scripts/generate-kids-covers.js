const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "public", "images", "covers", "infantis");

const covers = [
  { id: "a-canoa-virou", title: "A Canoa Virou", scene: "boat", colors: ["#7dd3fc", "#38bdf8", "#0369a1"] },
  { id: "a-dona-aranha", title: "A Dona Aranha", scene: "spider", colors: ["#fbcfe8", "#f472b6", "#9d174d"] },
  { id: "atirei-o-pau-no-gato", title: "Atirei o Pau no Gato", scene: "cat", colors: ["#fde68a", "#fb923c", "#9a3412"] },
  { id: "borboletinha", title: "Borboletinha", scene: "butterfly", colors: ["#fef3c7", "#fb7185", "#7c2d12"] },
  { id: "twinkle-twinkle", title: "Brilha Brilha Estrelinha", scene: "star", colors: ["#dbeafe", "#818cf8", "#312e81"] },
  { id: "carneirinho-carneirao", title: "Carneirinho, Carneirão", scene: "sheep", colors: ["#dcfce7", "#86efac", "#166534"] },
  { id: "ciranda-cirandinha", title: "Ciranda, Cirandinha", scene: "circle", colors: ["#ffedd5", "#fb7185", "#9f1239"] },
  { id: "escravos-de-jo", title: "Escravos de Jó", scene: "blocks", colors: ["#ede9fe", "#a78bfa", "#5b21b6"] },
  { id: "fui-no-itororo", title: "Fui no Itororó", scene: "fountain", colors: ["#cffafe", "#22d3ee", "#155e75"] },
  { id: "pintinho-amarelinho", title: "Meu Pintinho Amarelinho", scene: "chick", colors: ["#fef08a", "#facc15", "#854d0e"] },
  { id: "minha-machadinha", title: "Minha Machadinha", scene: "axe", colors: ["#e0f2fe", "#60a5fa", "#1d4ed8"] },
  { id: "o-cravo-e-a-rosa", title: "O Cravo e a Rosa", scene: "flowers", colors: ["#fce7f3", "#fb7185", "#9d174d"] },
  { id: "o-sapo-nao-lava-o-pe", title: "O Sapo não Lava o Pé", scene: "frog-foot", colors: ["#bbf7d0", "#22c55e", "#14532d"] },
  { id: "oh-que-belas-laranjas", title: "Oh! Que Belas Laranjas", scene: "oranges", colors: ["#fed7aa", "#fb923c", "#9a3412"] },
  { id: "onde-esta-a-margarida", title: "Onde Está a Margarida?", scene: "daisy", colors: ["#fef9c3", "#facc15", "#713f12"] },
  { id: "pai-francisco", title: "Pai Francisco", scene: "francisco", colors: ["#ccfbf1", "#2dd4bf", "#0f766e"] },
  { id: "parabens-pra-voce", title: "Parabéns pra Você", scene: "birthday", colors: ["#fbcfe8", "#f472b6", "#831843"] },
  { id: "passarinho-da-lagoa", title: "Passarinho da Lagoa", scene: "bird-lagoon", colors: ["#bae6fd", "#38bdf8", "#075985"] },
  { id: "peixe-vivo", title: "Peixe Vivo", scene: "fish", colors: ["#ccfbf1", "#06b6d4", "#164e63"] },
  { id: "pezinho", title: "Pezinho", scene: "feet", colors: ["#fef3c7", "#f59e0b", "#92400e"] },
  { id: "pirulito-que-bate-bate", title: "Pirulito que Bate Bate", scene: "lollipop", colors: ["#fae8ff", "#d946ef", "#86198f"] },
  { id: "samba-lele", title: "Samba Lelê", scene: "samba", colors: ["#dcfce7", "#4ade80", "#166534"] },
  { id: "sapo-cururu", title: "Sapo Cururu", scene: "frog", colors: ["#d9f99d", "#84cc16", "#3f6212"] },
  { id: "se-essa-rua-fosse-minha", title: "Se Essa Rua Fosse Minha", scene: "street", colors: ["#e0e7ff", "#818cf8", "#3730a3"] },
  { id: "teresinha-de-jesus", title: "Teresinha de Jesus", scene: "teresinha", colors: ["#ffe4e6", "#fb7185", "#9f1239"] },
  { id: "tutu-maramba", title: "Tutu Marambá", scene: "sleep", colors: ["#ddd6fe", "#8b5cf6", "#4c1d95"] },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function note(x, y, color = "#ffffff", scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" opacity="0.75">
    <path d="M0 42c0-11 14-18 27-13V0h8v54c0 12-14 19-26 14C-4 64-7 49 0 42z"/>
    <path d="M35 0c18 4 30 12 42 25v11c-12-12-25-18-42-22z"/>
  </g>`;
}

function cloud(x, y, fill = "#fff") {
  return `<g transform="translate(${x} ${y})" fill="${fill}" opacity="0.86">
    <circle cx="26" cy="32" r="22"/><circle cx="52" cy="22" r="28"/><circle cx="84" cy="34" r="24"/>
    <rect x="24" y="32" width="72" height="28" rx="14"/>
  </g>`;
}

function sparkle(x, y, color = "#fff") {
  return `<path d="M${x} ${y - 18}l7 14 15 4-15 5-7 14-7-14-15-5 15-4z" fill="${color}" opacity="0.85"/>`;
}

function child(x, y, shirt = "#f97316", skin = "#fcd7b6", hair = "#7c2d12") {
  return `<g transform="translate(${x} ${y})">
    <circle cx="0" cy="0" r="28" fill="${skin}" stroke="#fff" stroke-width="4"/>
    <path d="M-24-2c4-28 42-34 54-6-14-7-29 2-40-4-5 8-10 9-14 10z" fill="${hair}"/>
    <circle cx="-9" cy="2" r="3.5" fill="#111827"/><circle cx="10" cy="2" r="3.5" fill="#111827"/>
    <path d="M-10 13c8 8 21 8 29-1" stroke="#be123c" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M-34 64c4-36 64-36 68 0z" fill="${shirt}" stroke="#fff" stroke-width="4"/>
    <path d="M-34 46l-24 18" stroke="${skin}" stroke-width="12" stroke-linecap="round"/>
    <path d="M34 46l24 18" stroke="${skin}" stroke-width="12" stroke-linecap="round"/>
  </g>`;
}

function sceneMarkup(scene, palette) {
  const [light, mid, deep] = palette;
  const white = "#fff7ed";
  const stroke = 'stroke="#1f2937" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

  const scenes = {
    boat: `<path d="M98 344c88 38 228 38 316 0-20 68-78 104-158 104s-138-36-158-104z" fill="#f97316" ${stroke}/><path d="M256 172v172" ${stroke} fill="none"/><path d="M256 184c54 36 92 78 114 126H256z" fill="#fde68a" ${stroke}/><path d="M256 206c-54 32-90 70-112 114h112z" fill="#7dd3fc" ${stroke}/><path d="M76 456c54-24 110-24 168 0s120 24 192 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>${note(104, 132, white, 0.6)}${note(378, 160, white, 0.54)}`,
    spider: `<path d="M256 112v126" stroke="#fff" stroke-width="6" stroke-dasharray="10 10"/><circle cx="256" cy="306" r="64" fill="#7c3aed" ${stroke}/><circle cx="256" cy="230" r="44" fill="#a78bfa" ${stroke}/><circle cx="238" cy="224" r="9" fill="#111827"/><circle cx="274" cy="224" r="9" fill="#111827"/><path d="M238 246c12 12 25 12 37 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M200 294l-70-42M198 324l-82 10M210 354l-54 58M312 294l70-42M314 324l82 10M302 354l54 58" ${stroke} fill="none"/>`,
    cat: `<circle cx="256" cy="278" r="82" fill="#f59e0b" ${stroke}/><path d="M188 220l-22-54 62 30M324 220l22-54-62 30" fill="#f59e0b" ${stroke}/><circle cx="230" cy="268" r="9" fill="#111827"/><circle cx="282" cy="268" r="9" fill="#111827"/><path d="M256 284l-14 16h28z" fill="#fb7185"/><path d="M256 300c-16 18-34 18-50 4M256 300c16 18 34 18 50 4" stroke="#111827" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M126 388c82 38 178 40 260 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M134 188l78 44" stroke="#7c2d12" stroke-width="13" stroke-linecap="round"/>`,
    butterfly: `<path d="M250 270c-70-104-176-72-144 34 34 112 132 48 144-34z" fill="#fb7185" ${stroke}/><path d="M262 270c70-104 176-72 144 34-34 112-132 48-144-34z" fill="#38bdf8" ${stroke}/><ellipse cx="256" cy="298" rx="18" ry="74" fill="#6d28d9" ${stroke}/><circle cx="256" cy="214" r="22" fill="#6d28d9" ${stroke}/><path d="M240 198l-34-42M272 198l34-42" ${stroke} fill="none"/><circle cx="198" cy="296" r="18" fill="#fef08a"/><circle cx="324" cy="296" r="18" fill="#fef08a"/>`,
    star: `<path d="M256 116l46 96 106 14-78 74 20 104-94-54-94 54 20-104-78-74 106-14z" fill="#facc15" ${stroke}/><circle cx="236" cy="252" r="8" fill="#111827"/><circle cx="276" cy="252" r="8" fill="#111827"/><path d="M238 274c15 14 30 14 45 0" stroke="#111827" stroke-width="5" fill="none" stroke-linecap="round"/>${sparkle(126, 166)}${sparkle(398, 198)}${note(100, 382, white, 0.55)}${note(376, 382, white, 0.55)}`,
    sheep: `<ellipse cx="256" cy="306" rx="116" ry="78" fill="#fff" ${stroke}/><circle cx="178" cy="262" r="34" fill="#fff" ${stroke}/><circle cx="226" cy="238" r="38" fill="#fff" ${stroke}/><circle cx="286" cy="238" r="38" fill="#fff" ${stroke}/><circle cx="334" cy="262" r="34" fill="#fff" ${stroke}/><circle cx="256" cy="306" r="48" fill="#fde68a" ${stroke}/><circle cx="238" cy="300" r="6" fill="#111827"/><circle cx="274" cy="300" r="6" fill="#111827"/><path d="M240 324c11 9 22 9 33 0" stroke="#111827" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M198 378v54M314 378v54" ${stroke} fill="none"/>`,
    circle: `${child(178, 282, "#fb7185")} ${child(334, 282, "#38bdf8")} ${child(256, 210, "#facc15")}<path d="M144 394c72 56 152 56 224 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M112 384c94 96 194 96 288 0" stroke="#fff" stroke-width="4" fill="none" stroke-dasharray="8 12"/>`,
    blocks: `<rect x="120" y="282" width="76" height="76" rx="16" fill="#f97316" ${stroke}/><rect x="218" y="226" width="76" height="76" rx="16" fill="#22c55e" ${stroke}/><rect x="316" y="282" width="76" height="76" rx="16" fill="#38bdf8" ${stroke}/><text x="158" y="334" text-anchor="middle" font-size="38" font-weight="900" fill="#fff">J</text><text x="256" y="278" text-anchor="middle" font-size="38" font-weight="900" fill="#fff">Ó</text><text x="354" y="334" text-anchor="middle" font-size="38" font-weight="900" fill="#fff">♪</text><path d="M136 404h240" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
    fountain: `<path d="M176 384h160v54H176z" fill="#f97316" ${stroke}/><path d="M148 330h216c-8 44-42 66-108 66s-100-22-108-66z" fill="#38bdf8" ${stroke}/><path d="M256 324c-54-62-28-120 0-164 28 44 54 102 0 164z" fill="#bae6fd" ${stroke}/><path d="M202 286c-48-40-30-82 4-112M310 286c48-40 30-82-4-112" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    chick: `<ellipse cx="256" cy="320" rx="82" ry="94" fill="#facc15" ${stroke}/><circle cx="256" cy="234" r="62" fill="#fde047" ${stroke}/><path d="M256 254l42 18-42 22-42-22z" fill="#fb923c" ${stroke}/><circle cx="232" cy="224" r="8" fill="#111827"/><circle cx="280" cy="224" r="8" fill="#111827"/><path d="M188 318l-54-34M324 318l54-34" stroke="#facc15" stroke-width="18" stroke-linecap="round"/><path d="M222 416l-22 34M290 416l22 34" ${stroke} fill="none"/>`,
    axe: `<path d="M222 386l126-226" stroke="#92400e" stroke-width="20" stroke-linecap="round"/><path d="M322 146c52 12 74 48 68 86-34-24-64-24-104-6z" fill="#93c5fd" ${stroke}/><path d="M152 424c70-28 144-28 216 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>${note(128, 164, white, 0.5)}${note(384, 344, white, 0.48)}`,
    flowers: `<path d="M206 390c-20-92 4-150 50-202 46 52 70 110 50 202" stroke="#166534" stroke-width="10" fill="none"/><circle cx="196" cy="232" r="34" fill="#fb7185" ${stroke}/><circle cx="246" cy="210" r="34" fill="#f43f5e" ${stroke}/><circle cx="296" cy="232" r="34" fill="#fb7185" ${stroke}/><circle cx="246" cy="262" r="34" fill="#fef08a" ${stroke}/><path d="M306 334c46-32 84-28 112 12-46 34-84 30-112-12z" fill="#22c55e" ${stroke}/><path d="M206 334c-46-32-84-28-112 12 46 34 84 30 112-12z" fill="#22c55e" ${stroke}/>`,
    "frog-foot": `<ellipse cx="256" cy="276" rx="92" ry="70" fill="#22c55e" ${stroke}/><circle cx="218" cy="224" r="28" fill="#86efac" ${stroke}/><circle cx="294" cy="224" r="28" fill="#86efac" ${stroke}/><circle cx="218" cy="224" r="8" fill="#111827"/><circle cx="294" cy="224" r="8" fill="#111827"/><path d="M218 298c26 20 50 20 76 0" stroke="#14532d" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M152 386c30-40 78-44 112 0-34 28-76 30-112 0z" fill="#bbf7d0" ${stroke}/><path d="M292 386c30-40 78-44 112 0-34 28-76 30-112 0z" fill="#bbf7d0" ${stroke}/><path d="M126 438h260" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
    oranges: `<circle cx="202" cy="284" r="58" fill="#fb923c" ${stroke}/><circle cx="290" cy="300" r="66" fill="#f97316" ${stroke}/><circle cx="342" cy="246" r="46" fill="#fdba74" ${stroke}/><path d="M222 220c8-34 34-52 70-48" stroke="#166534" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M286 218c34-28 70-24 104 6-34 24-70 22-104-6z" fill="#22c55e" ${stroke}/><circle cx="184" cy="266" r="8" fill="#fff" opacity=".55"/><circle cx="276" cy="274" r="9" fill="#fff" opacity=".55"/>`,
    daisy: `<circle cx="256" cy="280" r="34" fill="#facc15" ${stroke}/>${Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI * 2) / 10; const x = 256 + Math.cos(a) * 62; const y = 280 + Math.sin(a) * 62; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="24" ry="38" fill="#fff" stroke="#1f2937" stroke-width="5" transform="rotate(${(i * 36).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join("")}<path d="M256 314v116" stroke="#166534" stroke-width="10" fill="none"/><path d="M256 382c-52-26-86-20-116 18 52 30 88 24 116-18z" fill="#22c55e" ${stroke}/>`,
    francisco: `${child(256, 236, "#22c55e", "#f7c59f", "#78350f")}<path d="M180 394h152" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M190 382c30-48 104-48 134 0" fill="#facc15" ${stroke}/><path d="M144 200c28-34 62-48 106-42" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>${note(370, 168, white, 0.56)}`,
    birthday: `<path d="M156 318h200v104H156z" fill="#f472b6" ${stroke}/><path d="M136 282h240v58H136z" fill="#fbcfe8" ${stroke}/><path d="M190 282v-46M256 282v-56M322 282v-46" stroke="#facc15" stroke-width="8" stroke-linecap="round"/><path d="M190 224c-16-16 8-24 0-42 24 20 26 34 0 42zM256 214c-16-16 8-24 0-42 24 20 26 34 0 42zM322 224c-16-16 8-24 0-42 24 20 26 34 0 42z" fill="#fb923c"/><circle cx="206" cy="366" r="10" fill="#fff"/><circle cx="256" cy="366" r="10" fill="#fff"/><circle cx="306" cy="366" r="10" fill="#fff"/>`,
    "bird-lagoon": `<ellipse cx="256" cy="398" rx="160" ry="38" fill="#38bdf8" ${stroke}/><path d="M210 250c46-72 126-56 152 14-48-18-82-8-112 40z" fill="#facc15" ${stroke}/><circle cx="220" cy="244" r="42" fill="#fde68a" ${stroke}/><path d="M184 238l-46-22 46-20z" fill="#fb923c" ${stroke}/><circle cx="230" cy="236" r="7" fill="#111827"/><path d="M286 286l42 56M260 300l-8 62" ${stroke} fill="none"/><path d="M126 412c44 22 84 22 128 0s84-22 128 0" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    fish: `<path d="M146 304c74-74 178-74 252 0-74 74-178 74-252 0z" fill="#22d3ee" ${stroke}/><path d="M398 304l58-54v108z" fill="#0ea5e9" ${stroke}/><circle cx="210" cy="292" r="8" fill="#111827"/><path d="M244 258c28 26 28 66 0 92" stroke="#fff" stroke-width="6" fill="none"/><path d="M112 220c-16-18 14-34 26-16 10-24 48-10 34 18" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>${note(346, 162, white, 0.5)}`,
    feet: `<path d="M180 352c-42-48-14-132 50-130 60 4 60 84 30 136-26 44-56 36-80-6z" fill="#fcd7b6" ${stroke}/><path d="M332 352c42-48 14-132-50-130-60 4-60 84-30 136 26 44 56 36 80-6z" fill="#fcd7b6" ${stroke}/><circle cx="206" cy="218" r="10" fill="#fcd7b6" ${stroke}/><circle cx="238" cy="218" r="10" fill="#fcd7b6" ${stroke}/><circle cx="306" cy="218" r="10" fill="#fcd7b6" ${stroke}/><circle cx="274" cy="218" r="10" fill="#fcd7b6" ${stroke}/><path d="M138 420h236" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
    lollipop: `<circle cx="256" cy="226" r="86" fill="#f472b6" ${stroke}/><path d="M256 140c66 40 74 132 0 172-66-40-74-132 0-172z" fill="#fff" opacity=".52"/><path d="M204 174c50 8 106 58 112 112" stroke="#a21caf" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M256 312v120" stroke="#fef3c7" stroke-width="18" stroke-linecap="round"/><path d="M158 400c70 48 126 48 196 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    samba: `${child(250, 250, "#facc15", "#8d5524", "#111827")}<path d="M164 402c54-66 130-66 184 0" fill="#22c55e" ${stroke}/><path d="M190 382h132" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M124 230c32-42 70-58 120-48" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>${note(374, 162, white, 0.62)}${note(110, 334, white, 0.54)}`,
    frog: `<ellipse cx="256" cy="292" rx="112" ry="86" fill="#65a30d" ${stroke}/><circle cx="208" cy="222" r="34" fill="#bef264" ${stroke}/><circle cx="304" cy="222" r="34" fill="#bef264" ${stroke}/><circle cx="208" cy="222" r="9" fill="#111827"/><circle cx="304" cy="222" r="9" fill="#111827"/><path d="M210 318c34 28 58 28 92 0" stroke="#14532d" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M146 388c38-34 74-34 108 0M258 388c38-34 74-34 108 0" stroke="#bef264" stroke-width="18" fill="none" stroke-linecap="round"/>`,
    street: `<path d="M78 430c92-120 264-120 356 0z" fill="#374151" ${stroke}/><path d="M256 244v188" stroke="#facc15" stroke-width="8" stroke-dasharray="18 16"/><path d="M92 260h328v80H92z" fill="#f9fafb" ${stroke}/><path d="M126 260v-72h68v72M318 260v-72h68v72" fill="#fb7185" ${stroke}/><circle cx="154" cy="222" r="12" fill="#fde68a"/><circle cx="354" cy="222" r="12" fill="#fde68a"/>${sparkle(256, 156, "#fff")}`,
    teresinha: `${child(256, 228, "#fb7185", "#f8c8a8", "#7c2d12")}<path d="M162 390c48-76 140-76 188 0z" fill="#f9a8d4" ${stroke}/><path d="M178 404h156" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M136 214c38-44 78-58 130-44" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>${sparkle(372, 184, "#fff")}`,
    sleep: `<path d="M128 356c60-76 196-76 256 0-34 54-222 54-256 0z" fill="#a78bfa" ${stroke}/><circle cx="222" cy="274" r="54" fill="#fcd7b6" ${stroke}/><path d="M190 260c20 14 44 14 64 0" stroke="#111827" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M318 204h42M342 174h50M374 144h60" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M128 410h256" stroke="#fff" stroke-width="8" stroke-linecap="round"/>${sparkle(128, 160, "#fff")}`,
  };

  return scenes[scene] || scenes.star;
}

function titleLines(title) {
  if (title.length <= 20) return [title];
  const words = title.split(" ");
  const lines = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if (`${current} ${word}`.trim().length > 20 && lines.length < 2) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`.trim();
    }
  }
  return lines;
}

function buildSvg(cover) {
  const [light, mid, deep] = cover.colors;
  const title = escapeXml(cover.title);
  const lines = titleLines(title);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Capa infantil cartoon da Pianify para ${title}</desc>
  <defs>
    <radialGradient id="sky" cx="42%" cy="18%" r="82%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="48%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </radialGradient>
    <linearGradient id="floor" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#111827" flood-opacity="0.32"/>
    </filter>
  </defs>
  <rect width="512" height="640" rx="56" fill="${deep}"/>
  <rect width="512" height="640" rx="56" fill="url(#sky)"/>
  ${cloud(44, 70)}
  ${cloud(332, 106, "#fff7ed")}
  ${sparkle(78, 254)}
  ${sparkle(430, 274)}
  <path d="M0 430C76 378 154 390 236 430c92 46 174 38 276-26v236H0z" fill="url(#floor)"/>
  <path d="M52 96c96-60 176-20 204 46 28-66 108-106 204-46v372c-86-54-162-42-204 22-42-64-118-76-204-22z" fill="#fff" opacity="0.22" stroke="#fff" stroke-opacity="0.44" stroke-width="3"/>
  <g filter="url(#shadow)">
    ${sceneMarkup(cover.scene, cover.colors)}
  </g>
  <g>
    <rect x="56" y="492" width="400" height="100" rx="30" fill="#020617" opacity="0.38"/>
    <text x="256" y="${lines.length > 1 ? 532 : 552}" text-anchor="middle" fill="#fff" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="${lines.length > 1 ? 31 : 36}" font-weight="900">
      ${escapeXml(lines[0])}
    </text>
    ${lines[1] ? `<text x="256" y="568" text-anchor="middle" fill="#fff" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="31" font-weight="900">${escapeXml(lines[1])}</text>` : ""}
  </g>
  <text x="256" y="616" text-anchor="middle" fill="#fff" opacity="0.86" font-family="Arial, sans-serif" font-size="13" font-weight="900" letter-spacing="3">
    PIANIFY KIDS
  </text>
</svg>
`;
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const fileName of fs.readdirSync(outputDir)) {
    if (fileName.endsWith(".svg")) {
      fs.unlinkSync(path.join(outputDir, fileName));
    }
  }

  for (const cover of covers) {
    fs.writeFileSync(path.join(outputDir, `${cover.id}.svg`), buildSvg(cover), "utf8");
  }

  console.log(`Generated ${covers.length} kids covers.`);
}

main();
