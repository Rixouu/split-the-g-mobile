#!/usr/bin/env node
/**
 * Regenerates Expo icon, Android adaptive layers, splash, and favicon from
 * `assets/images/icon.svg` (preferred) or `assets/images/icon.png`.
 * Run: npm run generate-assets
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const to = (name) => path.join(root, 'assets/images', name);

const MASTER_PX = 4096;

/**
 * @returns {Promise<Buffer>}
 */
async function loadLogoRasterBuffer() {
  const svgPath = to('icon.svg');
  const pngPath = to('icon.png');
  /** @type {import('sharp').Sharp} */
  let pipeline;

  if (fs.existsSync(svgPath)) {
    pipeline = sharp(svgPath, { density: 512 });
  } else if (fs.existsSync(pngPath)) {
    pipeline = sharp(pngPath);
  } else {
    throw new Error('Expected assets/images/icon.svg or assets/images/icon.png.');
  }

  return pipeline
    .resize(MASTER_PX, MASTER_PX, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function main() {
  const bgIcon = { r: 0, g: 0, b: 0, alpha: 1 };
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

  const logoBuf = await loadLogoRasterBuffer();
  const logo = () => sharp(logoBuf);

  const tmp1024 = path.join(os.tmpdir(), `stg-icon-${Date.now()}.png`);
  await logo()
    .resize(1024, 1024, { fit: 'contain', background: bgIcon })
    .png()
    .toFile(tmp1024);
  fs.copyFileSync(tmp1024, to('icon.png'));
  fs.unlinkSync(tmp1024);
  await logo()
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

  await logo()
    .resize(432, 432, { fit: 'contain', background: transparent })
    .greyscale()
    .normalize()
    .threshold(60)
    .png()
    .toFile(to('android-icon-monochrome.png'));

  await logo()
    .resize(900, 900, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(to('splash-icon.png'));

  await logo()
    .resize(48, 48, { fit: 'contain', background: bgIcon })
    .png()
    .toFile(to('favicon.png'));

  console.log(
    'Wrote icon.png, android-icon-*.png, splash-icon.png, favicon.png (from icon.svg when present)',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
