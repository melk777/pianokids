const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const nextDir = path.join(projectRoot, ".next");

try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleared .next before starting dev.");
} catch (error) {
  console.warn("Failed to clear .next before dev start:", error);
}

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const extraArgs = process.argv.slice(2);
const hasBundlerFlag = extraArgs.includes("--turbopack") || extraArgs.includes("--webpack");
const child = spawn(
  process.execPath,
  [nextBin, "dev", ...(hasBundlerFlag ? [] : ["--turbopack"]), ...extraArgs],
  {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
