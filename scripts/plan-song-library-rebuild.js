const fs = require("fs");
const path = require("path");
const songManifest = require("./song-manifest");
const songCatalogMetadata = require("./song-catalog-metadata");
const canonicalRebuildSongs = require("../music-sources/rebuild/canonical-songs");
const { verifyFrozenMusicPilot } = require("./verify-frozen-music-pilot");

const ROOT_DIR = path.resolve(__dirname, "..");
const SONGS_DIR = path.join(ROOT_DIR, "public", "songs");
const REPORT_JSON = path.join(ROOT_DIR, "docs", "song-library-rebuild-plan.json");
const REPORT_MD = path.join(ROOT_DIR, "docs", "song-library-rebuild-plan.md");

const HIGH_RIGHTS_RISK = {
  "pintinho-amarelinho": "A atribuicao como folclore nao esta comprovada e existem arranjos comerciais registrados. Exigir autoria ou fonte licenciada antes de transcrever.",
  "parabens-pra-voce": "A melodia, a versao em portugues e os arranjos possuem historicos de direitos diferentes. Usar somente fonte instrumental cuja situacao no Brasil esteja documentada.",
  "bella-ciao-lacasadepapel": "Remover a referencia a La Casa de Papel. Somente a cancao tradicional, obtida de edicao independente e licenciada, pode ser considerada.",
};

const MEDIUM_RIGHTS_RISK = {
  "a-dona-aranha": "A melodia circula como tradicional, mas a versao em portugues precisa de identidade e fonte independentes.",
};

const FAMILIAR_CLASSICS = new Set([
  "minueto-em-sol-maior",
  "moonlight-sonata",
  "turkish-march",
  "minute-waltz",
  "nocturne-op9",
  "in-the-hall-of-the-mountain-king",
  "gymnopedie-no-1",
  "ave-maria-schubert",
  "swan-lake-napolitan-dance",
  "toccata-and-fugue-d-minor",
]);

