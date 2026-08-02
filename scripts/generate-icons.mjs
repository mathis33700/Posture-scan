/**
 * Génère les icônes PNG de la PWA sans dépendance graphique.
 *
 * Le motif reprend le favicon.svg : fil à plomb pointillé + points anatomiques
 * reliés par les lignes d'épaules et de bassin. Rasterisation maison (rien de
 * plus qu'un encodeur PNG + zlib de Node) pour ne pas tirer canvas/sharp dans
 * les dépendances du projet.
 *
 * Usage : node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const NAVY = [15, 23, 42];
const SKY = [56, 189, 248];
const SNOW = [248, 250, 252];

/** Coordonnées du motif, exprimées dans un carré de référence de 64 unités. */
const UNIT = 64;
const HEAD = { x: 32, y: 17, r: 4.5 };
const PLUMB = { x: 32, y0: 8, y1: 56 };
const SEGMENTS = [
  { a: { x: 20, y: 27 }, b: { x: 44, y: 30 } }, // ligne d'épaules
  { a: { x: 22, y: 41 }, b: { x: 42, y: 39 } }, // ligne de bassin
];
const MARKERS = SEGMENTS.flatMap(({ a, b }) => [a, b]);

/** Distance d'un point au segment [a,b], utilisée pour tracer des traits épais. */
function distanceToSegment(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lengthSquared));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/** Mélange `over` sur `under` avec une couverture alpha de 0 à 1. */
function blend(under, over, alpha) {
  if (alpha <= 0) return under;
  if (alpha >= 1) return over;
  return [
    Math.round(under[0] + (over[0] - under[0]) * alpha),
    Math.round(under[1] + (over[1] - under[1]) * alpha),
    Math.round(under[2] + (over[2] - under[2]) * alpha),
  ];
}

/**
 * Couverture antialiasée d'une forme implicite : 1 à l'intérieur, 0 au-delà
 * d'un demi-pixel, dégradé linéaire entre les deux.
 */
function coverage(signedDistance, feather) {
  return Math.max(0, Math.min(1, 0.5 - signedDistance / feather));
}

function renderIcon(size) {
  const scale = size / UNIT;
  const feather = 1 / scale; // un pixel écran exprimé en unités du motif
  const radius = 14; // coins arrondis, en unités
  const pixels = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // centre du pixel, ramené dans le repère du motif
      const x = (px + 0.5) / scale;
      const y = (py + 0.5) / scale;

      // Fond : carré à coins arrondis (distance signée d'un rounded rect).
      const qx = Math.abs(x - UNIT / 2) - (UNIT / 2 - radius);
      const qy = Math.abs(y - UNIT / 2) - (UNIT / 2 - radius);
      const outside =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
      const bgAlpha = coverage(outside, feather);

      let rgb = NAVY;

      // Fil à plomb, en pointillés de 4 unités pleines / 3 vides.
      if (y >= PLUMB.y0 && y <= PLUMB.y1 && (y - PLUMB.y0) % 7 < 4) {
        rgb = blend(rgb, SKY, 0.7 * coverage(Math.abs(x - PLUMB.x) - 1, feather));
      }

      // Lignes d'épaules et de bassin.
      for (const segment of SEGMENTS) {
        const d = distanceToSegment(x, y, segment.a, segment.b);
        rgb = blend(rgb, SNOW, coverage(d - 1.75, feather));
      }

      // Tête.
      rgb = blend(rgb, SNOW, coverage(Math.hypot(x - HEAD.x, y - HEAD.y) - HEAD.r, feather));

      // Points anatomiques, dessinés par-dessus les lignes.
      for (const marker of MARKERS) {
        rgb = blend(rgb, SKY, coverage(Math.hypot(x - marker.x, y - marker.y) - 3, feather));
      }

      const offset = (py * size + px) * 4;
      pixels[offset] = rgb[0];
      pixels[offset + 1] = rgb[1];
      pixels[offset + 2] = rgb[2];
      pixels[offset + 3] = Math.round(bgAlpha * 255);
    }
  }

  return encodePng(size, size, pixels);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function encodePng(width, height, rgba) {
  // Chaque ligne est préfixée par son type de filtre (0 = aucun).
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur 8 bits
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression deflate
  ihdr[11] = 0; // filtrage standard
  ihdr[12] = 0; // pas d'entrelacement

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size] of [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(OUT_DIR, name), renderIcon(size));
  console.log(`${name} (${size}×${size})`);
}
