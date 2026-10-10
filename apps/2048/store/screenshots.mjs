// Renders 1080x1920 Play Store phone screenshots from preset game states.
// Usage: serve the repo root (e.g. `python -m http.server 8765`), then
//        node store/screenshots.mjs [http://127.0.0.1:8765/2048/index.html]
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://127.0.0.1:8765/2048/index.html";
const outDir = join(resolve(import.meta.dirname), "screenshots");
await mkdir(outDir, { recursive: true });

const states = [
  { name: "1-midgame", best: 256, game: { hasWon: false, tiles: [2, 8, 32, 128, 0, 4, 16, 64, 0, 2, 4, 8, 0, 0, 0, 2] } },
  { name: "2-late-game", best: 2048, game: { hasWon: true, tiles: [2048, 1024, 256, 64, 4, 512, 128, 16, 2, 8, 32, 4, 0, 2, 4, 2] } },
  // Merging the two 1024s on the first move shows the win screen
  { name: "3-win", best: 1024, game: { hasWon: false, tiles: [1024, 1024, 128, 32, 2, 256, 64, 8, 0, 4, 16, 2, 0, 0, 2, 4] }, move: "ArrowLeft" },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
for (const { name, best, game, move } of states) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(([g, b]) => {
    localStorage.setItem("2048-game", JSON.stringify(g));
    localStorage.setItem("2048-best-tile", String(b));
  }, [game, best]);
  await page.reload();
  await page.waitForTimeout(400);
  if (move) {
    await page.keyboard.press(move);
    await page.waitForTimeout(900);
  }
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  await ctx.close();
  console.log("wrote", name);
}
await browser.close();
