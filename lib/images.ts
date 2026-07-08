import type { StaticImageData } from "next/image";

import bitumenEarthDamWaterproofing from "@/public/images/bitumen-earth-dam-waterproofing.webp";
import bitumenEarthDamWaterproofing2 from "@/public/images/bitumen-earth-dam-waterproofing-2.webp";
import bitumenTorchOnWaterproofingDamtech from "@/public/images/bitumen-torch-on-waterproofing-damtech.webp";
import bitumenWaterproofingBefore from "@/public/images/bitumen-waterproofing-before.webp";
import bitumenWaterproofingRoof from "@/public/images/bitumen-waterproofing-roof-reservoir-repair.webp";
import corrugatedSteelWaterTankDamtech from "@/public/images/corrugated-steel-water-tank-damtech.jpg";
import corrugatedSteelWaterTankSite2 from "@/public/images/corrugated-steel-water-tank-site-2.jpg";
import corrugatedSteelWaterTank from "@/public/images/corrugated-steel-water-tank-installation.webp";
import damtechContractors from "@/public/images/damtech-dam-liner-contractors-south-africa.webp";
import damtechWaterStorageHero from "@/public/images/damtech-dam-liners-water-storage-solutions.webp";
import grabouwHdpeDamLiningAfter from "@/public/images/grabouw-hdpe-dam-lining-after.webp";
import hartswaterHdpeDamLiningProject from "@/public/images/hartswater-hdpe-dam-lining-project.webp";
import hdpeDamLiningAfterGeotextile from "@/public/images/hdpe-dam-lining-after-geotextile.webp";
import hdpeDamLiningBeforeInstallation from "@/public/images/hdpe-dam-lining-before-installation.webp";
import hdpeDamLiningEarthDam from "@/public/images/hdpe-dam-lining-earth-dam.webp";
import hdpeDamLiningFieldInstallation from "@/public/images/hdpe-dam-lining-field-installation.webp";
import hdpeDamLinerEarthDamLegacy from "@/public/images/hdpe-dam-liner-earth-dam-south-africa.webp";
import hdpeLinedFarmReservoirCattle from "@/public/images/hdpe-lined-farm-reservoir-cattle-south-africa.webp";
import westernCapeDamLiningHero from "@/public/images/western-cape-dam-lining-reservoir-damtech.webp";

/** Stable public URLs for Open Graph, blog rewrites and JSON data. */
export const IMAGE_PATHS = {
  bitumenEarthDamWaterproofing: "/images/bitumen-earth-dam-waterproofing.webp",
  bitumenEarthDamWaterproofing2: "/images/bitumen-earth-dam-waterproofing-2.webp",
  bitumenTorchOnWaterproofingDamtech:
    "/images/bitumen-torch-on-waterproofing-damtech.webp",
  bitumenWaterproofingBefore: "/images/bitumen-waterproofing-before.webp",
  bitumenWaterproofingRoof:
    "/images/bitumen-waterproofing-roof-reservoir-repair.webp",
  corrugatedSteelReservoirRepair:
    "/images/corrugated-steel-reservoir-leak-repair-south-africa.webp",
  corrugatedSteelWaterTank: "/images/corrugated-steel-water-tank-damtech.jpg",
  corrugatedSteelWaterTankInstallation:
    "/images/corrugated-steel-water-tank-installation.webp",
  corrugatedSteelWaterTankSite2: "/images/corrugated-steel-water-tank-site-2.jpg",
  damtechContractors: "/images/damtech-dam-liner-contractors-south-africa.webp",
  damtechWaterStorageHero:
    "/images/damtech-dam-liners-water-storage-solutions.webp",
  damtechLogo: "/images/damtech-logo.svg",
  grabouwHdpeDamLiningAfter: "/images/grabouw-hdpe-dam-lining-after.webp",
  grabouwHdpeDamLiningBefore: "/images/grabouw-hdpe-dam-lining-before.jpg",
  hartswaterHdpeDamLiningProject:
    "/images/hartswater-hdpe-dam-lining-project.webp",
  hdpeDamLiningAfterGeotextile: "/images/hdpe-dam-lining-after-geotextile.webp",
  hdpeDamLiningBeforeInstallation:
    "/images/hdpe-dam-lining-before-installation.webp",
  hdpeDamLiningEarthDam: "/images/hdpe-dam-lining-earth-dam.webp",
  hdpeDamLiningFieldInstallation:
    "/images/hdpe-dam-lining-field-installation.webp",
  /** @deprecated Legacy path — prefer hdpeDamLiningEarthDam */
  hdpeDamLinerEarthDam: "/images/hdpe-dam-liner-earth-dam-south-africa.webp",
  hdpeLinedFarmReservoirCattle:
    "/images/hdpe-lined-farm-reservoir-cattle-south-africa.webp",
  westernCapeDamLiningHero:
    "/images/western-cape-dam-lining-reservoir-damtech.webp",
} as const;