function readSong(outputFile) {
  const filePath = path.join(SONGS_DIR, outputFile);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function rightsAssessment(entry, metadata) {
  if (HIGH_RIGHTS_RISK[entry.id]) {
    return { risk: "high", status: "clearance_required", reason: HIGH_RIGHTS_RISK[entry.id] };
  }
  if (MEDIUM_RIGHTS_RISK[entry.id]) {
    return { risk: "medium", status: "research_required", reason: MEDIUM_RIGHTS_RISK[entry.id] };
  }
  if (metadata.category === "Infantis" || metadata.artist === "Tradicional" || metadata.artist === "Folclore Brasileiro") {
    return {
      risk: "medium",
      status: "research_required",
      reason: "Confirmar autoria desconhecida ou prazo patrimonial e obter uma edicao independente com licenca verificavel.",
    };
  }
  if (metadata.category === "Religiosos") {
    return {
      risk: "medium",
      status: "tune_identity_required",
      reason: "Identificar separadamente autor da melodia, autor da letra/traducao e licenca da edicao instrumental.",
    };
  }
  return {
    risk: "low",
    status: "edition_required",
    reason: "A composicao aparenta ser de dominio publico, mas a edicao/MIDI ainda precisa de licenca e proveniencia independentes.",
  };
}

function waveFor(entry, metadata, rights) {
  if (rights.risk === "high") return { number: 0, id: "rights-clearance", label: "Liberacao de direitos" };
  if (metadata.category === "Infantis") return { number: 1, id: "launch-children", label: "Infantis para lancamento" };
  if (metadata.category === "Religiosos") return { number: 2, id: "hymns", label: "Hinos e melodias religiosas" };
  if (FAMILIAR_CLASSICS.has(entry.id)) return { number: 3, id: "familiar-classics", label: "Classicos reconheciveis" };
  return { number: 4, id: "advanced-classics", label: "Classicos avancados" };
}

function priorityScore(metadata, rights, wave, song) {
  let score = 100 - wave.number * 15;
  if (!metadata.isPremium) score += 8;
  if (metadata.difficulty === "Fácil") score += 6;
  if (rights.risk === "high") score -= 35;
  if ((song?.duration || 0) > 300) score -= 8;
  return score;
}

function renderMarkdown(report) {
  const summaryRows = Object.values(report.summary.byWave)
    .map((wave) => `| ${wave.number} | ${wave.label} | ${wave.count} |`)
    .join("\n");
  const songRows = report.songs
    .map((song) => `| ${song.wave.number} | ${song.title} | ${song.category} | ${song.rights.risk} | ${song.rights.status} | ${song.sourceStatus} | ${song.priorityScore} |`)
    .join("\n");

  return `# Plano de reconstrucao das 82 musicas\n\nGerado em ${report.generatedAt}. As oito musicas canonicas do lote piloto permanecem congeladas e fora deste plano.\n\n## Resumo\n\n- Catalogo: ${report.summary.catalog}\n- Piloto congelado: ${report.summary.frozen}\n- A reconstruir: ${report.summary.toRebuild}\n- Alto risco de direitos: ${report.summary.rightsRisk.high}\n- Risco medio: ${report.summary.rightsRisk.medium}\n- Risco baixo: ${report.summary.rightsRisk.low}\n- Fontes canonicas ainda pendentes: ${report.summary.pendingCanonicalSources}\n\n| Onda | Grupo | Musicas |\n| --- | --- | ---: |\n${summaryRows}\n\n## Regras\n\n- Nenhum MIDI legado conta como prova de fidelidade ou direito de uso.\n- Nenhuma musica deste plano pode ser publicada antes de fonte, licenca, checksum, auditoria e revisao auditiva.\n- Itens de alto risco podem ser substituidos ou removidos se nao houver fonte segura.\n\n## Catalogo de trabalho\n\n| Onda | Musica | Categoria | Risco | Direitos | Fonte | Prioridade |\n| ---: | --- | --- | --- | --- | --- | ---: |\n${songRows}\n`;
}

function main() {
  const frozenIds = new Set(verifyFrozenMusicPilot());
  const canonicalById = new Map(canonicalRebuildSongs.map((entry) => [entry.id, entry]));
  const rebuild = songManifest
    .filter((entry) => !frozenIds.has(entry.id))
    .map((entry) => {
      const metadata = songCatalogMetadata[entry.id] || {};
      const song = readSong(entry.outputFile);
      const rights = rightsAssessment(entry, metadata);
      const wave = waveFor(entry, metadata, rights);
      const canonical = canonicalById.get(entry.id);
      return {
        id: entry.id,
        title: metadata.title || song?.title || entry.id,
        artist: metadata.artist || song?.artist || null,
        category: metadata.category || song?.category || "Sem categoria",
        difficulty: metadata.difficulty || song?.difficulty || null,
        outputFile: entry.outputFile,
        legacyMidiFiles: entry.midiFiles,
        legacyDuration: song?.duration ?? null,
        sourceStatus: canonical ? "canonical_source_verified" : "pending_independent_source",
        publicationStatus: canonical ? "pending_owner_review" : "blocked_until_canonical",
        rights,
        wave,
        priorityScore: priorityScore(metadata, rights, wave, song),
      };
    })
    .sort((left, right) => left.wave.number - right.wave.number || right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));

  if (frozenIds.size !== 8) throw new Error(`Esperadas 8 musicas congeladas; encontradas ${frozenIds.size}.`);
  if (rebuild.length !== 82) throw new Error(`Esperadas 82 musicas para reconstruir; encontradas ${rebuild.length}.`);

  const byWave = {};
  for (const song of rebuild) {
    const key = song.wave.id;
    byWave[key] ||= { ...song.wave, count: 0 };
    byWave[key].count += 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    methodology: "canonical_rebuild_plan_v1",
    legalNotice: "Triagem editorial baseada em informacoes publicas; nao substitui parecer juridico.",
    legalReferences: [
      "https://www.gov.br/cultura/pt-br/assuntos/direitos-autorais/perguntas-frequentes/perguntas-frequentes",
      "https://www.gov.br/bn/pt-br/atuacao/direitos-autorais-1/direitos-autorais",
    ],
    summary: {
      catalog: songManifest.length,
      frozen: frozenIds.size,
      toRebuild: rebuild.length,
      canonicalSourcesReady: rebuild.filter((song) => song.sourceStatus === "canonical_source_verified").length,
      pendingCanonicalSources: rebuild.filter((song) => song.sourceStatus === "pending_independent_source").length,
      rightsRisk: {
        high: rebuild.filter((song) => song.rights.risk === "high").length,
        medium: rebuild.filter((song) => song.rights.risk === "medium").length,
        low: rebuild.filter((song) => song.rights.risk === "low").length,
      },
      byWave,
    },
    frozenIds: [...frozenIds],
    songs: rebuild,
  };

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, renderMarkdown(report), "utf8");
  console.log(`Plano musical: congeladas=${report.summary.frozen}, reconstruir=${report.summary.toRebuild}.`);
  console.log(`Fontes canonicas: verificadas=${report.summary.canonicalSourcesReady}, pendentes=${report.summary.pendingCanonicalSources}.`);
  console.log(`Risco de direitos: alto=${report.summary.rightsRisk.high}, medio=${report.summary.rightsRisk.medium}, baixo=${report.summary.rightsRisk.low}.`);
  for (const wave of Object.values(byWave)) console.log(`Onda ${wave.number} ${wave.id}: ${wave.count} musicas.`);
}

main();
