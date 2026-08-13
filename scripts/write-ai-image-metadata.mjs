/**
 * Write IPTC DigitalSourceType into catalogue WebP files.
 * Google reads this from the original static asset, not from /_next/image.
 *
 * Value: compositeWithTrainedAlgorithmicMedia (AI composite / edited visual).
 */
import fs from "node:fs";
import path from "node:path";

const DIGITAL_SOURCE_TYPE =
  "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia";

const XMP = Buffer.from(
  `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>\n` +
    `<x:xmpmeta xmlns:x="adobe:ns:meta/">\n` +
    `  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n` +
    `    <rdf:Description rdf:about=""\n` +
    `      xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"\n` +
    `      Iptc4xmpExt:DigitalSourceType="${DIGITAL_SOURCE_TYPE}"/>\n` +
    `  </rdf:RDF>\n` +
    `</x:xmpmeta>\n` +
    `<?xpacket end="w"?>`,
  "utf8",
);

const FILES = [
  "corrugated-steel-water-reservoir-south-africa-nobg.webp",
  "corrugated-steel-water-reservoir-south-africa.webp",
  "galvanised-livestock-water-trough-south-africa-nobg.webp",
  "galvanised-livestock-water-trough-south-africa.webp",
  "10000l-galvanised-steel-water-tank-south-africa-nobg.webp",
  "10000l-galvanised-steel-water-tank-south-africa.webp",
];

const VP8X_FLAG_XMP = 0x04;

function readChunk(buf, offset) {
  const fourcc = buf.toString("ascii", offset, offset + 4);
  const size = buf.readUInt32LE(offset + 4);
  const dataStart = offset + 8;
  const padded = size + (size % 2);
  return { fourcc, size, dataStart, end: dataStart + padded };
}

function stripExistingXmp(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("Not a WebP RIFF file");
  }
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunk = readChunk(buf, offset);
    if (chunk.fourcc !== "XMP ") {
      chunks.push(buf.subarray(offset, Math.min(chunk.end, buf.length)));
    }
    offset = chunk.end;
  }
  return chunks;
}

function setVp8xXmpFlag(chunk) {
  const copy = Buffer.from(chunk);
  if (copy.toString("ascii", 0, 4) !== "VP8X" || copy.length < 9) return copy;
  copy[8] = copy[8] | VP8X_FLAG_XMP;
  return copy;
}

function buildXmpChunk(payload) {
  const size = payload.length;
  const padded = size + (size % 2);
  const chunk = Buffer.alloc(8 + padded);
  chunk.write("XMP ", 0, 4, "ascii");
  chunk.writeUInt32LE(size, 4);
  payload.copy(chunk, 8);
  return chunk;
}

function assembleWebp(chunks) {
  const payload = Buffer.concat(chunks);
  const out = Buffer.alloc(12 + payload.length);
  out.write("RIFF", 0, 4, "ascii");
  out.writeUInt32LE(out.length - 8, 4);
  out.write("WEBP", 8, 4, "ascii");
  payload.copy(out, 12);
  return out;
}

function hasDigitalSourceType(buf) {
  return buf.includes(Buffer.from(DIGITAL_SOURCE_TYPE, "utf8"));
}

const dir = path.join(process.cwd(), "public", "images");
for (const name of FILES) {
  const file = path.join(dir, name);
  const original = fs.readFileSync(file);
  if (hasDigitalSourceType(original)) {
    console.log(`already tagged: ${name}`);
    continue;
  }
  const chunks = stripExistingXmp(original).map(setVp8xXmpFlag);
  chunks.push(buildXmpChunk(XMP));
  const next = assembleWebp(chunks);
  fs.writeFileSync(file, next);
  console.log(`wrote DigitalSourceType: ${name} (${original.length} → ${next.length} bytes)`);
}
