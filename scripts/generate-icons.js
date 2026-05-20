// Generate simple geometric tab bar icons as 81x81 PNGs
// Usage: node scripts/generate-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 81;
const OUT_DIR = path.join(__dirname, '..', 'miniprogram', 'assets', 'tabbar');

function createPNG(pixels) {
  // Build raw image data with filter byte (0=None) per row
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 4)); // filter byte + RGBA per pixel per row
  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    raw[rowOff] = 0; // filter: None
    for (let x = 0; x < SIZE; x++) {
      const px = pixels[y * SIZE + x];
      const off = rowOff + 1 + x * 4;
      raw[off] = (px >> 24) & 0xff;     // R
      raw[off + 1] = (px >> 16) & 0xff; // G
      raw[off + 2] = (px >> 8) & 0xff;  // B
      raw[off + 3] = px & 0xff;         // A
    }
  }
  const compressed = zlib.deflateSync(raw);

  // Build PNG
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);  // width
  ihdr.writeUInt32BE(SIZE, 4);   // height
  ihdr[8] = 8;                   // bit depth
  ihdr[9] = 6;                   // color type: RGBA
  ihdr[10] = 0;                  // compression
  ihdr[11] = 0;                  // filter
  ihdr[12] = 0;                  // interlace

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = crc32(crcData);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// CRC32 for PNG
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function rgba(r, g, b, a = 255) { return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0; }
const TRANSPARENT = rgba(0, 0, 0, 0);
const C = 40; // center
const R = 30; // radius-ish

function circle(px, cx, cy, r, color) {
  for (let y = Math.max(0, cy - r); y <= Math.min(SIZE - 1, cy + r); y++) {
    for (let x = Math.max(0, cx - r); x <= Math.min(SIZE - 1, cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) px[y * SIZE + x] = color;
    }
  }
}

function rect(px, x1, y1, x2, y2, color) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      px[y * SIZE + x] = color;
}

function line(px, x1, y1, x2, y2, color, w = 5) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  for (let t = 0; t <= 1; t += 1 / (len * 2)) {
    const cx = Math.round(x1 + dx * t), cy = Math.round(y1 + dy * t);
    for (let wy = -Math.floor(w / 2); wy <= Math.floor(w / 2); wy++)
      for (let wx = -Math.floor(w / 2); wx <= Math.floor(w / 2); wx++)
        if (wx * wx + wy * wy <= (w / 2) ** 2 && cx + wx >= 0 && cx + wx < SIZE && cy + wy >= 0 && cy + wy < SIZE)
          px[(cy + wy) * SIZE + (cx + wx)] = color;
  }
}

function newPixels() { return new Uint32Array(SIZE * SIZE).fill(TRANSPARENT); }

// ---- HOME icon (house shape) ----
function drawHome(color) {
  const px = newPixels();
  // Roof triangle
  for (let y = 5; y <= 35; y++) {
    const w = ((35 - y) / 30) * 56;
    for (let x = Math.round(C - w / 2); x <= Math.round(C + w / 2); x++)
      px[y * SIZE + x] = color;
  }
  // Body
  rect(px, 16, 35, 64, 68, color);
  // Door
  rect(px, 32, 48, 48, 68, TRANSPARENT);
  return px;
}

// ---- TRAIN icon (dumbbell) ----
function drawTrain(color) {
  const px = newPixels();
  // Bar
  rect(px, 20, 37, 60, 43, color);
  // Left weight
  rect(px, 10, 25, 25, 55, color);
  // Right weight
  rect(px, 55, 25, 70, 55, color);
  return px;
}

// ---- DATA icon (bar chart) ----
function drawData(color) {
  const px = newPixels();
  rect(px, 10, 55, 26, 68, color);   // bar 1
  rect(px, 30, 35, 46, 68, color);   // bar 2
  rect(px, 50, 45, 66, 68, color);   // bar 3
  rect(px, 8, 68, 72, 73, color);    // baseline
  return px;
}

// ---- MINE icon (person) ----
function drawMine(color) {
  const px = newPixels();
  circle(px, C, 26, 16, color);      // head
  rect(px, 25, 45, 55, 70, color);   // body
  circle(px, C, 70, 10, TRANSPARENT); // cut bottom rounded
  return px;
}

// Generate normal + active versions
const icons = {
  home: drawHome,
  train: drawTrain,
  data: drawData,
  mine: drawMine,
};

const ACTIVE = rgba(0x1A, 0x56, 0xDB);
const INACTIVE = rgba(0x8E, 0x8E, 0x93);

for (const [name, drawFn] of Object.entries(icons)) {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), createPNG(drawFn(INACTIVE)));
  fs.writeFileSync(path.join(OUT_DIR, `${name}-active.png`), createPNG(drawFn(ACTIVE)));
  console.log(`Generated ${name}.png, ${name}-active.png`);
}

console.log('Done! 8 tab bar icons generated.');
