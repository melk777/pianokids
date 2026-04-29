const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const TMP_DIR = path.join(ROOT_DIR, "tmp", "responsive-qa");
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const TARGET_URL =
  "http://localhost:3014/api/auth/local-test?redirect=/dashboard/play/borboletinha%3Fdifficulty%3Dpro%26leftHand%3Dtrue%26rightHand%3Dtrue%26mic%3Dfalse";
const PLAYER_URL = "http://localhost:3014/dashboard/play/borboletinha?difficulty=pro&leftHand=true&rightHand=true&mic=false";

const VIEWPORTS = [
  { name: "mobile-portrait", width: 390, height: 844, touch: true },
  { name: "mobile-landscape", width: 844, height: 390, touch: true },
  { name: "tablet", width: 834, height: 1112, touch: true },
  { name: "desktop", width: 1440, height: 900, touch: false },
];

function findChrome() {
  return CHROME_PATHS.find((candidate) => candidate && fs.existsSync(candidate));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function waitForEndpoint(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      return await fetchJson(url);
    } catch {
      await wait(150);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpPage {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];

    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });

    this.ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject } = this.pending.get(payload.id);
        this.pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
        return;
      }
      if (payload.method) this.events.push(payload);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    const message = JSON.stringify({ id, method, params });
    const result = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.ws.send(message);
    return result;
  }

  close() {
    this.ws.close();
  }
}

function rectsOverlap(a, b, padding = 0) {
  if (!a || !b) return false;
  return !(
    a.right <= b.left + padding ||
    a.left >= b.right - padding ||
    a.bottom <= b.top + padding ||
    a.top >= b.bottom - padding
  );
}

function parsePercent(value) {
  const parsed = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

async function evaluate(page, expression) {
  const result = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails, null, 2));
  }
  return result.result.value;
}

async function getElementCenter(page, testId) {
  return evaluate(
    page,
    `(() => {
      const el = document.querySelector('[data-testid="${testId}"]');
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center" });
      const rect = el.getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    })()`,
  );
}

async function tapTestId(page, testId) {
  const point = await getElementCenter(page, testId);
  if (!point) throw new Error(`Elemento nao encontrado para toque: ${testId}`);
  await page.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: point.x, y: point.y, radiusX: 3, radiusY: 3, force: 1 }],
  });
  await wait(80);
  await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  if (testId === "control-pause") {
    await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  }
  await wait(260);
}

async function holdTestId(page, testId, holdMs = 180) {
  const point = await getElementCenter(page, testId);
  if (!point) throw new Error(`Elemento nao encontrado para pressionar: ${testId}`);
  await page.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: point.x, y: point.y, radiusX: 3, radiusY: 3, force: 1 }],
  });
  await wait(holdMs);
  const active = await evaluate(
    page,
    `(() => {
      const el = document.querySelector('[data-testid="${testId}"]');
      if (!el) return false;
      return el.className.includes("translate-y-1");
    })()`,
  );
  await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await wait(160);
  return active;
}

async function navigateAndWait(page, url) {
  await page.send("Page.navigate", { url });
  await wait(2500);
}

async function collectInteractionState(page) {
  return evaluate(
    page,
    `(() => {
      const byTestId = (id) => document.querySelector('[data-testid="' + id + '"]');
      const text = (id) => byTestId(id)?.textContent?.trim() ?? null;
      const active = (id) => byTestId(id)?.getAttribute("data-active") === "true";
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
      };
      const score = byTestId("score-screen");
      return {
        speed: text("control-speed-value"),
        metronome: text("control-metronome-value"),
        waitingActive: active("control-waiting-toggle"),
        loopActive: active("control-loop-toggle"),
        pauseActive: active("control-pause"),
        gameState: byTestId("control-pause")?.getAttribute("data-game-state") ?? null,
        isPaused: document.body.innerText.includes("Pausado"),
        scoreScroll: score ? {
          scrollTop: Math.round(score.scrollTop),
          scrollHeight: Math.round(score.scrollHeight),
          clientHeight: Math.round(score.clientHeight),
          bottomButtonsVisible: ["score-restart", "score-next", "score-exit"].every((id) => {
            const item = byTestId(id);
            if (!item) return false;
            const r = item.getBoundingClientRect();
            return r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0;
          }),
          rect: rect(score),
        } : null,
      };
    })()`,
  );
}

