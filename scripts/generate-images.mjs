// One-shot generator for OG image and PNG favicons.
// Run with: node scripts/generate-images.mjs
// Produces: public/og-image.png, public/favicon-{16,32,192,512}x{...}.png, public/apple-touch-icon.png
//
// Uses Playwright (already a dev dep) to render HTML to PNG. No new deps.

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '../public');

const OG_HTML = `<!DOCTYPE html>
<html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: -apple-system, system-ui, "Helvetica Neue", Arial, sans-serif; }
  .card {
    width: 1200px; height: 630px;
    background: #0a0a0a;
    color: #fafafa;
    padding: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }
  .grid {
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(115, 115, 115, 0.18) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .top {
    display: flex; align-items: center; gap: 16px;
    position: relative;
  }
  .mark {
    width: 48px; height: 48px;
    background: #242424;
    border: 1px solid #404040;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .mark .dot { width: 16px; height: 16px; background: #22c55e; border-radius: 50%; }
  .wordmark { font-size: 36px; font-weight: 600; letter-spacing: -0.025em; }
  .headline {
    font-size: 96px; font-weight: 600;
    letter-spacing: -0.035em; line-height: 1.02;
    max-width: 1040px;
    position: relative;
  }
  .footer {
    display: flex; align-items: center; gap: 16px;
    font-size: 24px; color: #a3a3a3;
    position: relative;
  }
  .pill {
    display: inline-flex; align-items: center; gap: 12px;
    padding: 10px 20px;
    background: #141414;
    border: 1px solid #262626;
    border-radius: 999px;
  }
  .pill-dot { width: 10px; height: 10px; border-radius: 50%; }
  .green { background: #22c55e; }
  .yellow { background: #eab308; }
  .gray { background: #525252; }
  .right { margin-left: auto; color: #737373; font-size: 22px; }
  .float {
    position: absolute;
    border-radius: 50%;
    box-shadow: 0 0 0 1px #404040, 0 8px 32px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  .float-1 { width: 18px; height: 18px; background: #22c55e; top: 110px; right: 90px; }
  .float-2 { width: 12px; height: 12px; background: #eab308; top: 200px; right: 220px; }
  .float-3 { width: 8px; height: 8px; background: #525252; top: 320px; right: 130px; }
</style></head>
<body><div class="card">
  <div class="grid"></div>
  <span class="float float-1"></span>
  <span class="float float-2"></span>
  <span class="float float-3"></span>
  <div class="top">
    <div class="mark"><div class="dot"></div></div>
    <div class="wordmark">Trajector</div>
  </div>
  <div class="headline">Find the few jobs<br>worth your time.</div>
  <div class="footer">
    <div class="pill"><span class="pill-dot green"></span>Strong</div>
    <div class="pill"><span class="pill-dot yellow"></span>Decent</div>
    <div class="pill"><span class="pill-dot gray"></span>Skip</div>
    <div class="right">Open-source · Local-first · Free</div>
  </div>
</div></body></html>`;

const FAVICON_HTML = (size) => `<!DOCTYPE html>
<html><head><style>
  body { margin: 0; padding: 0; }
  .card {
    width: ${size}px; height: ${size}px;
    background: #242424;
    border: ${Math.max(1, Math.floor(size / 32))}px solid #404040;
    border-radius: ${Math.max(2, Math.floor(size / 5))}px;
    display: flex; align-items: center; justify-content: center;
    box-sizing: border-box;
  }
  .dot {
    width: ${Math.floor(size * 0.45)}px;
    height: ${Math.floor(size * 0.45)}px;
    background: #22c55e;
    border-radius: 50%;
  }
</style></head>
<body><div class="card"><div class="dot"></div></div></body></html>`;

async function renderToPng(html, width, height, outFile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  // Tight crop to the body's first child if smaller than viewport
  await page.screenshot({ path: outFile, omitBackground: false, clip: { x: 0, y: 0, width, height } });
  await browser.close();
  console.log(`  ✓ ${path.relative(process.cwd(), outFile)} (${width}×${height})`);
}

async function main() {
  console.log('Generating OG image (1200×630)…');
  await renderToPng(OG_HTML, 1200, 630, path.join(PUBLIC, 'og-image.png'));

  console.log('Generating favicons…');
  for (const s of [16, 32, 192, 512]) {
    await renderToPng(FAVICON_HTML(s), s, s, path.join(PUBLIC, `favicon-${s}x${s}.png`));
  }
  await renderToPng(FAVICON_HTML(180), 180, 180, path.join(PUBLIC, 'apple-touch-icon.png'));

  console.log('\nAll images generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
