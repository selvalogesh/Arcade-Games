// Renders the app icon / splash sources and Play Store graphics from HTML with headless Chrome.
// Usage: node store/render-assets.mjs   (needs playwright-core and a local Chrome)
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";

const appDir = resolve(import.meta.dirname, "..");
const assetsDir = join(appDir, "assets");
const storeDir = join(appDir, "store");
await mkdir(assetsDir, { recursive: true });

const BG = "#333333";
const PLAYER = "hsl(200, 100%, 50%)";
const CPU = "hsl(0, 75%, 60%)";
const BALL = "hsl(50, 100%, 50%)";

// A mini table in a `size` px square: the red paddle at the top has just sent the ball,
// which flies (with its trail of fading ghost balls) toward the blue paddle at the bottom.
// Positions are in percent of the square.
const art = (size) => {
  const u = size / 100;
  const paddle = (x, y, color) => `<div style="position:absolute;left:${(x - 20) * u}px;top:${(y - 4) * u}px;
    width:${40 * u}px;height:${8 * u}px;border-radius:${4 * u}px;background:${color};box-shadow:0 0 ${4 * u}px ${color}"></div>`;
  const ball = (x, y, radius, opacity) => `<div style="position:absolute;left:${(x - radius) * u}px;top:${(y - radius) * u}px;
    width:${radius * 2 * u}px;height:${radius * 2 * u}px;border-radius:50%;background:${BALL};opacity:${opacity};
    box-shadow:0 0 ${3 * u}px ${BALL}"></div>`;
  // Along the line from the red paddle (32, 22) toward the blue one (68, 78); ghosts sit apart like in the game
  const along = (t) => [32 + 36 * t, 22 + 56 * t];
  const ghosts = [[0.18, 3.6, 0.2], [0.36, 4.2, 0.35], [0.54, 4.8, 0.55]].map(([t, r, o]) => ball(...along(t), r, o));
  const net = `<div style="position:absolute;left:${10 * u}px;top:${49.5 * u}px;width:${80 * u}px;height:0;
    border-top:${1.2 * u}px dashed rgba(255,255,255,0.25)"></div>`;
  return `<div style="position:relative;width:${size}px;height:${size}px">
    ${net}${paddle(38, 16, CPU)}${paddle(62, 84, PLAYER)}${ghosts.join("")}${ball(...along(0.72), 5.5, 1)}</div>`;
};

const page = (w, h, bg, body) => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;
  background:${bg};display:flex;align-items:center;justify-content:center;overflow:hidden">${body}</body></html>`;

const outputs = [
  // @capacitor/assets sources: adaptive icon (foreground keeps inside the 66% safe zone)
  { file: join(assetsDir, "icon-only.png"), w: 1024, h: 1024, html: page(1024, 1024, BG, art(860)) },
  { file: join(assetsDir, "icon-foreground.png"), w: 1024, h: 1024, html: page(1024, 1024, "transparent", art(640)), transparent: true },
  { file: join(assetsDir, "icon-background.png"), w: 1024, h: 1024, html: page(1024, 1024, BG, "") },
  { file: join(assetsDir, "splash.png"), w: 2732, h: 2732, html: page(2732, 2732, BG, art(700)) },
  { file: join(assetsDir, "splash-dark.png"), w: 2732, h: 2732, html: page(2732, 2732, BG, art(700)) },
  // Play Store listing graphics
  { file: join(storeDir, "play-icon-512.png"), w: 512, h: 512, html: page(512, 512, BG, art(440)) },
  {
    file: join(storeDir, "feature-graphic-1024x500.png"), w: 1024, h: 500,
    html: page(1024, 500, BG, `
      <div style="display:flex;align-items:center;gap:56px">
        ${art(400)}
        <div style="font-family:Arial;color:#eee">
          <div style="font:bold 84px Arial;line-height:1;color:hsl(200,50%,75%)">Table<br>Tennis</div>
          <div style="font-size:34px;margin-top:20px;color:#bbb">Rally. Smash. Win.</div>
        </div>
      </div>`),
  },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
for (const { file, w, h, html, transparent } of outputs) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.screenshot({ path: file, omitBackground: !!transparent });
  await p.close();
  console.log("wrote", file);
}
await browser.close();
