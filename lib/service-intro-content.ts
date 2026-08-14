import type { ServiceIntroSectionProps } from "@/components/ServiceIntroSection";
import {
  CALCULATORS_DAM_LINING_LINK,
  CALCULATORS_STEEL_TANK_LINK,
  CALCULATORS_WATERPROOFING_LINK,
} from "@/lib/calculator-links";
import { SITE_IMAGES } from "@/lib/images";

type ServiceIntroConfig = Omit<ServiceIntroSectionProps, "tone">;

/** Below-hero bridge intro configs for DamTech service pages. */
export const DAM_LININGS_INTRO: ServiceIntroConfig = {
  eyebrow: "DAM LINERS & DAM LININGS",
  heading: "HDPE, PVC and torch-on dam lining systems",
  description:
    "Damtech supplies and installs dam linings for earth dams, reservoirs and water storage across South Africa. Correctly specified systems help reduce seepage and protect stored water for farms, mines, game lodges and commercial properties.",
  trustPoints: [
    { label: "Certified liner materials", icon: "check" },
    { label: "Installed by experienced teams", icon: "shield" },
    { label: "Suitable for agricultural storage", icon: "droplet" },
  ],
  primaryCta: { label: "Request a dam lining quote", href: "/quote" },
  secondaryCta: { label: "View Damtech projects", href: "/projects" },
  image: SITE_IMAGES.damLiners.image,
  imageAlt: "HDPE dam lining installation for water storage by Damtech",
  ribbonFacts: ["HDPE · PVC · Torch-on", "Installed nationwide", "Site-specific design"],
};

export const WATERPROOFING_INTRO: ServiceIntroConfig = {
  eyebrow: "WATERPROOFING SERVICES",
  heading: "Bitumen, torch-on and water-retaining waterproofing",
  description:
    "Damtech provides practical waterproofing for concrete dams, reservoirs, channels, roofs and water-retaining structures. Our systems help reduce leaks, protect surfaces and extend infrastructure life.",
  trustPoints: [
    { label: "Leak control", icon: "check" },
    { label: "Surface protection", icon: "shield" },
    { label: "Practical repairs", icon: "droplet" },
  ],
  primaryCta: { label: "Request a waterproofing quote", href: "/quote" },
  secondaryCta: {
    label: "Estimate waterproofing area",
    href: CALCULATORS_WATERPROOFING_LINK.href,
  },
  image: SITE_IMAGES.bitumen.image,
  imageAlt:
    "Torch-on bitumen waterproofing for a concrete water-retaining structure",
  ribbonFacts: ["Torch-on systems", "Concrete & roofs", "Repair support"],
  explainerTitle: "Waterproofing vs Dam Lining",
  explainerContent:
    "Waterproofing usually refers to protecting concrete, roofs, channels or water-retaining surfaces from leaks and water ingress. Dam lining generally refers to installing a liner or lining system inside an earth dam, pond or reservoir. Damtech can help recommend the right approach based on the structure, substrate and water-storage requirement.",
  explainerSecondaryContent:
    "Where suitable, bitumen and torch-on systems can support practical waterproofing or repair solutions. Final material selection depends on surface condition, detailing, exposure, water use and supplier specifications.",
};

export const STEEL_TANKS_INTRO: ServiceIntroConfig = {
  eyebrow: "STEEL WATER TANKS",
  heading: "Fixed-price corrugated steel reservoir kits",
  description:
    "Reliable above-ground water storage for farms, estates and commercial sites. Choose a VAT-inclusive supply-only kit sized for your water requirements.",
  trustPoints: [
    { label: "VAT-inclusive pricing", icon: "check" },
    { label: "Durable galvanised steel", icon: "shield" },
    { label: "Made for South African conditions", icon: "droplet" },
  ],
  primaryCta: {
    label: "View Tank Sizes",
    href: "#tank-capacity",
  },
  secondaryCta: {
    label: "Calculate your tank size",
    href: CALCULATORS_STEEL_TANK_LINK.href,
  },
  image: "/images/corrugated-steel-water-reservoir-south-africa.webp",
  imageAlt:
    "Corrugated steel water reservoir installed for farm water storage in South Africa",
  ribbonFacts: [
    "10 000L–500 000L+",
    "Supply-only kits",
    "Installation & Delivery Available",
  ],
  footnote:
    "Delivery and installation are available throughout South Africa and charged separately. They are not included in the kit price and are confirmed on the DamTech invoice.",
};

