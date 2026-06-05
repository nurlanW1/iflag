/**
 * Quick watermark smoke-test.
 * Run: npx tsx test-watermark.ts
 * Output: test-output.png (same directory)
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { addWatermarkToImage } from './src/index.js';

async function main() {
  console.log('Creating test image…');

  // Generate a colourful test PNG (800×600, gradient-like blocks)
  const w = 800;
  const h = 600;
  const pixels = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      pixels[i]     = Math.floor((x / w) * 200) + 55;   // R
      pixels[i + 1] = Math.floor((y / h) * 180) + 40;   // G
      pixels[i + 2] = 120;                               // B
    }
  }

  const testImage = await sharp(pixels, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toBuffer();

  console.log(`Test image created: ${w}×${h}px`);
  console.log('Applying watermark…');

  const watermarked = await addWatermarkToImage(testImage);

  writeFileSync('test-output.png', watermarked);
  console.log('Done! Saved → test-output.png');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
