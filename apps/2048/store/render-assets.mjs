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
const TILE = "hsl(200, 50%, 40%)";

// A single game tile, sized relative to `size` px
const tile = (size) => `
  <div style="width:${size}px;height:${size}px;border-radius:${size * 0.12}px;background:${TILE};
    display:flex;align-items:center;justify-content:center;color:#fff;font:bold ${size * 0.34}px Arial;
    letter-spacing:-${size * 0.005}px">2048</div>`;

const page = (w, h, bg, body) => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;
  background:${bg};display:flex;align-items:center;justify-content:center;overflow:hidden">${body}</body></html>`;

const outputs = [
  // @capacitor/assets sources: adaptive icon (foreground keeps inside the 66% safe zone)
  { file: join(assetsDir, "icon-only.png"), w: 1024, h: 1024, html: page(1024, 1024, BG, tile(640)) },
  { file: join(assetsDir, "icon-foreground.png"), w: 1024, h: 1024, html: page(1024, 1024, "transparent", tile(700)), transparent: true },
  { file: join(assetsDir, "icon-background.png"), w: 1024, h: 1024, html: page(1024, 1024, BG, "") },
  { file: join(assetsDir, "splash.png"), w: 2732, h: 2732, html: page(2732, 2732, BG, tile(600)) },
  { file: join(assetsDir, "splash-dark.png"), w: 2732, h: 2732, html: page(2732, 2732, BG, tile(600)) },
  // Play Store listing graphics
  { file: join(storeDir, "play-icon-512.png"), w: 512, h: 512, html: page(512, 512, BG, tile(360)) },
  {
    file: join(storeDir, "feature-graphic-1024x500.png"), w: 1024, h: 500,
    html: page(1024, 500, BG, `
      <div style="display:flex;align-items:center;gap:56px">
        ${tile(260)}
        <div style="font-family:Arial;color:#eee">
          <div style="font:bold 72px Arial;color:hsl(200,50%,75%)">2048</div>
          <div style="font-size:34px;margin-top:12px;color:#bbb">Swipe. Merge. Reach 2048.</div>
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
