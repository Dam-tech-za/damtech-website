import type { ServiceIntroSectionProps } from "@/components/ServiceIntroSection";
import { SITE_IMAGES } from "@/lib/images";

type ServiceIntroConfig = Omit<ServiceIntroSectionProps, "tone">;

/** Below-hero intro configs for primary service pages. */
export const DAM_LININGS_INTRO: ServiceIntroConfig = {
  eyebrow: "DAM LINERS & DAM LININGS",
  heading: "HDPE, PVC & Torch-On Dam Linings",
  description:
    "Damtech supplies and installs dam linings for earth dams, reservoirs, ponds and water storage applications across South Africa. Correctly specified HDPE, PVC and bitumen systems help reduce seepage, protect stored water and support reliable water storage for farms, mines, game lodges and commercial properties.",
  cards: [
    {
      title: "HDPE Dam Linings",
      description:
        "Durable geomembrane systems for exposed earth dams and long-term water storage.",
      href: "/hdpe-dam-lining",
    },
    {
      title: "PVC Dam Linings",
      description:
        "Flexible lining options for selected water-retaining and containment applications.",
      href: "/pvc-dam-lining",
    },
    {
      title: "Torch-On / Bitumen Systems",
      description:
        "Bitumen-based waterproofing and lining options for suitable concrete or earth dam applications.",
      href: "/torch-on-dam-lining",
    },
  ],
  primaryCta: { label: "Request a Dam Lining Quote", href: "/quote" },
  secondaryCta: { label: "View Damtech Projects", href: "/projects" },
  image: SITE_IMAGES.damLiners.image,
  imageAlt: "HDPE dam lining installation for water storage by Damtech",
  imageCaption:
    "Dam lining solutions for earth dams, reservoirs and water storage applications.",
  benefitChips: [
    {
      title: "Water Retention",
      description: "Reduces seepage and water loss.",
    },
    {
      title: "Leak Prevention",
      description: "Supports reliable storage and soil protection.",
    },
    {
      title: "Long-Term Durability",
      description: "Suitable systems for tough South African site conditions.",
    },
  ],
};

export const WATERPROOFING_INTRO: ServiceIntroConfig = {
  eyebrow: "WATERPROOFING SERVICES",
  heading: "Bitumen, Torch-On & Water-Retaining Waterproofing",
  description:
    "Damtech provides practical waterproofing solutions for concrete dams, reservoirs, channels, roofs and water-retaining structures. Our waterproofing services help reduce leaks, protect surfaces and extend the service life of water storage and building infrastructure.",
  cards: [
    {
      title: "Bitumen Waterproofing",
      description:
        "Practical waterproofing systems for selected concrete, reservoir and water-retaining applications.",
    },
    {
      title: "Torch-On Systems",
      description:
        "Torch-on membrane solutions for prepared surfaces, overlaps, upstands and detailing.",
      href: "/torch-on-dam-lining",
    },
    {
      title: "Maintenance & Repairs",
      description:
        "Inspection, repair planning and maintenance support for leaking or ageing waterproofing systems.",
      href: "/dam-repair-services",
    },
  ],
  primaryCta: { label: "Request a Waterproofing Quote", href: "/quote" },
  secondaryCta: { label: "Estimate Waterproofing Area", href: "/calculators" },
  image: SITE_IMAGES.bitumen.image,
  imageAlt:
    "Torch-on bitumen waterproofing for a concrete water-retaining structure",
  imageCaption:
    "Waterproofing systems for concrete dams, reservoirs and water-retaining structures.",
  benefitChips: [
    {
      title: "Leak Control",
      description: "Helps reduce water ingress and seepage.",
    },
    {
      title: "Surface Protection",
      description: "Protects concrete and prepared surfaces.",
    },
    {
      title: "Practical Repairs",
      description: "Supports maintenance and targeted waterproofing work.",
    },
  ],
  explainerTitle: "Waterproofing vs Dam Lining",
  explainerContent:
    "Waterproofing usually refers to protecting concrete, roofs, channels or water-retaining surfaces from leaks and water ingress. Dam lining generally refers to installing a liner or lining system inside an earth dam, pond or reservoir. Damtech can help recommend the right approach based on the structure, substrate and water-storage requirement.",
  explainerSecondaryContent:
    "Where suitable, bitumen and torch-on systems can support practical waterproofing or repair solutions. Final material selection depends on surface condition, detailing, exposure, water use and supplier specifications.",
};

