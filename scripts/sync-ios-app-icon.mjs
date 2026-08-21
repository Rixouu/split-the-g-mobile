#!/usr/bin/env node
/**
 * Syncs the approved Expo app icon into the native iOS asset catalog.
 * Run this after replacing assets/images/icon.png and before an Xcode build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'images', 'icon.png');
const destination = path.join(
  root,
  'ios',
  'SplitTheG',
  'Images.xcassets',
  'AppIcon.appiconset',
  'App-Icon-1024x1024@1x.png',
);

if (!fs.existsSync(source)) {
  throw new Error(`Expected the approved app icon at ${source}`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
await sharp(source)
  .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
  .removeAlpha()
  .png()
  .toFile(destination);

console.log(`Synced iOS app icon from ${path.relative(root, source)}.`);
