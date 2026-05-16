import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src', 'assets', 'branding');
const OUT = join(ROOT, 'public');

function rasterize(svgPath, width) {
  const svg = readFileSync(svgPath, 'utf-8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return resvg.render().asPng();
}

// Build a minimal ICO container holding a single PNG-encoded image.
// ICO format reference: https://en.wikipedia.org/wiki/ICO_(file_format)
function pngToIco(pngBuffer, sizePx) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // Reserved, must be 0
  header.writeUInt16LE(1, 2);          // Type: 1 = .ICO
  header.writeUInt16LE(1, 4);          // Image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(sizePx === 256 ? 0 : sizePx, 0); // Width  (0 = 256)
  entry.writeUInt8(sizePx === 256 ? 0 : sizePx, 1); // Height (0 = 256)
  entry.writeUInt8(0, 2);              // Color palette
  entry.writeUInt8(0, 3);              // Reserved
  entry.writeUInt16LE(1, 4);           // Color planes
  entry.writeUInt16LE(32, 6);          // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8);  // Image data size
  entry.writeUInt32LE(22, 12);         // Offset to image data (6+16=22)

  return Buffer.concat([header, entry, pngBuffer]);
}

// 1. og.png — 1200×630
console.log('Generating og.png (1200×630)...');
const ogPng = rasterize(join(SRC, 'og.svg'), 1200);
writeFileSync(join(OUT, 'og.png'), ogPng);

// 2. favicon.svg — copy source as-is
console.log('Copying favicon.svg...');
copyFileSync(join(SRC, 'favicon.svg'), join(OUT, 'favicon.svg'));

// 3. favicon.ico — 32×32 PNG-encoded ICO
console.log('Generating favicon.ico (32×32)...');
const faviconPng = rasterize(join(SRC, 'favicon.svg'), 32);
const ico = pngToIco(faviconPng, 32);
writeFileSync(join(OUT, 'favicon.ico'), ico);

// 4. apple-touch-icon.png — 180×180
console.log('Generating apple-touch-icon.png (180×180)...');
const appleTouch = rasterize(join(SRC, 'favicon.svg'), 180);
writeFileSync(join(OUT, 'apple-touch-icon.png'), appleTouch);

console.log('Done. 4 assets written to public/.');
