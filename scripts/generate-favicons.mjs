/**
 * Derives Damtech favicon variants from the supplied white-square PNGs.
 * Source of truth (do not overwrite): public/favicon-32.png, favicon-192.png, favicon-512.png
 *
 * Usage: node scripts/generate-favicons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");
const iconsDir = path.join(pub, "icons");

const src32 = path.join(pub, "favicon-32.png");
const src192 = path.join(pub, "favicon-192.png");
const src512 = path.join(pub, "favicon-512.png");

for (const file of [src32, src192, src512]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing source favicon: ${path.relative(root, file)}`);
  }
}

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

async function resizeFrom(src, size) {
  return sharp(src)
    .resize(size, size, { fit: "fill" })
    .png()
    .toBuffer();
}

function write(outPath, buf) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log("wrote", path.relative(root, outPath));
}

const png32 = fs.readFileSync(src32);
const png192 = fs.readFileSync(src192);
const png512 = fs.readFileSync(src512);

const png16 = await resizeFrom(src32, 16);
const png48 = await resizeFrom(src512, 48);
const png180 = await resizeFrom(src512, 180);

fs.mkdirSync(iconsDir, { recursive: true });
write(path.join(iconsDir, "icon-16.png"), png16);
write(path.join(iconsDir, "icon-32.png"), png32);
write(path.join(iconsDir, "icon-48.png"), png48);
write(path.join(iconsDir, "icon-180.png"), png180);
write(path.join(iconsDir, "icon-192.png"), png192);
write(path.join(iconsDir, "icon-512.png"), png512);

write(path.join(pub, "favicon-32x32.png"), png32);
write(path.join(pub, "favicon-48x48.png"), png48);
write(path.join(pub, "apple-touch-icon.png"), png180);
write(path.join(pub, "favicon.ico"), pngsToIco([png16, png32, png48]));

const leftoverSvg = path.join(pub, "favicon.svg");
if (fs.existsSync(leftoverSvg)) {
  fs.unlinkSync(leftoverSvg);
  console.log("removed", path.relative(root, leftoverSvg));
}
