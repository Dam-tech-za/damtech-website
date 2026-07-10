import type { StaticImageData } from "next/image";

/**
 * Western Cape local SEO convention (project images):
 * - Prefer town/area filenames within the Western Cape, not province-only names.
 * - Filenames and alt text should include BOTH the town and western-cape,
 *   e.g. tulbagh-western-cape-steel-water-tank-project.webp /
 *   "... in Tulbagh in the Western Cape".
 * - Assigned WC market towns for previously unallocated project assets:
 *   - Tulbagh → steel water tank
 *   - Worcester → bitumen earth dam ~15,000 m²
 *   - Villiersdorp → HDPE dam lining ~8,230 m²
 * - Do not rename confirmed-location assets (Grabouw, Stellenbosch hero, etc.) without cause.
 */

import worcesterWesternCapeBitumenEarthDamLining15000m2 from "@/public/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2.webp";
import worcesterWesternCapeBitumenEarthDamLining15000m22 from "@/public/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2-2.webp";
import worcesterWesternCapeBitumenEarthDamLining15000m23 from "@/public/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2-3.webp";
import worcesterWesternCapeBitumenEarthDamLining15000m24 from "@/public/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2-4.webp";
import bitumenEarthDamWaterproofing from "@/public/images/bitumen-earth-dam-waterproofing.webp";
import bitumenEarthDamWaterproofing2 from "@/public/images/bitumen-earth-dam-waterproofing-2.webp";
import bitumenTorchOnWaterproofingDamtech from "@/public/images/bitumen-torch-on-waterproofing-damtech.webp";
import bitumenWaterproofingBefore from "@/public/images/bitumen-waterproofing-before.webp";
import damLiningMaintenanceInspection1 from "@/public/images/dam-lining-maintenance-inspection-1.webp";
import damLiningRepairMaintenance2 from "@/public/images/dam-lining-repair-maintenance-2.webp";
import leakingDamRepairAssessment3 from "@/public/images/leaking-dam-repair-assessment-3.webp";
import damtechWaterStorageHero from "@/public/images/damtech-dam-liners-water-storage-solutions.webp";
import grabouwHdpeDamLiningAfter from "@/public/images/grabouw-hdpe-dam-lining-after.webp";
import hartswaterHdpeDamLiningProject from "@/public/images/hartswater-hdpe-dam-lining-project.webp";
import hdpeDamLinerInstallationLimpopo from "@/public/images/hdpe-dam-liner-installation-limpopo.webp";
import villiersdorpWesternCapeHdpeDamLining8230m2 from "@/public/images/villiersdorp-western-cape-hdpe-dam-lining-8230m2.webp";
import villiersdorpWesternCapeHdpeDamLining8230m22 from "@/public/images/villiersdorp-western-cape-hdpe-dam-lining-8230m2-2.webp";
import tulbaghWesternCapeSteelWaterTankProject from "@/public/images/tulbagh-western-cape-steel-water-tank-project.webp";
import hdpeDamLiningAfterGeotextile from "@/public/images/hdpe-dam-lining-after-geotextile.webp";
import hdpeDamLiningBeforeInstallation from "@/public/images/hdpe-dam-lining-before-installation.webp";
import hdpeDamLiningEarthDam from "@/public/images/hdpe-dam-lining-earth-dam.webp";
import hdpeDamLiningFieldInstallation from "@/public/images/hdpe-dam-lining-field-installation.webp";
import hdpeLinedFarmReservoirCattle from "@/public/images/hdpe-lined-farm-reservoir-cattle-south-africa.webp";
import torchOnConcreteDam15mMpumalanga from "@/public/images/torch-on-bitumen-concrete-round-dam-15m-177m2-mpumalanga.webp";
import torchOnConcreteDam18mTzaneen from "@/public/images/torch-on-bitumen-concrete-round-dam-18m-255m2-tzaneen.webp";
import westernCapeDamLiningHero from "@/public/images/western-cape-dam-lining-reservoir-damtech.webp";

