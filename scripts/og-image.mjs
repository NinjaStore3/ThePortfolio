// Renders assets/og-image.jpg (1200×630), the preview shown when the site is shared.
//
//   node scripts/og-image.mjs
//
// Uses the site's own fonts, logo and the -hero screenshots of one demo.

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
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #F6F5F2; font-family: Inter, sans-serif; color: #111; }
.block { position: absolute; left: 610px; top: 230px; width: 640px; height: 460px; border-radius: 36px; background: #ECE6DB; }
.text { position: absolute; left: 68px; top: 60px; bottom: 56px; width: 540px; display: flex; flex-direction: column; }
.logo { height: 40px; width: auto; align-self: flex-start; }
h1 { margin-top: 54px; font-size: 64px; line-height: 1.03; letter-spacing: -.045em; font-weight: 700; }
h1 em { font-style: normal; padding-bottom: 8px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 20' preserveAspectRatio='none'%3E%3Cpath d='M4 13 C 70 4, 160 3, 296 9' fill='none' stroke='%233B5BFD' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat 0 100% / 100% 17px; }
.chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
.chips span { padding: 8px 16px; border-radius: 999px; background: #fff; border: 1.5px solid #E2DFD8; color: #111; font-size: 21px; font-weight: 500; letter-spacing: -.01em; }
.chips span:first-child { background: #111; border-color: #111; color: #fff; }
.toast { position: absolute; display: flex; align-items: center; gap: 12px; padding: 12px 18px 12px 12px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgba(17,17,17,.06), 0 18px 34px -14px rgba(70,50,25,.45); }
.toast i { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: #E8ECFF; color: #3B5BFD; font-style: normal; }
.toast svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.toast b { display: block; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
.toast small { display: block; font-size: 15px; font-weight: 500; color: #55524C; }
.t1 { left: 600px; top: 86px; }
.t2 { left: 880px; top: 540px; }
.t2 i { background: #E2F5EA; color: #0A7F43; }
.url { margin-top: auto; font-size: 24px; font-weight: 700; color: #3B5BFD; }
.browser { position: absolute; left: 640px; top: 120px; width: 640px; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgba(17,17,17,.08), 0 30px 60px -28px rgba(70,50,25,.45); }
.bar { height: 34px; display: flex; align-items: center; gap: 7px; padding: 0 14px; background: #F3F2EF; border-bottom: 1px solid #E4E1DA; }
.bar i { width: 11px; height: 11px; border-radius: 50%; background: #FF5F57; }
.bar i + i { background: #FEBC2E; } .bar i + i + i { background: #28C840; }
.view { height: 400px; overflow: hidden; } .view img { width: 100%; display: block; }
.phone { position: absolute; left: 1004px; top: 268px; width: 160px; height: 346px; padding: 6px; border-radius: 28px; background: #111; box-shadow: 0 30px 50px -20px rgba(70,50,25,.55); }
.phone div { height: 100%; overflow: hidden; border-radius: 22px; } .phone img { width: 100%; display: block; }
</style></head><body>
<div class="block"></div>
<div class="browser"><div class="bar"><i></i><i></i><i></i></div><div class="view"><img src="${f(`assets/shots/${DEMO}-desktop-hero.webp`)}"></div></div>
<div class="phone"><div><img src="${f(`assets/shots/${DEMO}-mobile-hero.webp`)}"></div></div>
<div class="toast t1"><i><svg viewBox="0 0 24 24"><path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9z"/></svg></i><span><b>Νέο ραντεβού · Τρίτη 11:00</b><small>από την ψηφιακή γραμματεία</small></span></div>
<div class="toast t2"><i><svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6"/></svg></i><span><b>Νέα παραγγελία</b><small>24,50 €</small></span></div>
<div class="text">
  <img class="logo" src="${f('assets/logo.svg')}" alt="">
  <h1>Η βιτρίνα σας, στο κινητό <em>κάθε πελάτη.</em></h1>
  <div class="chips"><span>Ιστοσελίδες</span><span>E-shop</span><span>Social media</span><span>Βίντεο</span><span>AI bots</span><span>Google Ads</span></div>
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
