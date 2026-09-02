const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT, "data", "songs");
const CATALOG_PATH = path.join(ROOT, "public", "song-catalog-index.json");
const CREDITS_PAGE_PATH = path.join(ROOT, "src", "app", "creditos", "page.tsx");
const REPORT_JSON = path.join(ROOT, "docs", "song-rights-audit.json");
const REPORT_MD = path.join(ROOT, "docs", "song-rights-audit.md");

const ACCEPTED_LICENSE_PATTERN = /public domain|creative commons|\bcc(?:0|\s+by)|traditional/i;
const ALLOWED_REVIEW_STATUSES = new Set(["pending_owner_review", "published"]);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function auditSong(fileName) {
  const song = loadJson(path.join(SONGS_DIR, fileName));
  const source = song.sourceProvenance || {};
  const errors = [];

  if (!song.id || !song.title || !song.artist) errors.push("Metadados basicos incompletos.");
  if (!ALLOWED_REVIEW_STATUSES.has(song.reviewStatus)) errors.push("Estado editorial invalido ou bloqueado.");
  if (source.canonical !== true) errors.push("Fonte canonica nao confirmada.");
  for (const field of ["title", "composer", "edition", "sourceUrl", "license", "licenseUrl", "verifiedAt"]) {
    if (!source[field]) errors.push(`Procedencia sem ${field}.`);
  }
  if (source.sourceUrl && !/^https:\/\//i.test(source.sourceUrl)) errors.push("URL da fonte nao usa HTTPS.");
  if (source.licenseUrl && !/^https:\/\//i.test(source.licenseUrl)) errors.push("URL da licenca nao usa HTTPS.");
  if (source.license && !ACCEPTED_LICENSE_PATTERN.test(source.license)) {
    errors.push("Licenca nao corresponde a dominio publico, Creative Commons ou obra tradicional documentada.");
  }

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    reviewStatus: song.reviewStatus,
    license: source.license || null,
    sourceUrl: source.sourceUrl || null,
    verifiedAt: source.verifiedAt || null,
    status: errors.length === 0 ? "documented" : "blocked",
    errors,
  };
}

function buildMarkdown(report) {
  const rows = report.songs
    .map(
      (song) =>
        `| ${song.title} | ${song.artist} | ${song.license || "-"} | ${song.reviewStatus || "-"} | ${song.status} | ${song.errors.join(" ") || "-"} |`,
    )
    .join("\n");

  return `# Auditoria de direitos e atribuicoes do catalogo\n\nGerado em ${report.generatedAt}. Esta auditoria verifica a existencia e a consistencia do registro de procedencia; ela nao substitui parecer juridico individual.\n\n## Resumo\n\n- Musicas verificadas: ${report.summary.songs}\n- Procedencias documentadas: ${report.summary.documented}\n- Bloqueadas: ${report.summary.blocked}\n- Capas externas no indice: ${report.summary.externalCovers}\n- Pagina publica de creditos: ${report.summary.creditsPage ? "sim" : "nao"}\n- Estado: ${report.summary.ready ? "pronto tecnicamente" : "bloqueado"}\n\n## Politica aplicada\n\n- Cada musica precisa registrar compositor, edicao, fonte HTTPS, licenca, URL da licenca e data de verificacao.\n- Somente dominio publico, obra tradicional documentada ou material Creative Commons compativel passa na verificacao automatica.\n- Gravacoes, letras modernas e arranjos de terceiros nao sao distribuidos pelo catalogo instrumental.\n- O indice comercial nao faz hotlink de capas externas.\n- A pagina publica /creditos preserva atribuicao e links de licenca.\n\n## Catalogo\n\n| Musica | Artista | Licenca | Estado editorial | Direitos | Pendencias |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`;
}

function main() {
  const songs = fs
    .readdirSync(SONGS_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map(auditSong);
  const catalog = loadJson(CATALOG_PATH);
  const externalCovers = catalog.filter((song) => /^https?:\/\//i.test(song.coverUrl || ""));
  const creditsPage = fs.existsSync(CREDITS_PAGE_PATH);
  const blocked = songs.filter((song) => song.status === "blocked");

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      songs: songs.length,
      documented: songs.length - blocked.length,
      blocked: blocked.length,
      externalCovers: externalCovers.length,
      creditsPage,
      ready: songs.length > 0 && blocked.length === 0 && externalCovers.length === 0 && creditsPage,
    },
    externalCoverIds: externalCovers.map((song) => song.id),
    songs,
  };

  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, buildMarkdown(report), "utf8");

  console.log(
    `Song rights audit: ${report.summary.documented}/${report.summary.songs} documented, ${report.summary.externalCovers} external covers.`,
  );
  if (!report.summary.ready) process.exitCode = 1;
}

main();
