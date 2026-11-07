// Adds ?v=<content hash> to every local .css/.js link in the HTML pages.
//
//   npm run bust
//
// Run it after changing any CSS or JS. Cloudflare tells browsers to keep CSS/JS
// for hours, so without a new URL a returning visitor can get the new HTML with
// the old stylesheet. The hash only changes when the file's content changes.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LINK = /(\b(?:href|src)=")((?![a-z]+:|\/\/)[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]*)?(")/g;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const hashes = new Map();
async function hashOf(file) {
  if (!hashes.has(file)) {
    hashes.set(file, createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 10));
  }
  return hashes.get(file);
}

for (const file of await htmlFiles(root)) {
  const html = await readFile(file, 'utf8');
  const versions = {};
  for (const [, , ref] of html.matchAll(LINK)) {
    const target = ref.startsWith('/') ? path.join(root, ref) : path.join(path.dirname(file), ref);
    versions[ref] = await hashOf(target);
  }
  const out = html.replace(LINK, (m, pre, ref, post) => `${pre}${ref}?v=${versions[ref]}${post}`);
  if (out !== html) {
    await writeFile(file, out);
    console.log('updated', path.relative(root, file));
  }
}
