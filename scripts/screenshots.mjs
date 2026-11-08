// Generates the portfolio screenshots for every demo in /demos.
//
//   npm install            (once — installs Playwright)
//   npx playwright install chromium   (once, if you don't have a Chromium for Playwright yet)
//   npm run shots          (all demos)
//   npm run shots -- 04-hair 10-groomer   (only some)
//
// Output in assets/shots/:
//   {slug}-desktop.webp        1440×900 viewport, full page (lightbox)
//   {slug}-mobile.webp         390×844 viewport, full page (lightbox)
//   {slug}-desktop-thumb.webp  top of the desktop page (portfolio card)
//   {slug}-mobile-thumb.webp   top of the mobile page (portfolio card)
//   {slug}-desktop-hero.webp   full desktop page at 1120px wide (hero showcase, demos only)
//   {slug}-mobile-hero.webp    full mobile page at 440px wide (hero showcase, demos only)
//
// Extra pages that are not a demo's index.html (e.g. the e-shop example) are listed in EXTRA_PAGES.
//
// Fixed elements (sticky call bars, floating buttons) end up at the bottom of the
// image: the viewport is stretched to the full page height before capturing.
// WebP encoding happens inside Chromium (canvas.toDataURL), so Playwright is the
// only dependency.

import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'shots');

const VARIANTS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1, quality: 0.8, thumbWidth: 960, heroWidth: 1120 },
  { name: 'mobile', width: 390, height: 844, dpr: 2, quality: 0.72, thumbWidth: 390, heroWidth: 440 },
];

const EXTRA_PAGES = [
  { slug: '01-butcher-eshop', path: '/demos/01-butcher/eshop.html' },
  { slug: 'admin-orders', path: '/demos/admin/orders.html' },
  { slug: 'admin-appointments', path: '/demos/admin/appointments.html' },
];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json',
};

// Tiny static server for the repo root (same URLs as on Cloudflare Pages).
function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = path.join(root, p);
      if (!file.startsWith(root)) throw new Error('outside root');
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function listPages(only) {
  const entries = await readdir(path.join(root, 'demos'), { withFileTypes: true });
  const demos = entries
    .filter((d) => d.isDirectory() && /^\d\d-/.test(d.name))
    .map((d) => ({ slug: d.name, path: `/demos/${d.name}/`, demo: true }));
  return [...demos, ...EXTRA_PAGES]
    .filter((p) => only.length === 0 || only.includes(p.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// PNG buffer -> WebP buffer, optionally cropped to the top `cropHeight` px and resized to `width`.
async function toWebp(encoder, png, { quality, cropHeight, width }) {
  const dataUrl = await encoder.evaluate(async ({ b64, quality, cropHeight, width }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const sh = cropHeight ? Math.min(cropHeight, img.naturalHeight) : img.naturalHeight;
    const scale = width ? width / img.naturalWidth : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, img.naturalWidth, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', quality);
  }, { b64: png.toString('base64'), quality, cropHeight, width });
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function capture(browser, url, v) {
  const context = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.dpr,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // Load lazy images and wait for fonts, so nothing is blank in the capture.
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
    await document.fonts.ready;
  });
  // Stretch the viewport to the whole page so fixed bars sit at the very bottom.
  let height = 0;
  for (let i = 0; i < 3; i++) {
    const h = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
    if (h === height) break;
    height = h;
    await page.setViewportSize({ width: v.width, height });
    await page.waitForTimeout(250);
  }
  const png = await page.screenshot({ type: 'png' });
  await context.close();
  return { png, height };
}

const only = process.argv.slice(2);
const pages = await listPages(only);
if (pages.length === 0) {
  console.error('No demos found' + (only.length ? ` for: ${only.join(', ')}` : ''));
  process.exit(1);
}
await mkdir(outDir, { recursive: true });

const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const encoder = await browser.newPage();

try {
  for (const { slug, path: pagePath, demo } of pages) {
    for (const v of VARIANTS) {
      const { png, height } = await capture(browser, base + pagePath, v);
      const full = await toWebp(encoder, png, { quality: v.quality });
      const thumb = await toWebp(encoder, png, { quality: v.quality, cropHeight: v.height * v.dpr, width: v.thumbWidth });
      await writeFile(path.join(outDir, `${slug}-${v.name}.webp`), full);
      await writeFile(path.join(outDir, `${slug}-${v.name}-thumb.webp`), thumb);
      if (demo) {
        const hero = await toWebp(encoder, png, { quality: 0.74, width: v.heroWidth });
        await writeFile(path.join(outDir, `${slug}-${v.name}-hero.webp`), hero);
      }
      console.log(`${slug} ${v.name.padEnd(7)} ${v.width}×${height}  full ${(full.length / 1024).toFixed(0)}KB  thumb ${(thumb.length / 1024).toFixed(0)}KB`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
