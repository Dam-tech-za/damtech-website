import type { StaticImageData } from "next/image";

import bitumenWaterproofingRoof from "@/public/images/bitumen-waterproofing-roof-reservoir-repair.webp";
import corrugatedSteelWaterTank from "@/public/images/corrugated-steel-water-tank-installation.webp";
import damtechContractors from "@/public/images/damtech-dam-liner-contractors-south-africa.webp";
import damtechWaterStorageHero from "@/public/images/damtech-dam-liners-water-storage-solutions.webp";
import hdpeDamLinerEarthDam from "@/public/images/hdpe-dam-liner-earth-dam-south-africa.webp";
import hdpeDamLinerInstallationLimpopo from "@/public/images/hdpe-dam-liner-installation-limpopo.webp";

/** Stable public URLs for Open Graph, blog rewrites and JSON data. */
export const IMAGE_PATHS = {
  bitumenWaterproofingRoof:
    "/images/bitumen-waterproofing-roof-reservoir-repair.webp",
  corrugatedSteelReservoirRepair:
    "/images/corrugated-steel-reservoir-leak-repair-south-africa.webp",
  corrugatedSteelWaterTank:
    "/images/corrugated-steel-water-tank-installation.webp",
  damtechContractors: "/images/damtech-dam-liner-contractors-south-africa.webp",
  damtechWaterStorageHero:
    "/images/damtech-dam-liners-water-storage-solutions.webp",
  damtechLogo: "/images/damtech-logo.svg",
  hdpeDamLinerEarthDam: "/images/hdpe-dam-liner-earth-dam-south-africa.webp",
  hdpeDamLinerInstallationLimpopo:
    "/images/hdpe-dam-liner-installation-limpopo.webp",
  hdpeLinedFarmReservoirCattle:
    "/images/hdpe-lined-farm-reservoir-cattle-south-africa.webp",
} as const;

export type ImagePath = (typeof IMAGE_PATHS)[keyof typeof IMAGE_PATHS];

export const IMAGE_ALTS: Record<ImagePath, string> = {
  [IMAGE_PATHS.bitumenWaterproofingRoof]:
    "Bitumen waterproofing applied to a concrete roof and water reservoir in South Africa",
  [IMAGE_PATHS.corrugatedSteelReservoirRepair]:
    "Corrugated steel reservoir leak repair and maintenance on a South African farm",
  [IMAGE_PATHS.corrugatedSteelWaterTank]:
    "Corrugated galvanised steel water tank installation for farm water storage",
  [IMAGE_PATHS.damtechContractors]:
    "Damtech dam liner and waterproofing contractors serving South Africa",
  [IMAGE_PATHS.damtechWaterStorageHero]:
    "Damtech dam liners, steel water tanks and waterproofing solutions in South Africa",
  [IMAGE_PATHS.damtechLogo]: "Damtech logo — water droplet mark",
  [IMAGE_PATHS.hdpeDamLinerEarthDam]:
    "HDPE dam linings installed on an earth farm dam in South Africa",
  [IMAGE_PATHS.hdpeDamLinerInstallationLimpopo]:
    "HDPE dam linings installation on a farm reservoir in Limpopo, South Africa",
  [IMAGE_PATHS.hdpeLinedFarmReservoirCattle]:
    "Bonsmara cattle beside an HDPE-lined farm reservoir in South Africa",
};

export const DEFAULT_OG_IMAGE = IMAGE_PATHS.hdpeDamLinerInstallationLimpopo;
export const DEFAULT_OG_IMAGE_ALT =
  IMAGE_ALTS[IMAGE_PATHS.hdpeDamLinerInstallationLimpopo];

export type SiteImage = {
  image: StaticImageData;
  alt: string;
  path: ImagePath;
  caption?: string;
};

function siteImage(
  image: StaticImageData,
  path: ImagePath,
  alt: string,
  caption?: string,
): SiteImage {
  return { image, path, alt, caption };
}

/** Central registry for static page images (SEO filenames + alt text). */
export const SITE_IMAGES = {
  homeHero: siteImage(
    damtechWaterStorageHero,
    IMAGE_PATHS.damtechWaterStorageHero,
    IMAGE_ALTS[IMAGE_PATHS.damtechWaterStorageHero],
  ),
  homeDamLiner: siteImage(
    hdpeDamLinerInstallationLimpopo,
    IMAGE_PATHS.hdpeDamLinerInstallationLimpopo,
    IMAGE_ALTS[IMAGE_PATHS.hdpeDamLinerInstallationLimpopo],
    "Earth dam liners, steel tanks and waterproofing — installed nationwide.",
  ),
  damLiners: siteImage(
    hdpeDamLinerInstallationLimpopo,
    IMAGE_PATHS.hdpeDamLinerInstallationLimpopo,
    "HDPE dam linings installed on a farm earth dam in South Africa",
    "HDPE, PVC and Bitumen Torch-On dam lining options.",
  ),
  contact: siteImage(
    hdpeDamLinerEarthDam,
    IMAGE_PATHS.hdpeDamLinerEarthDam,
    "Farm dam with HDPE liner installed by Damtech in South Africa",
    "Dam liners, steel tanks and waterproofing — quoted nationwide.",
  ),
  about: siteImage(
    damtechContractors,
    IMAGE_PATHS.damtechContractors,
    IMAGE_ALTS[IMAGE_PATHS.damtechContractors],
    "Trusted experts with 30+ years in the industry.",
  ),
  bitumen: siteImage(
    bitumenWaterproofingRoof,
    IMAGE_PATHS.bitumenWaterproofingRoof,
    IMAGE_ALTS[IMAGE_PATHS.bitumenWaterproofingRoof],
    "Torch-on, self-adhesive and liquid bitumen coatings.",
  ),
  steelTank: siteImage(
    corrugatedSteelWaterTank,
    IMAGE_PATHS.corrugatedSteelWaterTank,
    IMAGE_ALTS[IMAGE_PATHS.corrugatedSteelWaterTank],
    "Steel reservoirs from 11 kL to 500 kL+.",
  ),
} as const satisfies Record<string, SiteImage>;

/** Blog image URL rewrites (WordPress → local WebP). */
export const BLOG_IMAGE_REWRITES: Record<string, { src: ImagePath; alt: string }> =
  {
    "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002.jpg":
      {
        src: IMAGE_PATHS.hdpeDamLinerInstallationLimpopo,
        alt: IMAGE_ALTS[IMAGE_PATHS.hdpeDamLinerInstallationLimpopo],
      },
    "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002-1024x576.jpg":
      {
        src: IMAGE_PATHS.hdpeDamLinerInstallationLimpopo,
        alt: IMAGE_ALTS[IMAGE_PATHS.hdpeDamLinerInstallationLimpopo],
      },
    "https://dam-tech.co.za/wp-content/uploads/2025/11/Bonsmara-Cattle-next-to-HDPE-Lined-Dam.png":
      {
        src: IMAGE_PATHS.hdpeLinedFarmReservoirCattle,
        alt: IMAGE_ALTS[IMAGE_PATHS.hdpeLinedFarmReservoirCattle],
      },
    "https://dam-tech.co.za/wp-content/uploads/2025/11/Corrugated-Steel-Reservoir-Maintenance.png":
      {
        src: IMAGE_PATHS.corrugatedSteelReservoirRepair,
        alt: IMAGE_ALTS[IMAGE_PATHS.corrugatedSteelReservoirRepair],
      },
  };

export function altForImagePath(path: string): string {
  return IMAGE_ALTS[path as ImagePath] ?? "";
}
