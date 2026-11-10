#!/usr/bin/env node
/**
 * Rasterize the CYLOO brand SVGs into the PNG assets the platform expects:
 *
 *   public/favicon.png          64x64    (browser tab fallback)
 *   public/icon-192.png         192x192  (web app manifest, any)
 *   public/icon-512.png         512x512  (web app manifest, any + maskable)
 *   public/apple-touch-icon.png 180x180  (iOS home screen)
 *   public/og-image.png         1200x630 (social preview card)
 *
 * Source of truth: public/cyloo-icon.svg (the mark) and
 * public/cyloo-logo.svg (mark + wordmark) supplied by the brand owner.
 * Idempotent: safe to re-run; overwrites the PNGs in place.
 *
 * Usage: node scripts/generate-cyloo-png-assets.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const iconSvg = readFileSync(join(ROOT, "public", "cyloo-icon.svg"), "utf8");
const logoSvg = readFileSync(join(ROOT, "public", "cyloo-logo.svg"), "utf8");

/** One SVG screenshot at an exact pixel size over an optional background. */
async function shot(page, svg, width, height, outPath, { pad = 0, bg = null } = {}) {
  const inline = svg
    .replace(/<\?xml[^>]*\?>\s*/g, "")
    .replace(/width="[^"]*"/, "")
    .replace(/height="[^"]*"/, "");
  const inner = inline.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const viewBox = inline.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 512 512";
  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
  const scale = Math.min((width - 2 * pad) / vw, (height - 2 * pad) / vh);
  const drawW = vw * scale;
  const drawH = vh * scale;
  const dx = (width - drawW) / 2 - vx * scale;
  const dy = (height - drawH) / 2 - vy * scale;
  const html = `<!doctype html><html><body style="margin:0">
    <div style="width:${width}px;height:${height}px;background:${bg ?? "transparent"};display:flex;align-items:center;justify-content:center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${drawW}" height="${drawH}">${inner}</svg>
    </div>
  </body></html>`;
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: outPath, omitBackground: bg === null });
  console.log(`wrote ${outPath} (${width}x${height})`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

await shot(page, iconSvg, 64, 64, join(ROOT, "public", "favicon.png"), { pad: 4, bg: "#ffffff" });
await shot(page, iconSvg, 192, 192, join(ROOT, "public", "icon-192.png"), { pad: 24, bg: "#ffffff" });
await shot(page, iconSvg, 512, 512, join(ROOT, "public", "icon-512.png"), { pad: 64, bg: "#ffffff" });
await shot(page, iconSvg, 180, 180, join(ROOT, "public", "apple-touch-icon.png"), { pad: 22, bg: "#ffffff" });
await shot(page, logoSvg, 1200, 630, join(ROOT, "public", "og-image.png"), { pad: 60, bg: "#ffffff" });

await browser.close();
console.log("CYLOO PNG assets generated.");
