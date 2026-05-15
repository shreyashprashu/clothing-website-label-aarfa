// One-time image pipeline: for every JPEG under public/images/products,
// generate WebP variants at 400w / 800w / 1280w. Cards use 400/800,
// product detail uses 1280. Skips files that already have an up-to-date
// .webp sibling, so re-running is cheap.
//
// Usage: npm run images
import { readdir, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'public/images/products';
const WIDTHS = [400, 800, 1280];
const QUALITY = 82;

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (files.length === 0) {
  console.log('No source images found in', SRC);
  process.exit(0);
}

let generated = 0;
let skipped = 0;

for (const file of files) {
  const srcPath = join(SRC, file);
  const { name } = parse(file);
  const srcStat = await stat(srcPath);

  for (const w of WIDTHS) {
    const outPath = join(SRC, `${name}.${w}.webp`);
    if (existsSync(outPath)) {
      const outStat = await stat(outPath);
      if (outStat.mtimeMs >= srcStat.mtimeMs) { skipped++; continue; }
    }
    await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outPath);
    generated++;
  }
}

console.log(`✓ ${generated} generated, ${skipped} up-to-date`);
