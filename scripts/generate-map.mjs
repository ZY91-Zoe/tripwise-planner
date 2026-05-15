import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const width = 1200;
const height = 720;
const output = resolve("assets/route-map.png");

function rgba(r, g, b, a = 255) {
  return [r, g, b, a];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const pixels = Buffer.alloc(width * height * 4);

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const nx = x / width;
    const ny = y / height;
    const coast = Math.sin(nx * 8 + ny * 3) * 0.025 + Math.cos(ny * 9) * 0.016;
    const waterBlend = nx + ny * 0.45 + coast;
    const isWater = waterBlend > 0.84 || (nx > 0.62 && ny > 0.54 + coast);
    const base = isWater
      ? rgba(45, Math.round(130 + ny * 40), Math.round(160 + nx * 42))
      : rgba(Math.round(220 - ny * 18), Math.round(232 - nx * 16), Math.round(205 + ny * 20));
    const noise = Math.sin(x * 0.037) * 5 + Math.cos(y * 0.041) * 5;
    const index = (y * width + x) * 4;
    pixels[index] = Math.max(0, Math.min(255, base[0] + noise));
    pixels[index + 1] = Math.max(0, Math.min(255, base[1] + noise));
    pixels[index + 2] = Math.max(0, Math.min(255, base[2] + noise));
    pixels[index + 3] = 255;
  }
}

function drawCircle(cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y += 1) {
    for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = dx * dx + dy * dy;
      if (dist > r2) continue;
      const alpha = Math.max(0, 1 - dist / r2);
      blendPixel(x, y, color, alpha);
    }
  }
}

function drawLine(x1, y1, x2, y2, thickness, color) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(lerp(x1, x2, t));
    const y = Math.round(lerp(y1, y2, t) + Math.sin(t * Math.PI) * -34);
    drawCircle(x, y, thickness, color);
  }
}

function drawRect(x, y, w, h, color, alpha = 1) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
      blendPixel(xx, yy, color, alpha);
    }
  }
}

function blendPixel(x, y, color, alpha = 1) {
  const index = (Math.round(y) * width + Math.round(x)) * 4;
  const sourceAlpha = (color[3] / 255) * alpha;
  pixels[index] = Math.round(lerp(pixels[index], color[0], sourceAlpha));
  pixels[index + 1] = Math.round(lerp(pixels[index + 1], color[1], sourceAlpha));
  pixels[index + 2] = Math.round(lerp(pixels[index + 2], color[2], sourceAlpha));
  pixels[index + 3] = 255;
}

const route = [
  [230, 190],
  [690, 350],
  [545, 520],
  [820, 510],
  [900, 455],
  [230, 190]
];

for (let i = 0; i < route.length - 1; i += 1) {
  drawLine(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1], 4, rgba(240, 111, 95, 210));
}

[
  [230, 190, 18],
  [690, 350, 20],
  [545, 520, 17],
  [820, 510, 17],
  [900, 455, 19]
].forEach(([x, y, r]) => {
  drawCircle(x, y, r + 9, rgba(255, 255, 255, 210));
  drawCircle(x, y, r, rgba(37, 59, 89, 245));
  drawCircle(x - 4, y - 5, Math.max(3, r / 3), rgba(229, 168, 63, 240));
});

for (let i = 0; i < 16; i += 1) {
  const x = 80 + i * 72;
  drawRect(x, 610 + Math.round(Math.sin(i) * 8), 42, 3, rgba(255, 255, 255, 150), 0.65);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) {
  const rowStart = y * (width * 4 + 1);
  raw[rowStart] = 0;
  pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header[8] = 8;
header[9] = 6;
header[10] = 0;
header[11] = 0;
header[12] = 0;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk("IHDR", header),
  pngChunk("IDAT", deflateSync(raw)),
  pngChunk("IEND", Buffer.alloc(0))
]));

console.log(`Generated ${output}`);
