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
const SNAKE = "hsl(200, 100%, 50%)";
const GLOW = "hsla(200, 100%, 55%, 0.8)";
const EYE = "#1c1c1c";
const FOOD = "hsl(50, 100%, 50%)";

// An S-shaped glowing snake on a 5x5 grid of `cell` px blocks, its head top right heading for the food.
// Sizes match the game: blocks fill 88% of a cell, eyes are 24% of a block, 18% in from its edges.
const BODY = [[2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4]];
const art = (cell) => {
  const size = cell * 0.88;
  const block = (x, y, style) => `
    <div style="position:absolute;left:${x * cell + cell * 0.06}px;top:${y * cell + cell * 0.06}px;
      width:${size}px;height:${size}px;${style}"></div>`;
  const blocks = BODY.map(([x, y]) =>
    block(x, y, `border-radius:${cell * 0.18}px;background:${SNAKE};box-shadow:0 0 ${cell * 0.14}px ${GLOW}`));
  blocks.push(block(4, 0, `border-radius:50%;background:${FOOD}`));
  // Two eyes on the head's right side, looking at the food
  const eyeSize = size * 0.24;
  const inset = size * 0.18;
  const eye = (top) => `<div style="position:absolute;left:${2 * cell + cell * 0.06 + size - inset - eyeSize}px;
    top:${top}px;width:${eyeSize}px;height:${eyeSize}px;border-radius:50%;background:${EYE}"></div>`;
  const eyes = eye(cell * 0.06 + inset) + eye(cell * 0.06 + size - inset - eyeSize);
  return `<div style="position:relative;width:${cell * 5}px;height:${cell * 5}px">${blocks.join("")}${eyes}</div>`;
};

const page = (w, h, bg, body) => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;
  background:${bg};display:flex;align-items:center;justify-content:center;overflow:hidden">${body}</body></html>`;

const outputs = [
  // @capacitor/assets sources: adaptive icon (foreground keeps inside the 66% safe zone)
  { file: join(assetsDir, "icon-only.png"), w: 1024, h: 1024, html: page(1024, 1024, BG, art(120)) },
  { file: join(assetsDir, "icon-foreground.png"), w: 1024, h: 1024, html: page(1024, 1024, "transparent", art(96)), transparent: true },
  { file: join(assetsDir, "icon-background.png"), w: 1024, h: 1024, html: page(1024, 1024, BG, "") },
  { file: join(assetsDir, "splash.png"), w: 2732, h: 2732, html: page(2732, 2732, BG, art(100)) },
  { file: join(assetsDir, "splash-dark.png"), w: 2732, h: 2732, html: page(2732, 2732, BG, art(100)) },
  // Play Store listing graphics
  { file: join(storeDir, "play-icon-512.png"), w: 512, h: 512, html: page(512, 512, BG, art(72)) },
  {
    file: join(storeDir, "feature-graphic-1024x500.png"), w: 1024, h: 500,
    html: page(1024, 500, BG, `
      <div style="display:flex;align-items:center;gap:72px">
        ${art(70)}
        <div style="font-family:Arial;color:#eee">
          <div style="font:bold 96px Arial;color:hsl(200,50%,75%)">Snake</div>
          <div style="font-size:34px;margin-top:12px;color:#bbb">Swipe. Eat. Grow.</div>
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
