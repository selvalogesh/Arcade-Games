// Copies one game (plus the shared utilities it imports) into an app's www folder,
// which Capacitor bundles into the Android app.
// Usage: node ../build-www.mjs <game-folder>   (run from apps/<app>/)
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const game = process.argv[2];
if (!game) {
  console.error("Usage: node ../build-www.mjs <game-folder>");
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, "..");
const gameDir = join(repoRoot, game);
const outDir = resolve("www");

// Web-only files that are useless inside the app
const EXCLUDE = new Set(["desktop_screenshot.png"]);

await rm(outDir, { recursive: true, force: true });
await cp(gameDir, outDir, {
  recursive: true,
  filter: (src) => !EXCLUDE.has(src.split(/[\\/]/).pop()),
});
await cp(join(repoRoot, "utilities"), join(outDir, "utilities"), { recursive: true });

// Games import "../utilities/..." relative to the repo layout; in www it sits alongside
for (const file of await readdir(outDir, { recursive: true })) {
  if (![".js", ".html"].includes(extname(file))) continue;
  const path = join(outDir, file);
  const source = await readFile(path, "utf8");
  const rewritten = source.replaceAll("../utilities/", "./utilities/");
  if (rewritten !== source) await writeFile(path, rewritten);
}

console.log(`Built ${game} into ${outDir}`);
