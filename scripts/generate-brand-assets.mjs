#!/usr/bin/env node
/**
 * Regenerates Expo icon, Android adaptive layers, splash, and favicon from assets/images/icon.png
 * Run: npm run generate-assets
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const input = path.join(root, 'assets/images/icon.png');
const to = (name) => path.join(root, 'assets/images', name);

async function main() {
  const bgIcon = { r: 11, g: 11, b: 11, alpha: 1 };
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

  const tmp1024 = path.join(os.tmpdir(), `stg-icon-${Date.now()}.png`);
  await sharp(input)
    .resize(1024, 1024, { fit: 'contain', background: bgIcon })
    .png()
    .toFile(tmp1024);
  fs.copyFileSync(tmp1024, to('icon.png'));
  fs.unlinkSync(tmp1024);
  await sharp(input)
    .resize(1024, 1024, { fit: 'contain', background: transparent })
    .png()
    .toFile(to('android-icon-foreground.png'));

  await sharp({
    create: {
      width: 108,
      height: 108,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toFile(to('android-icon-background.png'));

  await sharp(input)
    .resize(432, 432, { fit: 'contain', background: transparent })
    .greyscale()
    .normalize()
    .threshold(60)
    .png()
    .toFile(to('android-icon-monochrome.png'));

  await sharp(input)
    .resize(900, 900, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(to('splash-icon.png'));

  await sharp(input)
    .resize(48, 48, { fit: 'contain', background: bgIcon })
    .png()
    .toFile(to('favicon.png'));

  console.log('Wrote icon.png, android-icon-*.png, splash-icon.png, favicon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
