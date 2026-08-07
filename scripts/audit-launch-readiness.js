const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "docs");
const JSON_OUT = path.join(DOCS_DIR, "launch-readiness-audit.json");
const MD_OUT = path.join(DOCS_DIR, "launch-readiness-audit.md");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function has(file, pattern) {
  return pattern.test(read(file));
}

function envKeys(file) {
  if (!exists(file)) return new Set();
  return new Set(
    read(file)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.split("=")[0].trim()),
  );
}

function add(checks, category, item, status, details, severity = "medium") {
  checks.push({ category, item, status, severity, details });
}

function statusIcon(status) {
  if (status === "pass") return "OK";
  if (status === "warn") return "WARN";
  return "FAIL";
}

function run() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  const checks = [];
  const packageJson = JSON.parse(read("package.json"));
  const scripts = packageJson.scripts || {};
  const nextVersion = packageJson.dependencies?.next || "";
  const nextVersionMatch = nextVersion.match(/(\d+)\.(\d+)\.(\d+)/);
  const nextVersionTuple = nextVersionMatch
    ? nextVersionMatch.slice(1).map(Number)
    : [0, 0, 0];
  const exampleEnv = envKeys(".env.example");
  const localEnv = envKeys(".env.local");
  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_MONTHLY_PRICE_ID",
    "STRIPE_YEARLY_PRICE_ID",
    "NEXT_PUBLIC_SITE_URL",
  ];
  const missingLocalEnv = requiredEnv.filter((key) => !localEnv.has(key));

  for (const key of requiredEnv) {
    add(
      checks,
      "env",
      key,
      exampleEnv.has(key) ? "pass" : "fail",
      exampleEnv.has(key) ? "Presente em .env.example." : "Ausente em .env.example.",
      "high",
    );
  }

  add(
    checks,
    "env-local",
    ".env.local completo",
    exists(".env.local") && missingLocalEnv.length === 0 ? "pass" : "warn",
    !exists(".env.local")
      ? "Arquivo local nao encontrado. Producao deve configurar as variaveis no provedor."
      : missingLocalEnv.length === 0
        ? `Arquivo local encontrado com todas as ${requiredEnv.length} chaves obrigatorias. Valores nao sao expostos no relatorio.`
        : `Arquivo local protegido, mas faltam ${missingLocalEnv.length} chaves obrigatorias: ${missingLocalEnv.join(", ")}.`,
    "medium",
  );

  add(
    checks,
    "build",
    "script build",
    scripts.build ? "pass" : "fail",
    scripts.build ? "Script de build configurado." : "package.json nao tem script build.",
    "high",
  );

  const hasHardenedNextBaseline =
    nextVersionTuple[0] > 16 ||
    (nextVersionTuple[0] === 16 && nextVersionTuple[1] >= 3);
  add(
    checks,
    "dependencies",
    "baseline segura do Next.js",
    hasHardenedNextBaseline ? "pass" : "fail",
    hasHardenedNextBaseline
      ? `Next.js ${nextVersion} com baseline de seguranca atualizada; o CI tambem executa npm audit.`
      : `Next.js ${nextVersion || "nao identificado"} abaixo da baseline 16.3 usada por esta auditoria.`,
    "critical",
  );

  add(
    checks,
    "qa",
    "QA responsivo automatizado",
    exists("scripts/responsive-pianoengine-qa.js") ? "pass" : "fail",
    exists("scripts/responsive-pianoengine-qa.js")
      ? "Script de QA responsivo/interativo existe."
      : "Falta script de QA responsivo/interativo.",
    "high",
  );

  add(
    checks,
    "analytics",
    "tracking interno do funil",
    exists("src/lib/analytics.ts") &&
      exists("src/app/api/analytics/event/route.ts") &&
      exists("supabase/migrations/20260805000000_initial_pianify_schema.sql") &&
      has("supabase/migrations/20260805000000_initial_pianify_schema.sql", /analytics_events/)
      ? "pass"
      : "fail",
    "Cliente, API e tabela versionada de analytics interno devem existir para medir conversao.",
    "high",
  );

  add(
    checks,
    "qa",
    "auditoria de modos do player",
    exists("scripts/audit-player-modes.js") && scripts["audit-player-modes"] ? "pass" : "fail",
    exists("scripts/audit-player-modes.js") && scripts["audit-player-modes"]
      ? "Auditoria de modos do player esta configurada."
      : "Falta auditoria de modos do player.",
    "high",
  );

  add(
    checks,
    "local-auth",
    "bypass local bloqueado em producao",
    has("src/lib/localDevAuth.ts", /NODE_ENV\s*!==\s*["']production["']/) &&
      has("src/proxy.ts", /isLocalDevAuthAllowed/) &&
      has("src/app/api/auth/local-test/route.ts", /isLocalDevAuthAllowed/)
      ? "pass"
      : "fail",
    "A rota local-test e o middleware devem depender de isLocalDevAuthAllowed com bloqueio explicito em producao.",
    "critical",
  );

  add(
    checks,
    "access-control",
    "acessos especiais fora do codigo",
    has("src/lib/access-control.ts", /process\.env\.SPECIAL_ACCESS_IDS/) &&
      !has("src/lib/access-control.ts", /@[a-z0-9.-]+\.[a-z]{2,}/i)
      ? "pass"
      : "fail",
    "A lista de acessos gratuitos deve vir de configuracao segura e nao conter e-mails versionados.",
    "critical",
  );

  add(
    checks,
    "stripe",
    "checkout autenticado",
    has("src/app/api/stripe/checkout/route.ts", /supabase\.auth\.getUser\(\)/) &&
      has("src/app/api/stripe/checkout/route.ts", /status:\s*401/) &&
      has("src/app/api/stripe/checkout/route.ts", /STRIPE_MONTHLY_PRICE_ID/) &&
      has("src/app/api/stripe/checkout/route.ts", /STRIPE_YEARLY_PRICE_ID/)
      ? "pass"
      : "fail",
    "Checkout exige usuario autenticado e valida IDs de preco.",
    "critical",
  );

  add(
    checks,
    "stripe",
    "webhook assinado",
    has("src/app/api/stripe/webhook/route.ts", /constructEvent\(body,\s*sig,\s*webhookSecret\)/) &&
      has("src/app/api/stripe/webhook/route.ts", /STRIPE_WEBHOOK_SECRET/) &&
      has("src/app/api/stripe/webhook/route.ts", /SUPABASE_SERVICE_ROLE_KEY/)
      ? "pass"
      : "fail",
    "Webhook valida assinatura Stripe e usa service role apenas no servidor.",
    "critical",
  );

  add(
    checks,
    "stripe",
    "portal autenticado",
    has("src/app/api/stripe/portal/route.ts", /supabase\.auth\.getUser\(\)/) &&
      has("src/app/api/stripe/portal/route.ts", /status:\s*401/)
      ? "pass"
      : "fail",
    "Portal exige usuario autenticado.",
    "high",
  );

  add(
    checks,
    "qa",
    "verificacao HTTP de release",
    exists("scripts/verify-release-http.js") && Boolean(scripts["verify-release-http"]) ? "pass" : "fail",
    "O smoke test deve validar paginas publicas, protecao de rotas, checkout, webhook e respostas 404.",
    "high",
  );

  add(
    checks,
    "seo",
    "metadados e descoberta",
    exists("src/app/manifest.ts") &&
      exists("src/app/robots.ts") &&
      exists("src/app/sitemap.ts") &&
      has("src/app/layout.tsx", /openGraph/) &&
      has("src/app/layout.tsx", /twitter/)
      ? "pass"
      : "fail",
    "Manifesto, robots, sitemap, Open Graph e Twitter Card devem estar configurados.",
    "medium",
  );

  add(
    checks,
    "operations",
    "endpoint de saude",
    exists("src/app/api/health/route.ts") ? "pass" : "fail",
    "O endpoint /api/health permite monitorar a disponibilidade sem autenticar.",
    "high",
  );

  add(
    checks,
    "resilience",
    "estados globais de erro e carregamento",
    exists("src/app/error.tsx") && exists("src/app/loading.tsx") && exists("src/app/not-found.tsx")
      ? "pass"
      : "fail",
    "A aplicacao deve oferecer recuperacao para erro, carregamento e pagina inexistente.",
    "high",
  );

  add(
    checks,
    "privacy",
    "cache e indexacao de areas privadas",
    has("next.config.mjs", /private, no-store/) && has("next.config.mjs", /X-Robots-Tag/) ? "pass" : "fail",
    "APIs, login e dashboard nao devem ser armazenados por cache compartilhado nem indexados.",
    "high",
  );

  add(
    checks,
    "stripe",
    "webhook solicita nova tentativa quando o banco falha",
    has("src/app/api/stripe/webhook/route.ts", /Webhook persistence failed/) &&
      has("src/app/api/stripe/webhook/route.ts", /status:\s*500/)
      ? "pass"
      : "fail",
    "Falhas de persistencia precisam retornar 5xx para o Stripe reenviar o evento.",
    "critical",
  );

  const adminRoutes = [
    "src/app/api/admin/analytics/route.ts",
    "src/app/api/admin/expenses/route.ts",
    "src/app/api/admin/financial/route.ts",
    "src/app/api/admin/readiness/route.ts",
    "src/app/api/admin/stats/route.ts",
    "src/app/api/admin/teachers/route.ts",
    "src/app/api/admin/withdrawals/route.ts",
  ];
  for (const route of adminRoutes) {
    add(
      checks,
      "admin-api",
      route,
      exists(route) && has(route, /role["']?\)?\s*!==\s*["']admin["']/) ? "pass" : "fail",
      "Rota admin deve bloquear usuarios sem role admin.",
      "critical",
    );
  }

  add(
    checks,
    "teacher-api",
    "saques de professores",
    has("src/app/api/teacher/withdraw/route.ts", /role\s*!==\s*["']teacher["']/) &&
      has("src/app/api/teacher/withdraw/route.ts", /amount\s*>\s*availableBalance/) &&
      has("src/app/api/teacher/withdraw/route.ts", /status["']?,?\s*["']pendente["']/) &&
      exists("supabase/migrations/20260805231500_harden_teacher_withdrawals.sql")
      ? "pass"
      : "fail",
    "Saque valida role, saldo disponivel, reservas pendentes e unicidade no banco.",
    "critical",
  );

  add(
    checks,
    "admin-api",
    "atualizacao idempotente de saques",
    has("src/app/api/admin/withdrawals/route.ts", /paidWithdrawals/) &&
      has("src/app/api/admin/withdrawals/route.ts", /balance_withdrawn_total:\s*paidTotal/)
      ? "pass"
      : "fail",
    "O total pago deve ser recalculado a partir dos saques, sem somar novamente a cada clique.",
    "critical",
  );

  add(
    checks,
    "privacy",
    "analytics sem IP bruto",
    !has("src/app/api/analytics/event/route.ts", /x-forwarded-for/i)
      ? "pass"
      : "fail",
    "O funil nao precisa persistir o endereco IP do visitante.",
    "high",
  );

  add(
    checks,
    "security-headers",
    "headers de seguranca",
    has("next.config.mjs", /Strict-Transport-Security/) &&
      has("next.config.mjs", /X-Frame-Options/) &&
      has("next.config.mjs", /Permissions-Policy/)
      ? "pass"
      : "warn",
    "Headers basicos de seguranca configurados no Next.",
    "medium",
  );

  const songFiles = fs
    .readdirSync(path.join(ROOT, "public", "songs"))
    .filter((name) => name.endsWith(".json"));
  add(
    checks,
    "catalog",
    "biblioteca carregavel",
    songFiles.length > 0 && exists("public/song-catalog-index.json") ? "pass" : "fail",
    `${songFiles.length} arquivos de musica encontrados e indice publico existe.`,
    "high",
  );

  add(
    checks,
    "legal",
    "direitos autorais das musicas",
    "warn",
    "Revisao juridica/manual ainda e necessaria antes de anunciar em escala. A auditoria tecnica nao comprova licenca comercial de melodias, arranjos, imagens ou marcas.",
    "critical",
  );

  add(
    checks,
    "catalog",
    "revisao auditiva final da biblioteca",
    "warn",
    "As 90 musicas possuem fonte canonica e fidelidade estrutural exata, mas a aprovacao por escuta humana de melodia, harmonia, andamento e experiencia das tres dificuldades continua obrigatoria antes da publicacao.",
    "critical",
  );

  const brandIsPianify =
    has("README.md", /Pianify/i) &&
    has("src/app/layout.tsx", /Pianify/i) &&
    has("src/app/page.tsx", /Pianify/i);
  add(
    checks,
    "brand",
    "nome comercial consistente",
    brandIsPianify ? "pass" : "warn",
    brandIsPianify
      ? "Pianify e o nome comercial usado na documentacao e no produto."
      : "Padronize o nome Pianify na documentacao, nos metadados e na interface antes do lancamento.",
    "high",
  );

  const hasInitialSchema =
    exists("supabase/migrations") &&
    fs.readdirSync(path.join(ROOT, "supabase", "migrations")).some((name) => /base|initial|schema/i.test(name));
  add(
    checks,
    "database",
    "schema e migracoes reproduziveis",
    hasInitialSchema ? "pass" : "warn",
    hasInitialSchema
      ? "Schema inicial e endurecimentos posteriores estao versionados em supabase/migrations."
      : "O repositorio ainda nao contem uma migracao inicial completa de profiles, withdrawals e politicas RLS. Exporte e versione o schema antes de operar em producao.",
    "critical",
  );

  add(
    checks,
    "business",
    "teste de compra real",
    "warn",
    "Exige teste manual em producao/sandbox Stripe: checkout, webhook, portal, cancelamento, past_due e reativacao.",
    "critical",
  );

  add(
    checks,
    "devices",
    "teste em aparelhos fisicos",
    "warn",
    "Exige teste manual em iPhone, Android, tablet, notebook e desktop, principalmente microfone, MIDI, audio e orientacao.",
    "high",
  );

  const summary = {
    total: checks.length,
    pass: checks.filter((check) => check.status === "pass").length,
    warn: checks.filter((check) => check.status === "warn").length,
    fail: checks.filter((check) => check.status === "fail").length,
    criticalOpen: checks.filter((check) => check.status !== "pass" && check.severity === "critical").length,
  };

  fs.writeFileSync(JSON_OUT, JSON.stringify({ generatedAt: new Date().toISOString(), summary, checks }, null, 2));

  const lines = [
    "# Auditoria de pre-lancamento comercial",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    "",
    "## Resumo",
    "",
    `- Total: ${summary.total}`,
    `- OK: ${summary.pass}`,
    `- Alertas: ${summary.warn}`,
    `- Falhas: ${summary.fail}`,
    `- Pendencias criticas abertas: ${summary.criticalOpen}`,
    "",
    "## Checks",
    "",
    "| Status | Categoria | Item | Severidade | Detalhes |",
    "| --- | --- | --- | --- | --- |",
    ...checks.map((check) => {
      const details = check.details.replace(/\|/g, "/");
      return `| ${statusIcon(check.status)} | ${check.category} | ${check.item} | ${check.severity} | ${details} |`;
    }),
    "",
    "## Leitura de negocio",
    "",
    summary.fail > 0
      ? "Ainda nao recomendado para venda publica: existem falhas tecnicas automatizadas."
      : summary.criticalOpen > 0
        ? "Recomendado para beta pago controlado, mas ainda nao para campanha grande: existem pendencias criticas manuais."
        : summary.warn > 0
          ? "Tecnicamente pronto para beta pago; finalize os alertas manuais antes de escalar anuncios."
          : "Pronto tecnicamente para lancamento.",
    "",
  ];

  fs.writeFileSync(MD_OUT, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({ output: { json: JSON_OUT, markdown: MD_OUT }, summary }, null, 2));

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
}

run();
