// node render.mjs <out-dir> [fps] [t1,t2,...]   -> frames (all, or only the listed times)
import { createRequire } from 'node:module';
const { chromium } = createRequire(new URL('../../package.json', import.meta.url))('playwright');
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2]; const fps = +(process.argv[3] || 30); const only = process.argv[4];
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
if (process.env.DUR) await p.addInitScript(d => { window.DUR = JSON.parse(d); }, process.env.DUR);
await p.goto('file://' + path.join(dir, 'video.html'), { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
const total = await p.evaluate(() => window.TOTAL);
const times = only ? only.split(',').map(Number) : Array.from({ length: Math.round(total * fps) }, (_, i) => i / fps);
let i = 0;
for (const t of times) {
  await p.evaluate(t => window.seek(t), t);
  const name = only ? `t${t.toFixed(2)}.png` : String(i).padStart(5, '0') + '.jpg';
  await p.screenshot({ path: path.join(out, name), type: only ? 'png' : 'jpeg', quality: only ? undefined : 94 });
  i++;
}
console.log('total', total.toFixed(2), 's,', times.length, 'frames');
await b.close();
