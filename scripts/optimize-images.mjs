import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const imagesDir = path.join(root, "public", "images");
const blogDir = path.join(imagesDir, "blog");

const CONTENT_QUALITY = 82;
const HERO_QUALITY = 85;
const CONTENT_MAX_KB = 150;
const HERO_MAX_KB = 300;

const LOCAL_ASSETS = [
  {
    source: "dam-liner-hero.svg",
    output: "hdpe-dam-liner-earth-dam-south-africa.webp",
    width: 1200,
    hero: false,
  },
  {
    source: "about-company.svg",
    output: "damtech-dam-liner-contractors-south-africa.webp",
    width: 1200,
    hero: false,
  },
  {
    source: "bitumen-waterproofing.svg",
    output: "bitumen-waterproofing-roof-reservoir-repair.webp",
    width: 1200,
    hero: false,
  },
  {
    source: "steel-tank.svg",
    output: "corrugated-steel-water-tank-installation.webp",
    width: 1200,
    hero: false,
  },
  {
    source: "hero.webp",
    output: "damtech-dam-liners-water-storage-solutions.webp",
    width: 1600,
    hero: true,
    skipRasterize: true,
  },
];

const BLOG_DOWNLOADS = [
  {
    url: "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002.jpg",
    output: "hdpe-dam-liner-installation-farm-dam.webp",
    width: 1024,
  },
  {
    url: "https://dam-tech.co.za/wp-content/uploads/2025/11/Bonsmara-Cattle-next-to-HDPE-Lined-Dam.png",
    output: "bonsmara-cattle-beside-hdpe-lined-farm-dam.webp",
    width: 1344,
  },
  {
    url: "https://dam-tech.co.za/wp-content/uploads/2025/11/Corrugated-Steel-Reservoir-Maintenance.png",
    output: "corrugated-steel-reservoir-leak-repair-maintenance.webp",
    width: 1344,
  },
];

async function optimizeToWebp(input, outputPath, { width, hero }) {
  const maxKb = hero ? HERO_MAX_KB : CONTENT_MAX_KB;
  let quality = hero ? HERO_QUALITY : CONTENT_QUALITY;

  for (let attempt = 0; attempt < 6; attempt++) {
    const buffer = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();

    if (buffer.length <= maxKb * 1024 || quality <= 55) {
      await fs.writeFile(outputPath, buffer);
      return { bytes: buffer.length, quality };
    }
    quality -= 8;
  }

  throw new Error(`Could not compress ${outputPath} below ${maxKb} KB`);
}

async function convertLocalAssets() {
  for (const asset of LOCAL_ASSETS) {
    const inputPath = path.join(imagesDir, asset.source);
    const outputPath = path.join(imagesDir, asset.output);

    if (asset.skipRasterize) {
      const result = await optimizeToWebp(inputPath, outputPath, asset);
      console.log(`Optimized ${asset.source} -> ${asset.output} (${Math.round(result.bytes / 1024)} KB, q${result.quality})`);
      continue;
    }

    const result = await optimizeToWebp(inputPath, outputPath, asset);
    console.log(`Converted ${asset.source} -> ${asset.output} (${Math.round(result.bytes / 1024)} KB, q${result.quality})`);
  }
}

async function downloadBlogImages() {
  await fs.mkdir(blogDir, { recursive: true });

  for (const item of BLOG_DOWNLOADS) {
    const outputPath = path.join(blogDir, item.output);
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${item.url}: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const result = await optimizeToWebp(Buffer.from(arrayBuffer), outputPath, {
      width: item.width,
      hero: false,
    });
    console.log(`Downloaded ${item.url} -> blog/${item.output} (${Math.round(result.bytes / 1024)} KB, q${result.quality})`);
  }
}

async function removeOldFiles() {
  const remove = [
    ...LOCAL_ASSETS.map((a) => a.source).filter((s) => s !== "hero.webp"),
    "hero.webp",
    path.join(root, "public", "file.svg"),
    path.join(root, "public", "globe.svg"),
    path.join(root, "public", "next.svg"),
    path.join(root, "public", "vercel.svg"),
    path.join(root, "public", "window.svg"),
  ];

  for (const file of remove) {
    const filePath = file.includes("/") ? file : path.join(imagesDir, file);
    try {
      await fs.unlink(filePath);
      console.log(`Removed ${path.relative(root, filePath)}`);
    } catch {
      // already removed
    }
  }
}

await convertLocalAssets();
await downloadBlogImages();
await removeOldFiles();
console.log("Image optimization complete.");
