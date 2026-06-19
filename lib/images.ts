export type SiteImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export const DEFAULT_OG_IMAGE =
  "/images/damtech-dam-liners-water-storage-solutions.webp";

/** Central registry for static page images (SEO filenames + alt text). */
export const SITE_IMAGES = {
  homeDamLiner: {
    src: "/images/hdpe-dam-liner-farm-water-storage.webp",
    alt: "HDPE dam liner installation for agricultural water storage dam",
    width: 1200,
    height: 750,
    caption: "Earth dam liners, steel tanks and waterproofing — installed nationwide.",
  },
  damLiners: {
    src: "/images/hdpe-dam-liner-farm-water-storage.webp",
    alt: "HDPE and PVC dam liners installed on a farm earth dam",
    width: 1200,
    height: 750,
    caption: "HDPE, PVC and Bitumen Torch-On dam lining options.",
  },
  contact: {
    src: "/images/hdpe-dam-liner-farm-water-storage.webp",
    alt: "Farm dam with HDPE liner installed by Damtech",
    width: 1200,
    height: 750,
    caption: "Dam liners, steel tanks and waterproofing — quoted nationwide.",
  },
  about: {
    src: "/images/damtech-waterproofing-dam-liner-specialists.webp",
    alt: "Damtech dam lining and water storage installation team",
    width: 1200,
    height: 750,
    caption: "Trusted experts with 30+ years in the industry.",
  },
  bitumen: {
    src: "/images/bitumen-waterproofing-roof-reservoir-repair.webp",
    alt: "Bitumen waterproofing application on concrete water-retaining structure",
    width: 1200,
    height: 750,
    caption: "Torch-on, self-adhesive and liquid bitumen coatings.",
  },
  steelTank: {
    src: "/images/corrugated-steel-water-tank-installation.webp",
    alt: "Corrugated steel water tank installed for farm water storage",
    width: 1200,
    height: 750,
    caption: "Steel reservoirs from 11 kL to 500 kL+.",
  },
  homeHero: {
    src: "/images/damtech-dam-liners-water-storage-solutions.webp",
    alt: "",
    width: 1600,
    height: 900,
  },
} as const satisfies Record<string, SiteImage>;

/** Blog image URL rewrites (WordPress → local WebP). */
export const BLOG_IMAGE_REWRITES: Record<string, { src: string; alt: string }> = {
  "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002.jpg": {
    src: "/images/blog/hdpe-dam-liner-installation-farm-dam.webp",
    alt: "HDPE dam liner installation for agricultural water storage in South Africa",
  },
  "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002-1024x576.jpg": {
    src: "/images/blog/hdpe-dam-liner-installation-farm-dam.webp",
    alt: "HDPE dam liner installation for agricultural water storage in South Africa",
  },
  "https://dam-tech.co.za/wp-content/uploads/2025/11/Bonsmara-Cattle-next-to-HDPE-Lined-Dam.png": {
    src: "/images/blog/bonsmara-cattle-beside-hdpe-lined-farm-dam.webp",
    alt: "Cattle beside an HDPE-lined farm dam used for livestock water storage",
  },
  "https://dam-tech.co.za/wp-content/uploads/2025/11/Corrugated-Steel-Reservoir-Maintenance.png": {
    src: "/images/blog/corrugated-steel-reservoir-leak-repair-maintenance.webp",
    alt: "Corrugated steel reservoir undergoing professional leak repair",
  },
};
