const BASE_URL = (process.env.PIANIFY_VERIFY_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const checks = [
  { path: "/", expected: [200], contains: "Pianify" },
  { path: "/termos", expected: [200], contains: "Termos" },
  { path: "/privacidade", expected: [200], contains: "Privacidade" },
  { path: "/reembolso", expected: [200], contains: "Reembolso" },
  { path: "/contato", expected: [200], contains: "Pianify" },
  { path: "/manifest.webmanifest", expected: [200], contains: "Pianify" },
  { path: "/robots.txt", expected: [200], contains: "Sitemap" },
  { path: "/sitemap.xml", expected: [200], contains: "urlset" },
  { path: "/api/health", expected: [200], jsonStatus: "ok" },
  { path: "/dashboard/songs", expected: [307, 401] },
  { path: "/api/admin/readiness", expected: [307, 401] },
  {
    path: "/api/stripe/checkout",
    method: "POST",
    body: { planKey: "monthly" },
    expected: [401],
  },
  { path: "/api/stripe/portal", method: "POST", expected: [307, 401] },
  { path: "/api/stripe/webhook", method: "POST", body: {}, expected: [400] },
  { path: "/pagina-que-nao-existe", expected: [404], contains: "página saiu do compasso" },
];

async function runCheck(check) {
  const response = await fetch(`${BASE_URL}${check.path}`, {
    method: check.method || "GET",
    redirect: "manual",
    headers: check.body ? { "Content-Type": "application/json" } : undefined,
    body: check.body ? JSON.stringify(check.body) : undefined,
  });
  const body = await response.text();
  const statusOk = check.expected.includes(response.status);
  const contentOk = check.contains ? body.toLowerCase().includes(check.contains.toLowerCase()) : true;
  let jsonOk = true;

  if (check.jsonStatus) {
    try {
      jsonOk = JSON.parse(body).status === check.jsonStatus;
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
  const results = [];
  for (const check of checks) results.push(await runCheck(check));

  const failures = results.filter((result) => !result.passed);
  console.log(JSON.stringify({ baseUrl: BASE_URL, passed: results.length - failures.length, total: results.length, results }, null, 2));

  if (failures.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