async function capture(page, viewport, phase) {
  const screenshot = await page.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const filePath = path.join(TMP_DIR, `${viewport.name}-${phase}.png`);
  fs.writeFileSync(filePath, Buffer.from(screenshot.data, "base64"));
  return filePath;
}

async function collectLayout(page) {
  return evaluate(
    page,
    `(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
      };
      const byTestId = (id) => document.querySelector('[data-testid="' + id + '"]');
      const allText = document.body.innerText;
      const mojibakePattern = /Ã[^A-Z\s]|Â[^A-Z\s]|ðŸ|â€|âœ|â˜|�/;
      const buttons = [...document.querySelectorAll("button")].map((button) => button.innerText.trim()).filter(Boolean);
      const isVisible = (el) => {
        if (!el) return false;
        const style = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      const canvas = byTestId("piano-canvas");
      const keyboard = byTestId("piano-keyboard");
      const smartTraining = byTestId("smart-training-card");
      const tutorial = byTestId("game-tutorial-card");
      const scoreScreen = byTestId("score-screen");
      const progress = byTestId("piano-progress");
      const hudScore = byTestId("piano-hud-score");
      const hudCombo = byTestId("piano-hud-combo");
      const hudAccuracy = byTestId("piano-hud-accuracy");
      return {
        viewport: { width: innerWidth, height: innerHeight },
        bodyText: allText.slice(0, 1200),
        hasMojibake: mojibakePattern.test(allText),
        hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
        hasOrientationOverlay: isVisible(byTestId("orientation-overlay")),
        buttons,
        rects: {
          canvas: rect(canvas),
          keyboard: rect(keyboard),
          smartTraining: rect(smartTraining),
          tutorial: rect(tutorial),
          scoreScreen: rect(scoreScreen),
          progress: rect(progress),
          hudScore: rect(hudScore),
          hudCombo: rect(hudCombo),
          hudAccuracy: rect(hudAccuracy),
        }
      };
    })()`,
  );
}

function analyzeLayout(layout) {
  const issues = [];
  const { rects, viewport } = layout;

  if (layout.hasMojibake) issues.push("Texto renderizado contem mojibake.");
  if (layout.hasHorizontalOverflow) issues.push("Pagina tem overflow horizontal.");
  if (layout.hasOrientationOverlay) return issues;
  if (rects.canvas && rects.canvas.height < Math.max(260, viewport.height * 0.45)) {
    issues.push(`Area do piano baixa demais (${rects.canvas.height}px).`);
  }
  if (rects.keyboard && rects.keyboard.height < 88) {
    issues.push(`Teclado virtual baixo demais (${rects.keyboard.height}px).`);
  }
  if (rects.smartTraining && rects.keyboard && rectsOverlap(rects.smartTraining, rects.keyboard, 4)) {
    issues.push("Card de treino inteligente sobrepoe o teclado.");
  }
  if (rects.smartTraining && rects.hudCombo && rectsOverlap(rects.smartTraining, rects.hudCombo, 4)) {
    issues.push("Card de treino inteligente sobrepoe o HUD.");
  }
  if (rects.tutorial && rects.keyboard && rectsOverlap(rects.tutorial, rects.keyboard, 4)) {
    issues.push("Card do tutorial sobrepoe o teclado.");
  }
  if (rects.hudScore && rects.hudCombo && rectsOverlap(rects.hudScore, rects.hudCombo, 4)) {
    issues.push("Pontos sobrepoe combo.");
  }
  if (rects.hudCombo && rects.hudAccuracy && rectsOverlap(rects.hudCombo, rects.hudAccuracy, 4)) {
    issues.push("Combo sobrepoe precisao.");
  }
  if (rects.scoreScreen && (rects.scoreScreen.width > viewport.width || rects.scoreScreen.height > viewport.height)) {
    issues.push("Tela final excede o viewport.");
  }

  return issues;
}

