const fs = require("fs");
const path = require("path");
const songManifest = require("./song-manifest");
const pilotCanonicalSongs = require("../music-sources/pilot/canonical-songs");
const rebuildCanonicalSongs = require("../music-sources/rebuild/canonical-songs");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "data", "songs");
const PILOT_REPORT = path.join(ROOT_DIR, "docs", "music-pilot-audit.json");
const REBUILD_REPORT = path.join(ROOT_DIR, "docs", "song-rebuild-audit.json");
const REPORT_JSON = path.join(ROOT_DIR, "docs", "song-source-fidelity-audit.json");
const REPORT_MD = path.join(ROOT_DIR, "docs", "song-source-fidelity-audit.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildCanonicalEntries() {
  if (!fs.existsSync(PILOT_REPORT)) {
    throw new Error("Relatorio do lote piloto ausente. Rode npm run audit-music-pilot primeiro.");
  }
  const pilotReport = readJson(PILOT_REPORT);
  const pilotById = new Map(pilotReport.songs.map((song) => [song.id, song]));
  const entries = pilotCanonicalSongs.map((entry) => {
    const audit = pilotById.get(entry.id);
    if (!audit) throw new Error(`Auditoria canonica ausente para ${entry.id}.`);
    return {
      id: entry.id,
      title: audit.title,
      outputFile: entry.outputFile,
      sourceClass: "canonical",
      sourceKind: entry.source.kind,
      sourceUrl: entry.source.sourceUrl,
      license: entry.source.license,
      verifiedAt: entry.source.verifiedAt,
      exactFidelity: Boolean(audit.fidelity?.exact),
      status: audit.status,
      issues: audit.errors.map((message) => ({ severity: "high", code: "canonical_audit_failed", message })),
      warnings: audit.warnings,
    };
  });

  if (rebuildCanonicalSongs.length) {
    if (!fs.existsSync(REBUILD_REPORT)) {
      throw new Error("Relatorio das reconstrucoes ausente. Rode npm run audit-music-rebuild primeiro.");
    }
    const rebuildReport = readJson(REBUILD_REPORT);
    const rebuildById = new Map(rebuildReport.songs.map((song) => [song.id, song]));
    for (const entry of rebuildCanonicalSongs) {
      const audit = rebuildById.get(entry.id);
      if (!audit) throw new Error(`Auditoria de reconstrucao ausente para ${entry.id}.`);
      entries.push({
        id: entry.id,
        title: audit.title,
        outputFile: entry.outputFile,
        sourceClass: "canonical",
        sourceKind: entry.source.kind,
        sourceUrl: entry.source.sourceUrl,
        license: entry.source.license,
        verifiedAt: entry.source.verifiedAt,
        exactFidelity: Boolean(audit.fidelity?.exact),
        status: audit.status,
        issues: audit.errors.map((message) => ({ severity: "high", code: "canonical_audit_failed", message })),
        warnings: audit.warnings,
      });
    }
  }

  return entries;
}

function buildLegacyEntries(canonicalIds) {
  return songManifest
    .filter((entry) => !canonicalIds.has(entry.id))
    .map((entry) => {
      const songPath = path.join(SONGS_DIR, entry.outputFile);
      const song = fs.existsSync(songPath) ? readJson(songPath) : null;
      return {
        id: entry.id,
        title: song?.title || entry.id,
        outputFile: entry.outputFile,
        sourceClass: "legacy_unverified",
        sourceKind: "legacy_midi",
        sourceUrl: null,
        license: null,
        verifiedAt: null,
        exactFidelity: false,
        status: "unverified_legacy",
        issues: [
          {
            severity: "high",
            code: "missing_canonical_source",
            message: "O MIDI local nao tem fonte, edicao e licenca independentes; fidelidade musical ainda nao comprovada.",
          },
        ],
        warnings: [],
      };
    });
}

function renderMarkdown(report) {
  const canonicalRows = report.songs
    .filter((song) => song.sourceClass === "canonical")
    .map((song) => `| ${song.title} | ${song.sourceKind} | ${song.license} | ${song.exactFidelity ? "sim" : "nao"} | ${song.status} | ${song.warnings.join(" ") || "-"} |`)
    .join("\n");
  const legacy = report.songs.filter((song) => song.sourceClass === "legacy_unverified");

  return `# Auditoria de fidelidade musical por procedencia\n\nGerado em ${report.generatedAt}.\n\nEste relatorio nao usa mais o proprio MIDI legado como prova de fidelidade. Uma musica so e classificada como canonica quando possui fonte independente, edicao, licenca, data de verificacao e comparacao exata com o resultado final.\n\n## Resumo\n\n- Catalogo total: ${report.summary.songs}\n- Fontes canonicas prontas para revisao: ${report.summary.canonicalReadyForReview}\n- Fontes canonicas bloqueadas: ${report.summary.canonicalBlocked}\n- Legado ainda sem verificacao independente: ${report.summary.legacyUnverified}\n- Fidelidade exata comprovada: ${report.summary.exactFidelity}\n\n## Lote canonico\n\n| Musica | Tipo de fonte | Licenca | Fidelidade exata | Estado | Avisos |\n| --- | --- | --- | --- | --- | --- |\n${canonicalRows}\n\n## Catalogo legado\n\nAs ${legacy.length} musicas restantes permanecem disponiveis no repositorio, mas devem ser ocultadas de um lancamento de qualidade ate receberem o mesmo tratamento do lote piloto. O antigo resultado 90/90 foi invalidado porque comparava os JSONs com os mesmos MIDIs que os geraram.\n\nIDs pendentes: ${legacy.map((song) => song.id).join(", ")}.\n`;
}

function main() {
  const canonical = buildCanonicalEntries();
  const canonicalIds = new Set(canonical.map((song) => song.id));
  const legacy = buildLegacyEntries(canonicalIds);
  const songs = [...canonical, ...legacy];
  const report = {
    generatedAt: new Date().toISOString(),
    methodology: "canonical_provenance_v2",
    summary: {
      songs: songs.length,
      canonicalReadyForReview: canonical.filter((song) => song.status === "ready_for_owner_review").length,
      canonicalBlocked: canonical.filter((song) => song.status === "blocked").length,
      legacyUnverified: legacy.length,
      exactFidelity: canonical.filter((song) => song.exactFidelity).length,
    },
    songs,
  };
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, renderMarkdown(report), "utf8");
  console.log(`Procedencia musical: canonicas=${canonical.length}, legado_sem_verificacao=${legacy.length}, fidelidade_exata=${report.summary.exactFidelity}.`);
}

main();