export const STEEL_TANKS_INTRO: ServiceIntroConfig = {
  eyebrow: "STEEL WATER TANKS",
  heading: "Steel Water Tanks for Practical Water Storage",
  description:
    "Damtech supplies corrugated steel water tanks for farms, estates, mines and commercial properties that need durable above-ground water storage. Modular tank sizes support backup supply, irrigation reserves and practical site layouts across South Africa.",
  cards: [
    {
      title: "Corrugated Tanks",
      description:
        "Galvanised corrugated steel shells with PVC lining for reliable above-ground storage.",
    },
    {
      title: "Backup Storage",
      description:
        "Practical capacity for borehole backup, household supply and operational water needs.",
    },
    {
      title: "Farm & Commercial Use",
      description:
        "Suited to farms, estates, game lodges and commercial water-storage applications.",
    },
  ],
  primaryCta: { label: "Request a Steel Tank Quote", href: "/quote" },
  secondaryCta: { label: "Estimate Tank Size", href: "/calculators" },
  image: SITE_IMAGES.steelTank.image,
  imageAlt:
    "Corrugated steel water tank for farm and commercial water storage",
  imageCaption:
    "Corrugated steel water tanks for practical above-ground water storage.",
  benefitChips: [
    {
      title: "Modular Capacity",
      description: "Sized to match demand and site access.",
    },
    {
      title: "Faster Installation",
      description: "Above-ground assembly on prepared bases.",
    },
    {
      title: "Durable Storage",
      description: "Built for South African farm and commercial use.",
    },
  ],
};

export const HDPE_DAM_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "HDPE DAM LINING",
  heading: "HDPE Dam Lining for Long-Term Water Storage",
  description:
    "HDPE dam linings provide durable geomembrane protection for earth dams, irrigation reservoirs and mining ponds. Welded seams, UV-stable grades and correct anchoring help reduce seepage and protect stored water across South African sites.",
  cards: [
    {
      title: "UV Resistance",
      description: "UV-stable grades suited to exposed earth dam conditions.",
    },
    {
      title: "Welded Seams",
      description: "Heat-welded seams for continuous water-retaining barriers.",
    },
    {
      title: "Leak Prevention",
      description: "Helps reduce seepage through sandy and permeable soils.",
    },
  ],
  primaryCta: { label: "Request an HDPE Dam Lining Quote", href: "/quote" },
  secondaryCta: { label: "Estimate Dam Lining Area", href: "/calculators" },
  image: SITE_IMAGES.damLiners.image,
  imageAlt: "HDPE dam lining installation for water storage by Damtech",
  imageCaption:
    "HDPE dam lining for earth dams, reservoirs and long-term water storage.",
  benefitChips: [
    {
      title: "Low Seepage",
      description: "Supports reliable irrigation and stock water storage.",
    },
    {
      title: "Large Areas",
      description: "Practical for farm and mining dam footprints.",
    },
    {
      title: "Long Service Life",
      description: "Durable systems for tough site conditions.",
    },
  ],
};

export const PVC_DAM_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "PVC DAM LINING",
  heading: "PVC Dam Linings for Flexible Water Storage",
  description:
    "PVC dam linings suit selected ponds, steel tanks and smaller water-retaining applications where flexibility and practical handling matter. Damtech helps match PVC dam liner materials to site access, water use and containment needs.",
  cards: [
    {
      title: "Flexible Linings",
      description: "Easier handling on smaller ponds and selected reservoirs.",
    },
    {
      title: "Steel Tank Linings",
      description: "Common PVC lining option for corrugated steel water tanks.",
    },
    {
      title: "Containment Support",
      description: "Helps reduce seepage in suitable water-storage applications.",
    },
  ],
  primaryCta: { label: "Request a PVC Dam Lining Quote", href: "/quote" },
  secondaryCta: { label: "View Dam Linings Overview", href: "/dam-liners" },
  image: SITE_IMAGES.damLiners.image,
  imageAlt: "Dam lining installation for water storage by Damtech",
  imageCaption:
    "Flexible dam lining options for ponds, tanks and selected reservoirs.",
  benefitChips: [
    {
      title: "Practical Fit",
      description: "Useful where flexibility and access matter.",
    },
    {
      title: "Water Retention",
      description: "Supports leak reduction in suitable applications.",
    },
    {
      title: "Cost-Effective",
      description: "Often suited to smaller containment scopes.",
    },
  ],
};

