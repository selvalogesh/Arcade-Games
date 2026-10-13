// Renders 1080x1920 Play Store phone screenshots by letting a bot play the game.
// Usage: serve the repo root (e.g. `python -m http.server 8765`), then
//        node store/screenshots.mjs [http://127.0.0.1:8765/table-tennis/index.html]
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://127.0.0.1:8765/table-tennis/index.html";
const outDir = join(resolve(import.meta.dirname), "screenshots");
await mkdir(outDir, { recursive: true });

const RECORD = { easy: { won: 5, lost: 1 }, medium: { won: 3, lost: 4 }, hard: { won: 0, lost: 2 } };

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

// 1: the level menu with a few matches played
await shoot("1-levels", async () => {});

// 2: mid-rally, a ball just returned by the player flying up with its ghost trail behind it
await shoot("2-rally", async (page) => {
  await page.tap('button[data-level="easy"]');
  await page.evaluate(startBot);
  await page.waitForFunction(() => {
    const score = Number(document.getElementById("player-score").textContent) + Number(document.getElementById("cpu-score").textContent);
    const ball = window.ballSeen;
    return score >= 5 && window.ballReturned && ball.vy < 0 && ball.y > 150 && ball.y < 250;
  }, null, { timeout: 120000, polling: "raf" });
  // Freeze the game on this frame without showing the pause overlay
  await page.evaluate(() => (window.requestAnimationFrame = () => 0));
});

// 3: the end of a won match
await shoot("3-win", async (page) => {
  await page.tap('button[data-level="easy"]');
  await page.evaluate(startBot);
  await page.waitForFunction(() => document.getElementById("overlay-message").textContent.startsWith("You win"), null, { timeout: 300000 });
  await page.waitForTimeout(500);
});

await browser.close();

async function shoot(name, play) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    // Seeded Math.random so every run plays out the same
    let seed = 11;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    // Track the ball from what's drawn: it's the full-size (radius 6) circle. A ghost ball left this
    // frame is drawn full-size at the same spot, so only a change of position counts as a move.
    const arc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.arc = function (x, y, radius, ...rest) {
      const seen = window.ballSeen;
      if (radius === 6 && (!seen || seen.x !== x || seen.y !== y)) {
        window.ballSeen = { x, y, vy: seen ? y - seen.y : 0 };
        // ballReturned: the ball has come off the player's paddle since the last serve
        if (seen && Math.abs(y - seen.y) > 30) window.ballReturned = false;
        if (y > 360) window.ballReturned = true;
      }
      return arc.call(this, x, y, radius, ...rest);
    };
  });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate((record) => localStorage.setItem("table-tennis-record", JSON.stringify(record)), RECORD);
  await page.reload();
  await page.waitForTimeout(400);
  await play(page);
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  await ctx.close();
  console.log("wrote", name);
}

// Runs in the page: keeps the player's paddle under the ball, a little off-centre so shots go at an angle.
// It lets a few points go early on, so the match ends with a believable score.
function startBot() {
  const canvas = document.getElementById("table");
  let tick = 0;
  setInterval(() => {
    const ball = window.ballSeen;
    if (!ball) return;
    tick += 1;
    const player = Number(document.getElementById("player-score").textContent);
    const cpu = Number(document.getElementById("cpu-score").textContent);
    const missThisPoint = cpu < 4 && (player + cpu) % 3 === 1;
    const rect = canvas.getBoundingClientRect();
    const x = ball.x + (missThisPoint ? 90 : 24 * Math.sin(tick / 40));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: rect.left + (x / 300) * rect.width, clientY: rect.bottom - 20 }));
  }, 10);
}
