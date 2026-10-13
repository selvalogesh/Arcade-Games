// Renders 1080x1920 Play Store phone screenshots by letting an autopilot play the game.
// Usage: serve the repo root (e.g. `python -m http.server 8765`), then
//        node store/screenshots.mjs [http://127.0.0.1:8765/snake/index.html]
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://127.0.0.1:8765/snake/index.html";
const outDir = join(resolve(import.meta.dirname), "screenshots");
await mkdir(outDir, { recursive: true });

const BEST = 42;
// Score to reach before taking the screenshot; the last one then curls into its own body
const states = [
  { name: "1-start", score: null },
  { name: "2-midgame", score: 18 },
  { name: "3-game-over", score: 25, crash: true },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
for (const { name, score, crash } of states) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  // Seeded Math.random so food placement (and so every screenshot) is repeatable
  await ctx.addInitScript(() => {
    let seed = 7;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate((best) => localStorage.setItem("snake-best-score", String(best)), BEST);
  await page.reload();
  await page.waitForTimeout(400);
  if (score !== null) {
    // The snake starts facing up; turning left starts the game and gives the autopilot a known heading
    await page.keyboard.press("ArrowLeft");
    await page.evaluate(startAutopilot, "ArrowLeft");
    await page.waitForFunction((s) => Number(document.getElementById("score").textContent) >= s, score, { timeout: 120000 });
    if (crash) {
      await page.evaluate(() => (window.autopilotCrash = true));
      await page.waitForFunction(() => !document.getElementById("overlay").hidden, null, { timeout: 20000 });
      await page.waitForTimeout(500);
    } else {
      // Freeze the game between moves without showing the pause overlay
      await page.evaluate(() => {
        clearInterval(window.autopilot);
        window.requestAnimationFrame = () => 0;
      });
    }
  }
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  await ctx.close();
  console.log("wrote", name);
}
await browser.close();

// Runs in the page: greedily steers toward the food, avoiding the edges and the snake's body.
// With window.autopilotCrash set it turns clockwise every move until it hits itself.
function startAutopilot(initialDirection) {
  const GRID_SIZE = 21;
  const DIRECTIONS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  const position = (el) => ({ x: Number(el.style.gridColumnStart), y: Number(el.style.gridRowStart) });
  let lastHead = null;
  let current = initialDirection;
  window.autopilot = setInterval(() => {
    const headElement = document.querySelector(".snake.head");
    if (!headElement) return;
    const head = position(headElement);
    if (`${head.x},${head.y}` === lastHead) return;
    lastHead = `${head.x},${head.y}`;
    const food = position(document.querySelector(".food"));
    const body = new Set([...document.querySelectorAll(".snake")].map((el) => `${el.style.gridColumnStart},${el.style.gridRowStart}`));
    if (window.autopilotCrash) {
      const clockwise = { ArrowRight: "ArrowDown", ArrowDown: "ArrowLeft", ArrowLeft: "ArrowUp", ArrowUp: "ArrowRight" };
      current = clockwise[current];
      window.dispatchEvent(new KeyboardEvent("keydown", { key: current }));
      return;
    }
    let best = null;
    for (const [key, [dx, dy]] of Object.entries(DIRECTIONS)) {
      if (current && dx === -DIRECTIONS[current][0] && dy === -DIRECTIONS[current][1]) continue;
      const x = head.x + dx;
      const y = head.y + dy;
      if (x < 1 || y < 1 || x > GRID_SIZE || y > GRID_SIZE || body.has(`${x},${y}`)) continue;
      const distance = Math.abs(x - food.x) + Math.abs(y - food.y);
      if (!best || distance < best.distance) best = { key, distance };
    }
    if (best && best.key !== current) {
      current = best.key;
      window.dispatchEvent(new KeyboardEvent("keydown", { key: current }));
    }
  }, 5);
}