export const TORCH_ON_DAM_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "TORCH-ON DAM LINING",
  heading: "Torch-On Bitumen Dam Lining Systems",
  description:
    "Torch-on bitumen systems support waterproofing and lining work on prepared concrete, cement and selected water-retaining surfaces. Damtech applies practical detailing for overlaps, upstands and leak-prone transitions.",
  cards: [
    {
      title: "Torch-On Membranes",
      description: "Heat-bonded sheets for prepared concrete and rigid surfaces.",
    },
    {
      title: "Detailing",
      description: "Careful work at overlaps, outlets, upstands and edges.",
    },
    {
      title: "Repair Support",
      description: "Useful for selected waterproofing repairs and upgrades.",
    },
  ],
  primaryCta: { label: "Request a Torch-On Quote", href: "/quote" },
  secondaryCta: {
    label: "View Waterproofing Services",
    href: "/bitumen-waterproofing",
  },
  image: SITE_IMAGES.bitumen.image,
  imageAlt:
    "Torch-on bitumen waterproofing for a concrete water-retaining structure",
  imageCaption:
    "Torch-on bitumen systems for concrete dams and water-retaining structures.",
  benefitChips: [
    {
      title: "Strong Bond",
      description: "Heat-bonded adhesion on prepared substrates.",
    },
    {
      title: "Leak Control",
      description: "Helps reduce water ingress at critical details.",
    },
    {
      title: "Practical Scope",
      description: "Suited to selected concrete dam applications.",
    },
  ],
};

export const DAM_REPAIR_INTRO: ServiceIntroConfig = {
  eyebrow: "LEAKING DAM REPAIR",
  heading: "Leaking Dam Repair & Maintenance Support",
  description:
    "Damtech helps assess leaking dams, damaged linings and ageing waterproofing systems. Practical repair planning can include localised patching, maintenance guidance or relining recommendations based on site conditions.",
  cards: [
    {
      title: "Leak Assessment",
      description: "Inspect water loss, liner damage and likely failure points.",
    },
    {
      title: "Localised Repair",
      description: "Targeted patching where the lining remains otherwise sound.",
    },
    {
      title: "Relining Guidance",
      description: "Clear advice when repair is no longer the practical option.",
    },
  ],
  primaryCta: { label: "Request a Dam Repair Quote", href: "/quote" },
  secondaryCta: { label: "View Dam Linings Overview", href: "/dam-liners" },
  image: SITE_IMAGES.damRepair.image,
  imageAlt: "Dam lining maintenance inspection for leak assessment by Damtech",
  imageCaption:
    "Maintenance inspection and repair planning for leaking dam linings.",
  benefitChips: [
    {
      title: "Early Action",
      description: "Catch liner damage before water loss escalates.",
    },
    {
      title: "Practical Options",
      description: "Repair, maintain or plan a full reline.",
    },
    {
      title: "Site-Based Advice",
      description: "Recommendations matched to structure and access.",
    },
  ],
};

export const RESERVOIR_LINING_INTRO: ServiceIntroConfig = {
  eyebrow: "RESERVOIR LINING",
  heading: "Reservoir Lining for Water Storage Protection",
  description:
    "Reservoir lining helps protect stored water, reduce seepage and support reliable containment for farms, mines and commercial properties. Damtech matches lining systems to reservoir type, substrate and water-use requirements.",
  cards: [
    {
      title: "Containment",
      description: "Lining systems that help reduce seepage and water loss.",
    },
    {
      title: "Structure Fit",
      description: "Options for earth, concrete and selected reservoir types.",
    },
    {
      title: "Water Protection",
      description: "Supports cleaner storage and more predictable volumes.",
    },
  ],
  primaryCta: { label: "Request a Reservoir Lining Quote", href: "/quote" },
  secondaryCta: { label: "View Dam Linings Overview", href: "/dam-liners" },
  image: SITE_IMAGES.reservoir.image,
  imageAlt: "Reservoir lining project for water storage protection by Damtech",
  imageCaption:
    "Reservoir lining solutions for water storage and containment applications.",
  benefitChips: [
    {
      title: "Seepage Control",
      description: "Helps keep stored water where it belongs.",
    },
    {
      title: "Durable Systems",
      description: "Matched to exposure and operating conditions.",
    },
    {
      title: "Practical Install",
      description: "Planned around access, detailing and water demand.",
    },
  ],
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
