const BASE_URL = (process.env.PIANIFY_VERIFY_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const checks = [
  { path: "/", expected: [200], contains: "Pianify" },
  { path: "/termos", expected: [200], contains: "Termos" },
  { path: "/privacidade", expected: [200], contains: "Privacidade" },
  { path: "/reembolso", expected: [200], contains: "Reembolso" },
  { path: "/contato", expected: [200], contains: "Pianify" },
  { path: "/professores", expected: [200], contains: "Professor" },
  { path: "/login?role=teacher", expected: [200, 307] },
  { path: "/manifest.webmanifest", expected: [200], contains: "Pianify" },
  { path: "/robots.txt", expected: [200], contains: "Sitemap" },
  { path: "/sitemap.xml", expected: [200], contains: "urlset" },
  { path: "/api/health", expected: [200], jsonStatus: "ok", expectedWhenUnconfigured: [503], jsonStatusWhenUnconfigured: "unready" },
  { path: "/dashboard/songs", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/dashboard/membership", expected: [307] },
  { path: "/api/admin/readiness", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/admin/stats", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/admin/teachers", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/admin/financial", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/admin/analytics", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/admin/expenses", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/admin/withdrawals", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/teacher/stats", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/teacher/withdraw", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/api/account/export", expected: [307, 401], expectedWhenUnconfigured: [503] },
  { path: "/songs/fur-elise.json", expected: [404] },
  { path: "/api/songs/fur-elise", expected: [401], expectedWhenUnconfigured: [500] },
  {
    path: "/api/song-recommendations",
    method: "POST",
    body: { recommendation: "Teste não autenticado" },
    expected: [401],
    expectedWhenUnconfigured: [500],
  },
  {
    path: "/api/stripe/checkout",
    method: "POST",
    body: { planKey: "monthly" },
    expected: [401],
    expectedWhenUnconfigured: [500],
  },
  { path: "/api/stripe/portal", method: "POST", expected: [307, 401], expectedWhenUnconfigured: [503] },
  {
    path: "/api/stripe/webhook",
    method: "POST",
    body: {},
    expected: [400],
    expectedWhenUnconfigured: [503],
  },
  { path: "/pagina-que-nao-existe", expected: [404], contains: "página saiu do compasso" },
];

async function runCheck(check, unconfiguredLocal) {
  const response = await fetch(`${BASE_URL}${check.path}`, {
    method: check.method || "GET",
    redirect: "manual",
    headers: check.body ? { "Content-Type": "application/json" } : undefined,
    body: check.body ? JSON.stringify(check.body) : undefined,
  });
  const body = await response.text();
  const expectedStatuses =
    unconfiguredLocal && check.expectedWhenUnconfigured
      ? check.expectedWhenUnconfigured
      : check.expected;
  const statusOk = expectedStatuses.includes(response.status);
  const contentOk = check.contains ? body.toLowerCase().includes(check.contains.toLowerCase()) : true;
  let jsonOk = true;

  const expectedJsonStatus =
    unconfiguredLocal && check.jsonStatusWhenUnconfigured
      ? check.jsonStatusWhenUnconfigured
      : check.jsonStatus;

  if (expectedJsonStatus) {
    try {
      jsonOk = JSON.parse(body).status === expectedJsonStatus;
    } catch {
      jsonOk = false;
    }
  }

  return {
    path: check.path,
    status: response.status,
    passed: statusOk && contentOk && jsonOk,
    cacheControl: response.headers.get("cache-control"),
    robots: response.headers.get("x-robots-tag"),
  };
}

async function run() {
  const baseHostname = new URL(BASE_URL).hostname;
  const isLocal = baseHostname === "127.0.0.1" || baseHostname === "localhost";
  const healthResponse = await fetch(`${BASE_URL}/api/health`, { redirect: "manual" });
  const health = await healthResponse.json().catch(() => null);
  const unconfiguredLocal =
    isLocal &&
    (health?.checks?.configuration === "incomplete" ||
      (Array.isArray(health?.missingConfiguration) && health.missingConfiguration.length > 0));
  const results = [];
  for (const check of checks) results.push(await runCheck(check, unconfiguredLocal));

  const failures = results.filter((result) => !result.passed);
  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    mode: unconfiguredLocal ? "local-degraded" : "fully-configured",
    passed: results.length - failures.length,
    total: results.length,
    results,
  }, null, 2));

  if (failures.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
