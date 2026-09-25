// Generates the PNG icons the web app manifest needs (Android install and
// iOS home screen) from public/pianify-icon.svg. Run: node scripts/generate-app-icons.js
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "public", "pianify-icon.svg");
const outDir = path.join(root, "public", "icons");
const BACKGROUND = "#10131d";

async function main() {
  const fs = require("node:fs");
  fs.mkdirSync(outDir, { recursive: true });

  for (const size of [192, 512]) {
    await sharp(source, { density: 384 }).resize(size, size).png().toFile(path.join(outDir, `icon-${size}.png`));
  }

  // Apple ignores transparency and rounds corners itself.
  await sharp(source, { density: 384 })
    .resize(180, 180)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(path.join(outDir, "apple-touch-icon.png"));

  // Maskable: keep the artwork inside the 80% safe zone on a full-bleed background.
  const inner = await sharp(source, { density: 384 }).resize(410, 410).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: BACKGROUND } })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, "icon-maskable-512.png"));

  console.log("Icons written to public/icons");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
