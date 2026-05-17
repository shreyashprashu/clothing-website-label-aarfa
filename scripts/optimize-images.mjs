// One-time image pipeline: for every JPEG under public/images/products
// and public/images/diaries, generate WebP variants at 400w / 800w / 1280w.
// Cards use 400/800, product detail uses 1280. Skips files that already have
// an up-to-date .webp sibling, so re-running is cheap.
//
// Usage: npm run images
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const DIRS = ['public/images/products', 'public/images/diaries'];
// Per-width quality tiers. Thumbnails (400w in grid cards) don't benefit
// visibly from a higher quality, but the 800w and 1280w variants land in
// hero/PDP slots where preservation of edge detail matters — so we spend
// the extra bytes there. Source files in this project max at ~1200px wide,
// so the 1280w pass is effectively the original resolution at the chosen
// quality, which is the highest-fidelity render we can produce.
const WIDTH_QUALITY = [
  { width: 400,  quality: 82 },
  { width: 800,  quality: 88 },
  { width: 1280, quality: 92 },
];

let generated = 0;
let skipped = 0;

for (const SRC of DIRS) {
  if (!existsSync(SRC)) continue;
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (files.length === 0) continue;

  for (const file of files) {
    const srcPath = join(SRC, file);
    const { name } = parse(file);
    const srcStat = await stat(srcPath);

    for (const { width: w, quality } of WIDTH_QUALITY) {
      const outPath = join(SRC, `${name}.${w}.webp`);
      if (existsSync(outPath)) {
        const outStat = await stat(outPath);
        if (outStat.mtimeMs >= srcStat.mtimeMs) { skipped++; continue; }
      }
      await sharp(srcPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);
      generated++;
    }
  }
}

console.log(`✓ ${generated} generated, ${skipped} up-to-date`);
