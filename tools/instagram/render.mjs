// node tools/instagram/render.mjs  -> tools/instagram/out/*.jpg (1080×1350, profile 1080×1080)
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(new URL('../../package.json', import.meta.url))('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'out');
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
await p.goto('file://' + path.join(dir, 'posts.html'), { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
for (const id of await p.$$eval('body > div[id]', els => els.map(e => e.id))) {
  await p.locator(`#${id} > section`).screenshot({ path: path.join(out, `${id}.jpg`), type: 'jpeg', quality: 93 });
}
console.log('done');
await b.close();