export type ImagePath = (typeof IMAGE_PATHS)[keyof typeof IMAGE_PATHS];

export const IMAGE_ALTS: Record<ImagePath, string> = {
  [IMAGE_PATHS.bitumenEarthDamWaterproofing]:
    "Bitumen torch-on waterproofing on an earth dam surface by Damtech",
  [IMAGE_PATHS.bitumenEarthDamWaterproofing2]:
    "Bitumen torch-on waterproofing applied to a water-retaining earth dam",
  [IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech]:
    "Bitumen torch-on waterproofing system for leak prevention and long-term protection",
  [IMAGE_PATHS.bitumenWaterproofingBefore]:
    "Before view of failed waterproofing surface before bitumen torch-on repair",
  [IMAGE_PATHS.bitumenWaterproofingRoof]:
    "Bitumen waterproofing applied to a concrete roof and water reservoir in South Africa",
  [IMAGE_PATHS.corrugatedSteelReservoirRepair]:
    "Corrugated steel reservoir leak repair and maintenance on a South African farm",
  [IMAGE_PATHS.corrugatedSteelWaterTank]:
    "Corrugated steel water tank for farm, mine and commercial water storage",
  [IMAGE_PATHS.corrugatedSteelWaterTankInstallation]:
    "Corrugated galvanised steel water tank installation for farm water storage",
  [IMAGE_PATHS.corrugatedSteelWaterTankSite2]:
    "Corrugated steel water tank installation on a prepared site in South Africa",
  [IMAGE_PATHS.damtechContractors]:
    "Damtech dam lining and waterproofing contractors serving South Africa",
  [IMAGE_PATHS.damtechWaterStorageHero]:
    "Damtech dam linings, steel water tanks and waterproofing solutions in South Africa",
  [IMAGE_PATHS.damtechLogo]: "Damtech logo — water droplet mark",
  [IMAGE_PATHS.grabouwHdpeDamLiningAfter]:
    "Large HDPE dam lining installation for water storage in Grabouw",
  [IMAGE_PATHS.grabouwHdpeDamLiningBefore]:
    "Farm dam in Grabouw before HDPE dam lining installation",
  [IMAGE_PATHS.hartswaterHdpeDamLiningProject]:
    "HDPE dam lining project completed by Damtech in Hartswater, South Africa",
  [IMAGE_PATHS.hdpeDamLiningAfterGeotextile]:
    "HDPE dam lining after installation with geotextile protection on site",
  [IMAGE_PATHS.hdpeDamLiningBeforeInstallation]:
    "Earth dam basin prepared before HDPE dam lining installation",
  [IMAGE_PATHS.hdpeDamLiningEarthDam]:
    "HDPE and PVC dam linings for earth dams and water storage applications",
  [IMAGE_PATHS.hdpeDamLiningFieldInstallation]:
    "HDPE dam lining field installation for long-term water storage and leak prevention",
  [IMAGE_PATHS.hdpeDamLinerEarthDam]:
    "HDPE dam linings installed on an earth farm dam in South Africa",
  [IMAGE_PATHS.hdpeLinedFarmReservoirCattle]:
    "Bonsmara cattle beside an HDPE-lined farm reservoir in South Africa",
  [IMAGE_PATHS.westernCapeDamLiningHero]:
    "Dam lining reservoir installation in the Western Cape by Damtech",
};

