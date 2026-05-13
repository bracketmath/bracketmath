#!/usr/bin/env node
/**
 * Self-host the Google Fonts the site uses (Inter 400/500/600/700 and
 * JetBrains Mono 400/500). Run once at setup time; the fetched .woff2
 * files land in `public/fonts/` and are referenced by `@font-face`
 * rules in `src/styles/global.css`.
 *
 * Lighthouse on the live URL flagged ~780ms of TTI savings from removing
 * the round-trip to fonts.googleapis.com and fonts.gstatic.com.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'fonts');
if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

const CSS_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700' +
  '&family=JetBrains+Mono:wght@400;500' +
  '&display=swap';

// Spoof a Chrome UA so Google serves woff2 with an unhinted-latin subset.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

console.log('Fetching CSS from', CSS_URL);
const cssRes = await fetch(CSS_URL, { headers: { 'User-Agent': UA } });
if (!cssRes.ok) throw new Error('CSS fetch failed: ' + cssRes.status);
const css = await cssRes.text();

// Walk every @font-face block, keep only the 'latin' subset comment.
const re =
  /\/\*\s*([a-zA-Z-]+)\s*\*\/[^@]*@font-face\s*\{[^}]*font-family:\s*'([^']+)'[^}]*font-weight:\s*(\d+)[^}]*src:\s*url\(([^)]+)\)\s*format\('woff2'\)/g;

const downloads = [];
let m;
while ((m = re.exec(css)) !== null) {
  const [, subset, family, weight, url] = m;
  if (subset !== 'latin') continue;
  const slug = family.toLowerCase().replace(/\s+/g, '-');
  const file = `${slug}-${weight}-latin.woff2`;
  downloads.push({ file, url });
}

console.log(`Downloading ${downloads.length} woff2 files…`);
for (const { file, url } of downloads) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Font fetch failed (${url}): ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(join(outDir, file), buf);
  console.log(`  ✓ ${file} (${buf.length} bytes)`);
}

console.log('Done. Output:', outDir);