/** Stable public URLs for Open Graph, blog rewrites and JSON data. WebP only. */
export const IMAGE_PATHS = {
  worcesterWesternCapeBitumenEarthDamLining15000m2:
    "/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2.webp",
  worcesterWesternCapeBitumenEarthDamLining15000m22:
    "/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2-2.webp",
  worcesterWesternCapeBitumenEarthDamLining15000m23:
    "/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2-3.webp",
  worcesterWesternCapeBitumenEarthDamLining15000m24:
    "/images/worcester-western-cape-bitumen-earth-dam-lining-15000m2-4.webp",
  bitumenEarthDamWaterproofing: "/images/bitumen-earth-dam-waterproofing.webp",
  bitumenEarthDamWaterproofing2: "/images/bitumen-earth-dam-waterproofing-2.webp",
  bitumenTorchOnWaterproofingDamtech:
    "/images/bitumen-torch-on-waterproofing-damtech.webp",
  bitumenWaterproofingBefore: "/images/bitumen-waterproofing-before.webp",
  damLiningMaintenanceInspection1:
    "/images/dam-lining-maintenance-inspection-1.webp",
  damLiningRepairMaintenance2: "/images/dam-lining-repair-maintenance-2.webp",
  leakingDamRepairAssessment3: "/images/leaking-dam-repair-assessment-3.webp",
  damtechWaterStorageHero:
    "/images/damtech-dam-liners-water-storage-solutions.webp",
  damtechLogo: "/images/damtech-logo.svg",
  grabouwHdpeDamLiningAfter: "/images/grabouw-hdpe-dam-lining-after.webp",
  hartswaterHdpeDamLiningProject:
    "/images/hartswater-hdpe-dam-lining-project.webp",
  hdpeDamLinerInstallationLimpopo:
    "/images/hdpe-dam-liner-installation-limpopo.webp",
  villiersdorpWesternCapeHdpeDamLining8230m2:
    "/images/villiersdorp-western-cape-hdpe-dam-lining-8230m2.webp",
  villiersdorpWesternCapeHdpeDamLining8230m22:
    "/images/villiersdorp-western-cape-hdpe-dam-lining-8230m2-2.webp",
  tulbaghWesternCapeSteelWaterTankProject:
    "/images/tulbagh-western-cape-steel-water-tank-project.webp",
  hdpeDamLiningAfterGeotextile: "/images/hdpe-dam-lining-after-geotextile.webp",
  hdpeDamLiningBeforeInstallation:
    "/images/hdpe-dam-lining-before-installation.webp",
  hdpeDamLiningEarthDam: "/images/hdpe-dam-lining-earth-dam.webp",
  hdpeDamLiningFieldInstallation:
    "/images/hdpe-dam-lining-field-installation.webp",
  hdpeLinedFarmReservoirCattle:
    "/images/hdpe-lined-farm-reservoir-cattle-south-africa.webp",
  torchOnConcreteDam15mMpumalanga:
    "/images/torch-on-bitumen-concrete-round-dam-15m-177m2-mpumalanga.webp",
  torchOnConcreteDam18mTzaneen:
    "/images/torch-on-bitumen-concrete-round-dam-18m-255m2-tzaneen.webp",
  westernCapeDamLiningHero:
    "/images/western-cape-dam-lining-reservoir-damtech.webp",
} as const;

export type ImagePath = (typeof IMAGE_PATHS)[keyof typeof IMAGE_PATHS];