export const DEFAULT_OG_IMAGE = IMAGE_PATHS.hdpeDamLiningFieldInstallation;
export const DEFAULT_OG_IMAGE_ALT =
  IMAGE_ALTS[IMAGE_PATHS.hdpeDamLiningFieldInstallation];

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

/** Static image data for homepage project cards and featured work. */
export const FEATURED_PROJECT_IMAGES = {
  hartswater: hartswaterHdpeDamLiningProject,
  grabouw: grabouwHdpeDamLiningAfter,
  hoedspruit: bitumenEarthDamWaterproofing,
} as const;

/** Central registry for static page images (SEO filenames + alt text). */
export const SITE_IMAGES = {
  homeHero: siteImage(
    westernCapeDamLiningHero,
    IMAGE_PATHS.westernCapeDamLiningHero,
    IMAGE_ALTS[IMAGE_PATHS.westernCapeDamLiningHero],
  ),
  homeDamLiner: siteImage(
    hdpeDamLiningFieldInstallation,
    IMAGE_PATHS.hdpeDamLiningFieldInstallation,
    "Damtech team installing HDPE dam lining for earth dam waterproofing in South Africa",
    "Earth dam linings, steel tanks and waterproofing — installed nationwide.",
  ),
  damLiners: siteImage(
    hdpeDamLiningEarthDam,
    IMAGE_PATHS.hdpeDamLiningEarthDam,
    "HDPE and PVC dam linings for earth dams and water storage applications",
    "HDPE, PVC and Bitumen Torch-On dam lining options.",
  ),
  maintenance: siteImage(
    bitumenWaterproofingBefore,
    IMAGE_PATHS.bitumenWaterproofingBefore,
    "Waterproofing maintenance and inspection for leak prevention by Damtech",
    "Inspections, repairs and preventative maintenance.",
  ),
  contact: siteImage(
    hdpeDamLinerEarthDamLegacy,
    IMAGE_PATHS.hdpeDamLinerEarthDam,
    "Farm dam with HDPE dam lining installed by Damtech in South Africa",
    "Dam linings, steel tanks and waterproofing — quoted nationwide.",
  ),
  about: siteImage(
    damtechContractors,
    IMAGE_PATHS.damtechContractors,
    IMAGE_ALTS[IMAGE_PATHS.damtechContractors],
    "Trusted experts with 30+ years in the industry.",
  ),
  bitumen: siteImage(
    bitumenTorchOnWaterproofingDamtech,
    IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech,
    "Bitumen torch-on waterproofing system for leak prevention and long-term protection",
    "Torch-on, self-adhesive and liquid bitumen coatings.",
  ),
  bitumenBefore: siteImage(
    bitumenWaterproofingBefore,
    IMAGE_PATHS.bitumenWaterproofingBefore,
    "Before view of failed waterproofing surface before bitumen torch-on repair",
    "Before waterproofing repair",
  ),
  bitumenAfter: siteImage(
    bitumenEarthDamWaterproofing2,
    IMAGE_PATHS.bitumenEarthDamWaterproofing2,
    "Completed bitumen torch-on waterproofing repair after Damtech installation",
    "After bitumen torch-on waterproofing",
  ),
  steelTank: siteImage(
    corrugatedSteelWaterTankDamtech,
    IMAGE_PATHS.corrugatedSteelWaterTank,
    "Corrugated steel water tank for farm, mine and commercial water storage",
    "Steel reservoirs from 11 kL to 500 kL+.",
  ),
} as const satisfies Record<string, SiteImage>;

/** Blog image URL rewrites (WordPress → local WebP). */
export const BLOG_IMAGE_REWRITES: Record<string, { src: ImagePath; alt: string }> =
  {
    "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002.jpg":
      {
        src: IMAGE_PATHS.hdpeDamLiningFieldInstallation,
        alt: IMAGE_ALTS[IMAGE_PATHS.hdpeDamLiningFieldInstallation],
      },
    "https://dam-tech.co.za/wp-content/uploads/2024/09/IMG-20191205-WA0002-1024x576.jpg":
      {
        src: IMAGE_PATHS.hdpeDamLiningFieldInstallation,
        alt: IMAGE_ALTS[IMAGE_PATHS.hdpeDamLiningFieldInstallation],
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
