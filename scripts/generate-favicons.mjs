/**
 * Regenerates Damtech favicon / PWA icon PNGs and .ico with transparent backgrounds.
 * Apple touch icon keeps brand navy (iOS paints transparent icons black).
 *
 * Usage: node scripts/generate-favicons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const markSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 170 170" fill="none">
  <path
    fill="#C4CBD4"
    d="M46 20 C29 34 27 52 29 68 C32 78 46 82 46 82 C46 82 60 78 63 68 C65 52 63 34 46 20 Z"
  />
  <path
    fill="#C4CBD4"
    d="M122 14 C98 32 94 58 96 80 C99 96 122 102 122 102 C122 102 145 96 148 80 C150 58 146 32 122 14 Z"
  />
  <path
    fill="#026BC6"
    stroke="#FFFFFF"
    stroke-width="7"
    stroke-linejoin="round"
    paint-order="stroke fill"
    d="M85 20 C62 38 55 65 57 88 C60 104 85 112 85 112 C85 112 110 104 113 88 C115 65 108 38 85 20 Z"
  />
</svg>`;

const appleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 170 170" fill="none">
  <rect width="170" height="170" fill="#031926"/>
  <path
    fill="#C4CBD4"
    d="M46 20 C29 34 27 52 29 68 C32 78 46 82 46 82 C46 82 60 78 63 68 C65 52 63 34 46 20 Z"
  />
  <path
    fill="#C4CBD4"
    d="M122 14 C98 32 94 58 96 80 C99 96 122 102 122 102 C122 102 145 96 148 80 C150 58 146 32 122 14 Z"
  />
  <path
    fill="#026BC6"
    stroke="#FFFFFF"
    stroke-width="7"
    stroke-linejoin="round"
    paint-order="stroke fill"
    d="M85 20 C62 38 55 65 57 88 C60 104 85 112 85 112 C85 112 110 104 113 88 C115 65 108 38 85 20 Z"
  />
</svg>`;

/** Pack PNG buffers into a multi-size .ico (PNG-compressed images). */
function pngsToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (const png of pngBuffers) {
    const size = png.readUInt32BE(16); // IHDR width
    const entrySize = size >= 256 ? 0 : size;
    entries.push({ png, width: entrySize, height: entrySize, offset });
    offset += png.length;
  }

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);

  for (let i = 0; i < count; i += 1) {
    const e = entries[i];
    const base = 6 + i * 16;
    out.writeUInt8(e.width, base);
    out.writeUInt8(e.height, base + 1);
    out.writeUInt8(0, base + 2);
    out.writeUInt8(0, base + 3);
    out.writeUInt16LE(1, base + 4);
    out.writeUInt16LE(32, base + 6);
    out.writeUInt32LE(e.png.length, base + 8);
    out.writeUInt32LE(e.offset, base + 12);
    e.png.copy(out, e.offset);
  }

  return out;
}

async function writePng(svg, size, outPath) {
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return buf;
}

const sizes = [16, 32, 48, 180, 192, 512];
const iconsDir = path.join(root, "public", "icons");

const pngBySize = {};
for (const size of sizes) {
  const out = path.join(iconsDir, `icon-${size}.png`);
  pngBySize[size] = await writePng(markSvg, size, out);
  console.log("wrote", path.relative(root, out));
}

const appleOut = path.join(root, "public", "apple-touch-icon.png");
await writePng(appleSvg, 180, appleOut);
console.log("wrote", path.relative(root, appleOut));

const icoBuf = pngsToIco([pngBySize[16], pngBySize[32], pngBySize[48]]);
const publicIco = path.join(root, "public", "favicon.ico");
const appIco = path.join(root, "app", "favicon.ico");
fs.writeFileSync(publicIco, icoBuf);
fs.writeFileSync(appIco, icoBuf);
console.log("wrote", path.relative(root, publicIco));
console.log("wrote", path.relative(root, appIco));