export const IMAGE_ALTS: Record<ImagePath, string> = {
  [IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m2]:
    "Bitumen earth dam lining project in Worcester in the Western Cape for water retention and leak prevention by Damtech",
  [IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m22]:
    "Bitumen earth dam lining installation on a large water storage basin in Worcester in the Western Cape",
  [IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m23]:
    "Bitumen lining system applied to an earth dam water-retention project in Worcester in the Western Cape",
  [IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m24]:
    "Completed bitumen earth dam lining work for improved water retention in Worcester in the Western Cape",
  [IMAGE_PATHS.bitumenEarthDamWaterproofing]:
    "Bitumen torch-on waterproofing on an earth dam surface by Damtech",
  [IMAGE_PATHS.bitumenEarthDamWaterproofing2]:
    "Bitumen torch-on waterproofing applied to a water-retaining earth dam",
  [IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech]:
    "Bitumen torch-on waterproofing system for leak prevention and long-term protection",
  [IMAGE_PATHS.bitumenWaterproofingBefore]:
    "Dam lining surface before maintenance inspection and waterproofing repair",
  [IMAGE_PATHS.damLiningMaintenanceInspection1]:
    "Dam lining maintenance inspection for leak assessment by Damtech",
  [IMAGE_PATHS.damLiningRepairMaintenance2]:
    "Dam lining repair and maintenance work for water retention",
  [IMAGE_PATHS.leakingDamRepairAssessment3]:
    "Leaking dam repair assessment and maintenance planning by Damtech",
  [IMAGE_PATHS.damtechWaterStorageHero]:
    "Damtech dam linings, steel water tanks and waterproofing solutions in South Africa",
  [IMAGE_PATHS.damtechLogo]: "Damtech logo — water droplet mark",
  [IMAGE_PATHS.grabouwHdpeDamLiningAfter]:
    "Large HDPE dam lining installation for water storage in Grabouw",
  [IMAGE_PATHS.hartswaterHdpeDamLiningProject]:
    "HDPE dam lining project completed by Damtech in Centurion, Gauteng",
  [IMAGE_PATHS.hdpeDamLinerInstallationLimpopo]:
    "HDPE dam lining installation on a farm water storage project in Limpopo",
  [IMAGE_PATHS.villiersdorpWesternCapeHdpeDamLining8230m2]:
    "HDPE dam lining project in Villiersdorp in the Western Cape covering approximately 8,230 m² by Damtech",
  [IMAGE_PATHS.villiersdorpWesternCapeHdpeDamLining8230m22]:
    "HDPE dam lining field installation for a large water storage application in Villiersdorp in the Western Cape",
  [IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject]:
    "Round corrugated steel water tank for water storage in Tulbagh in the Western Cape",
  [IMAGE_PATHS.hdpeDamLiningAfterGeotextile]:
    "HDPE dam lining after installation with geotextile protection on site",
  [IMAGE_PATHS.hdpeDamLiningBeforeInstallation]:
    "Earth dam basin prepared before HDPE dam lining installation",
  [IMAGE_PATHS.hdpeDamLiningEarthDam]:
    "HDPE dam lining installation for earth dams and water storage applications",
  [IMAGE_PATHS.hdpeDamLiningFieldInstallation]:
    "HDPE dam lining field installation for long-term water storage and leak prevention",
  [IMAGE_PATHS.hdpeLinedFarmReservoirCattle]:
    "Cattle beside an HDPE-lined farm reservoir in South Africa",
  [IMAGE_PATHS.torchOnConcreteDam15mMpumalanga]:
    "Torch-on bitumen waterproofing on a 15 m diameter concrete dam in Mpumalanga",
  [IMAGE_PATHS.torchOnConcreteDam18mTzaneen]:
    "Torch-on bitumen waterproofing on an 18 m diameter concrete dam",
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

/** Static image data for homepage project cards (keyed by project slug). */
export const FEATURED_PROJECT_IMAGES = {
  "centurion-hdpe-dam-liner": hartswaterHdpeDamLiningProject,
  "grabouw-hdpe-farm-dam": grabouwHdpeDamLiningAfter,
  "hoedspruit-bitumen-dam-lining": bitumenEarthDamWaterproofing,
  "tzaneen-torch-on-bitumen-concrete-dam-18m": torchOnConcreteDam18mTzaneen,
  "worcester-bitumen-earth-dam-lining-15000m2":
    worcesterWesternCapeBitumenEarthDamLining15000m2,
  "tulbagh-steel-water-tank": tulbaghWesternCapeSteelWaterTankProject,
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
    "HDPE dam lining installation for earth dams and water storage applications",
    "HDPE, PVC and torch-on dam lining options.",
  ),
  maintenance: siteImage(
    damLiningMaintenanceInspection1,
    IMAGE_PATHS.damLiningMaintenanceInspection1,
    IMAGE_ALTS[IMAGE_PATHS.damLiningMaintenanceInspection1],
    "Maintenance inspection used to assess possible dam lining damage before repair planning.",
  ),
  maintenanceRepair: siteImage(
    damLiningRepairMaintenance2,
    IMAGE_PATHS.damLiningRepairMaintenance2,
    IMAGE_ALTS[IMAGE_PATHS.damLiningRepairMaintenance2],
    "Maintenance work on a dam lining system before repair.",
  ),
  maintenanceAssessment: siteImage(
    leakingDamRepairAssessment3,
    IMAGE_PATHS.leakingDamRepairAssessment3,
    IMAGE_ALTS[IMAGE_PATHS.leakingDamRepairAssessment3],
    "Leak assessment and maintenance planning for a water storage structure.",
  ),
  damRepair: siteImage(
    damLiningMaintenanceInspection1,
    IMAGE_PATHS.damLiningMaintenanceInspection1,
    IMAGE_ALTS[IMAGE_PATHS.damLiningMaintenanceInspection1],
    "Dam lining maintenance inspection before leaking dam repair planning.",
  ),
  contact: siteImage(
    hdpeDamLiningFieldInstallation,
    IMAGE_PATHS.hdpeDamLiningFieldInstallation,
    "HDPE dam lining installation for water storage by Damtech in South Africa",
    "Dam linings, steel tanks and waterproofing — quoted nationwide.",
  ),
  about: siteImage(
    hdpeDamLiningFieldInstallation,
    IMAGE_PATHS.hdpeDamLiningFieldInstallation,
    "Damtech dam lining field installation for water storage projects in South Africa",
    "Practical dam linings, waterproofing and water storage solutions.",
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
    "Dam lining surface before maintenance inspection and waterproofing repair",
    "Before waterproofing repair",
  ),
  bitumenAfter: siteImage(
    bitumenEarthDamWaterproofing2,
    IMAGE_PATHS.bitumenEarthDamWaterproofing2,
    "Completed bitumen torch-on waterproofing repair after Damtech installation",
    "After bitumen torch-on waterproofing",
  ),
  steelTank: siteImage(
    tulbaghWesternCapeSteelWaterTankProject,
    IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject,
    "Corrugated steel water tank for water storage in Tulbagh in the Western Cape",
    "Steel reservoirs from 11 kL to 500 kL+.",
  ),
  reservoir: siteImage(
    hdpeDamLiningAfterGeotextile,
    IMAGE_PATHS.hdpeDamLiningAfterGeotextile,
    "Reservoir lining project with HDPE dam lining and geotextile protection",
    "Lined reservoirs for farms, mines and commercial properties.",
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
        src: IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject,
        alt: IMAGE_ALTS[IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject],
      },
  };

export function altForImagePath(path: string): string {
  return IMAGE_ALTS[path as ImagePath] ?? "";
}