export const HDPE_DAM_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "HDPE DAM LINING",
  heading: "HDPE dam lining for long-term water storage",
  description:
    "HDPE dam linings provide durable geomembrane protection for earth dams, irrigation reservoirs and mining ponds. Welded seams and UV-stable grades help reduce seepage across South African sites.",
  trustPoints: [
    { label: "UV-stable grades", icon: "check" },
    { label: "Welded seams", icon: "shield" },
    { label: "Low seepage performance", icon: "droplet" },
  ],
  primaryCta: { label: "Request an HDPE dam lining quote", href: "/quote" },
  secondaryCta: {
    label: "Estimate dam lining area",
    href: CALCULATORS_DAM_LINING_LINK.href,
  },
  image: SITE_IMAGES.damLiners.image,
  imageAlt: "HDPE dam lining installation for water storage by Damtech",
  ribbonFacts: ["Earth dams", "Irrigation reservoirs", "Mining ponds"],
};

export const PVC_DAM_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "PVC DAM LINING",
  heading: "PVC dam linings for flexible water storage",
  description:
    "PVC dam linings suit selected ponds, steel tanks and smaller water-retaining applications where flexibility and practical handling matter.",
  trustPoints: [
    { label: "Flexible handling", icon: "check" },
    { label: "Steel tank linings", icon: "shield" },
    { label: "Practical containment", icon: "droplet" },
  ],
  primaryCta: { label: "Request a PVC dam lining quote", href: "/quote" },
  secondaryCta: { label: "View dam linings overview", href: "/dam-liners" },
  image: SITE_IMAGES.damLiners.image,
  imageAlt: "Dam lining installation for water storage by Damtech",
  ribbonFacts: ["Ponds & tanks", "Flexible sheets", "Selected reservoirs"],
};

export const TORCH_ON_DAM_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "TORCH-ON DAM LINING",
  heading: "Torch-on bitumen dam lining systems",
  description:
    "Torch-on bitumen systems support waterproofing and lining work on prepared concrete, cement and selected water-retaining surfaces.",
  trustPoints: [
    { label: "Heat-bonded membranes", icon: "check" },
    { label: "Careful detailing", icon: "shield" },
    { label: "Repair support", icon: "droplet" },
  ],
  primaryCta: { label: "Request a torch-on quote", href: "/quote" },
  secondaryCta: {
    label: "View waterproofing services",
    href: "/bitumen-waterproofing",
  },
  image: SITE_IMAGES.bitumen.image,
  imageAlt:
    "Torch-on bitumen waterproofing for a concrete water-retaining structure",
  ribbonFacts: ["Concrete surfaces", "Upstands & overlaps", "Repair options"],
};

export const DAM_REPAIR_INTRO: ServiceIntroConfig = {
  eyebrow: "LEAKING DAM REPAIR",
  heading: "Leaking dam repair and maintenance support",
  description:
    "Damtech helps assess leaking dams, damaged linings and ageing waterproofing systems. Practical options include localised repair, maintenance guidance or relining recommendations.",
  trustPoints: [
    { label: "Leak assessment", icon: "check" },
    { label: "Localised repair", icon: "shield" },
    { label: "Relining guidance", icon: "droplet" },
  ],
  primaryCta: { label: "Request a dam repair quote", href: "/quote" },
  secondaryCta: { label: "View dam linings overview", href: "/dam-liners" },
  image: SITE_IMAGES.damRepair.image,
  imageAlt: "Dam lining maintenance inspection for leak assessment by Damtech",
  ribbonFacts: ["Inspection", "Targeted repairs", "Reline planning"],
};

export const RESERVOIR_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "RESERVOIR LINING",
  heading: "Reservoir lining for water storage protection",
  description:
    "Reservoir lining helps protect stored water, reduce seepage and support reliable containment for farms, mines and commercial properties.",
  trustPoints: [
    { label: "Seepage control", icon: "check" },
    { label: "Structure-matched systems", icon: "shield" },
    { label: "Protected storage", icon: "droplet" },
  ],
  primaryCta: { label: "Request a reservoir lining quote", href: "/quote" },
  secondaryCta: { label: "View dam linings overview", href: "/dam-liners" },
  image: SITE_IMAGES.reservoir.image,
  imageAlt: "Reservoir lining project for water storage protection by Damtech",
  ribbonFacts: ["Farms & mines", "Containment", "Practical install"],
};

export function getSubServiceIntro(slug: string): ServiceIntroConfig | null {
  switch (slug) {
    case "hdpe-dam-lining":
      return HDPE_DAM_LINING_INTRO;
    case "pvc-dam-lining":
      return PVC_DAM_LINING_INTRO;
    case "torch-on-dam-lining":
      return TORCH_ON_DAM_LINING_INTRO;
    case "dam-repair-services":
      return DAM_REPAIR_INTRO;
    case "reservoir-lining":
      return RESERVOIR_LINING_INTRO;
    default:
      return null;
  }
}
