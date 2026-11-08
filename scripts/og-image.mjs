// Renders assets/og-image.jpg (1200×630), the preview shown when the site is shared.
//
//   node scripts/og-image.mjs
//
// Uses the site's own fonts, light logo and the -hero screenshots of one demo.

import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import { writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = (p) => 'file://' + path.join(root, p);
const DEMO = '07-garage';

const html = `<!doctype html><html lang="el"><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-weight: 700; src: url(${f('assets/fonts/inter-greek-700-normal.woff2')}); unicode-range: U+0370-03FF; }
@font-face { font-family: Inter; font-weight: 700; src: url(${f('assets/fonts/inter-latin-700-normal.woff2')}); }
@font-face { font-family: Inter; font-weight: 500; src: url(${f('assets/fonts/inter-greek-500-normal.woff2')}); unicode-range: U+0370-03FF; }
@font-face { font-family: Inter; font-weight: 500; src: url(${f('assets/fonts/inter-latin-500-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #0C0C10; font-family: Inter, sans-serif; color: #fff; }
.glow { position: absolute; border-radius: 50%; }
.g1 { width: 900px; height: 900px; left: -360px; top: -420px; background: radial-gradient(closest-side, rgba(59, 91, 253, .6), transparent); }
.g2 { width: 800px; height: 800px; right: -300px; top: 60px; background: radial-gradient(closest-side, rgba(139, 92, 246, .36), transparent); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size: 44px 44px; -webkit-mask-image: radial-gradient(ellipse 70% 80% at 30% 0%, #000 20%, transparent 75%); }
.text { position: absolute; left: 68px; top: 60px; bottom: 56px; width: 540px; display: flex; flex-direction: column; }
.logo { height: 40px; width: auto; align-self: flex-start; }
h1 { margin-top: 54px; font-size: 64px; line-height: 1.03; letter-spacing: -.045em; font-weight: 700; }
h1 em { font-style: normal; background: linear-gradient(100deg, #A9B8FF, #5E7BFF 55%, #B49BFF); -webkit-background-clip: text; color: transparent; }
p { margin-top: 24px; font-size: 26px; line-height: 1.35; color: #B4B1AA; font-weight: 500; letter-spacing: -.01em; }
.url { margin-top: auto; font-size: 24px; font-weight: 700; color: #8EA2FF; }
.browser { position: absolute; left: 640px; top: 120px; width: 640px; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,.1), 0 40px 80px -30px rgba(0,0,0,.8), 0 0 140px -30px rgba(59,91,253,.5); }
.bar { height: 34px; display: flex; align-items: center; gap: 7px; padding: 0 14px; background: #F3F2EF; border-bottom: 1px solid #E4E1DA; }
.bar i { width: 11px; height: 11px; border-radius: 50%; background: #FF5F57; }
.bar i + i { background: #FEBC2E; } .bar i + i + i { background: #28C840; }
.view { height: 400px; overflow: hidden; } .view img { width: 100%; display: block; }
.phone { position: absolute; left: 1004px; top: 268px; width: 160px; height: 346px; padding: 6px; border-radius: 28px; background: #0B0B0E; box-shadow: 0 0 0 1px rgba(255,255,255,.14), 0 30px 60px -18px rgba(0,0,0,.75); }
.phone div { height: 100%; overflow: hidden; border-radius: 22px; } .phone img { width: 100%; display: block; }
</style></head><body>
<div class="glow g1"></div><div class="glow g2"></div><div class="grid"></div>
<div class="browser"><div class="bar"><i></i><i></i><i></i></div><div class="view"><img src="${f(`assets/shots/${DEMO}-desktop-hero.webp`)}"></div></div>
<div class="phone"><div><img src="${f(`assets/shots/${DEMO}-mobile-hero.webp`)}"></div></div>
<div class="text">
  <img class="logo" src="${f('assets/logo-light.svg')}" alt="">
  <h1>Η βιτρίνα σας, στο κινητό <em>κάθε πελάτη.</em></h1>
  <p>Σύγχρονες ιστοσελίδες για κάθε είδους επιχείρηση.</p>
  <div class="url">istoselidakias.gr</div>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Loaded from a file:// page so the file:// fonts and images are allowed.
const tmp = path.join(os.tmpdir(), 'istoselidakias-og.html');
await writeFile(tmp, html);
await page.goto('file://' + tmp, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, 'assets', 'og-image.jpg'), type: 'jpeg', quality: 86 });
await browser.close();
await rm(tmp);
console.log('wrote assets/og-image.jpg');