async function run() {
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const chrome = findChrome();
  if (!chrome) throw new Error("Chrome/Edge nao encontrado para QA responsivo.");

  const port = 9333 + Math.floor(Math.random() * 400);
  const userDataDir = path.join(TMP_DIR, `chrome-profile-${Date.now()}`);
  const browser = spawn(chrome, [
    "--headless=new",
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-allow-origins=*",
    "about:blank",
  ], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let chromeLog = "";
  browser.stdout.on("data", (chunk) => {
    chromeLog += chunk.toString();
  });
  browser.stderr.on("data", (chunk) => {
    chromeLog += chunk.toString();
  });

  try {
    await waitForEndpoint(`http://127.0.0.1:${port}/json/version`).catch((error) => {
      throw new Error(`${error.message}\nChrome output:\n${chromeLog.slice(-4000)}`);
    });
    const target = await fetchJson(`http://127.0.0.1:${port}/json/new`, { method: "PUT" });
    const page = new CdpPage(target.webSocketDebuggerUrl);
    await page.send("Page.enable");
    await page.send("Runtime.enable");

    const report = [];

    for (const viewport of VIEWPORTS) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.touch,
        screenOrientation: {
          type: viewport.width > viewport.height ? "landscapePrimary" : "portraitPrimary",
          angle: viewport.width > viewport.height ? 90 : 0,
        },
      });
      await page.send("Emulation.setTouchEmulationEnabled", { enabled: viewport.touch });
      await navigateAndWait(page, TARGET_URL);
      await navigateAndWait(page, PLAYER_URL);
      await evaluate(page, `localStorage.removeItem("pianokids_game_tutorial_seen_v3")`);
      await navigateAndWait(page, PLAYER_URL);
      const tutorialLayout = await collectLayout(page);
      const tutorialShot = await capture(page, viewport, "tutorial");

      await evaluate(page, `(() => {
        localStorage.setItem("pianokids_game_tutorial_seen_v3", "true");
      })()`);
      await navigateAndWait(page, PLAYER_URL);
      await evaluate(page, `window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", key: "a", bubbles: true }))`);
      await wait(5600);
      const playingLayout = await collectLayout(page);
      const playingShot = await capture(page, viewport, "playing");
      const interactionIssues = [];
      const interactionScreenshots = {};

      if (viewport.touch && !playingLayout.hasOrientationOverlay) {
        const initialInteraction = await collectInteractionState(page);
        const initialSpeed = parsePercent(initialInteraction.speed);
        const initialMetronome = parsePercent(initialInteraction.metronome);

        const c4Pressed = await holdTestId(page, "virtual-key-C4", 220);
        if (!c4Pressed) interactionIssues.push("Tecla virtual C4 nao exibiu estado pressionado ao toque.");
        interactionScreenshots.keyboard = await capture(page, viewport, "interaction-keyboard");

        await tapTestId(page, "control-speed-up");
        const speedUpState = await collectInteractionState(page);
        const speedAfterUp = parsePercent(speedUpState.speed);
        if (initialSpeed === null || speedAfterUp === null || speedAfterUp <= initialSpeed) {
          interactionIssues.push(`Botao de aumentar velocidade nao alterou o valor (${initialInteraction.speed} -> ${speedUpState.speed}).`);
        }
        interactionScreenshots.speed = await capture(page, viewport, "interaction-speed");

        await tapTestId(page, "control-speed-down");
        const speedDownState = await collectInteractionState(page);
        const speedAfterDown = parsePercent(speedDownState.speed);
        if (speedAfterUp === null || speedAfterDown === null || speedAfterDown >= speedAfterUp) {
          interactionIssues.push(`Botao de reduzir velocidade nao alterou o valor (${speedUpState.speed} -> ${speedDownState.speed}).`);
        }

        await tapTestId(page, "control-waiting-toggle");
        const waitingState = await collectInteractionState(page);
        if (!waitingState.waitingActive) interactionIssues.push("Modo espera nao ficou ativo apos toque.");
        interactionScreenshots.waiting = await capture(page, viewport, "interaction-waiting");

        await tapTestId(page, "control-loop-toggle");
        const loopState = await collectInteractionState(page);
        if (!loopState.loopActive) interactionIssues.push("Loop nao ficou ativo apos toque.");

        await tapTestId(page, "control-metronome-up");
        const metronomeState = await collectInteractionState(page);
        const metronomeAfterUp = parsePercent(metronomeState.metronome);
        if (initialMetronome === null || metronomeAfterUp === null || metronomeAfterUp <= initialMetronome) {
          interactionIssues.push(`Botao do metronomo nao alterou o valor (${initialInteraction.metronome} -> ${metronomeState.metronome}).`);
        }

        await evaluate(page, `localStorage.setItem("pianokids_game_tutorial_seen_v3", "true")`);
        await navigateAndWait(page, PLAYER_URL);
        await evaluate(page, `window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", key: "a", bubbles: true }))`);
        await wait(5600);
        await tapTestId(page, "control-pause");
        await wait(350);
        let pausedState = await collectInteractionState(page);
        if (!pausedState.pauseActive) {
          await wait(800);
          await evaluate(page, `document.querySelector('[data-testid="control-pause"]')?.click()`);
          await wait(350);
          pausedState = await collectInteractionState(page);
        }
        if (!pausedState.pauseActive) {
          interactionIssues.push(`Controle de pausa nao exibiu estado pausado em cenario limpo (estado: ${pausedState.gameState ?? "desconhecido"}).`);
        }
      }

      await evaluate(page, `localStorage.setItem("pianokids_game_tutorial_seen_v3", "true")`);
      await navigateAndWait(page, PLAYER_URL);
      await evaluate(page, `window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", key: "a", bubbles: true }))`);
      await wait(28000);
      const endedLayout = await collectLayout(page);
      const scoreInteraction = await evaluate(
        page,
        `(() => {
          const score = document.querySelector('[data-testid="score-screen"]');
          if (!score) return null;
          score.scrollTop = score.scrollHeight;
          return true;
        })()`,
      );
      await wait(250);
      const endedInteractionState = await collectInteractionState(page);
      if (scoreInteraction && endedInteractionState.scoreScroll && !endedInteractionState.scoreScroll.bottomButtonsVisible) {
        interactionIssues.push("Tela final nao deixa os botoes principais visiveis apos rolagem ate o fim.");
      }
      const endedShot = await capture(page, viewport, "ended");

      report.push({
        viewport,
        screenshots: { tutorial: tutorialShot, playing: playingShot, ended: endedShot, interactions: interactionScreenshots },
        interactions: { issues: interactionIssues, ended: endedInteractionState },
        phases: {
          tutorial: { layout: tutorialLayout, issues: analyzeLayout(tutorialLayout) },
          playing: { layout: playingLayout, issues: analyzeLayout(playingLayout) },
          ended: { layout: endedLayout, issues: analyzeLayout(endedLayout) },
        },
      });
    }

    page.close();

    const summary = report.map((entry) => ({
      viewport: entry.viewport.name,
      size: `${entry.viewport.width}x${entry.viewport.height}`,
      issues: [
        ...Object.entries(entry.phases).flatMap(([phase, value]) => value.issues.map((issue) => `${phase}: ${issue}`)),
        ...entry.interactions.issues.map((issue) => `interaction: ${issue}`),
      ],
      screenshots: entry.screenshots,
      states: {
        tutorial: Boolean(entry.phases.tutorial.layout.rects.tutorial || entry.phases.tutorial.layout.hasOrientationOverlay),
        playing: Boolean(entry.phases.playing.layout.rects.canvas && !entry.phases.playing.layout.rects.tutorial),
        ended: Boolean(entry.phases.ended.layout.rects.scoreScreen),
      },
    }));

    const outputPath = path.join(TMP_DIR, "responsive-report.json");
    fs.writeFileSync(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));

    console.log(JSON.stringify({ outputPath, summary }, null, 2));
  } finally {
    browser.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
