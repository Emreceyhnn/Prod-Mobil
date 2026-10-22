const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tag, data) {
  const tagBuf = Buffer.from(tag, "ascii");
  const full = Buffer.concat([tagBuf, data]);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(full), 0);
  return Buffer.concat([lenBuf, full, crcBuf]);
}

function makePng(filePath, width, height, r, g, b) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowBytes = width * 3;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (rowBytes + 1);
    raw[offset] = 0; // filter type none
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });

  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
  console.log("wrote", filePath);
}

const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

makePng(path.join(assetsDir, "icon.png"), 1024, 1024, 9, 13, 22);
makePng(path.join(assetsDir, "adaptive-icon.png"), 1024, 1024, 9, 13, 22);
makePng(path.join(assetsDir, "splash.png"), 1242, 2436, 9, 13, 22);
makePng(path.join(assetsDir, "notification-icon.png"), 96, 96, 139, 92, 246);
