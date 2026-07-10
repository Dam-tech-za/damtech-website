import type { RelatedServiceLink } from "@/components/RelatedServicesGrid";
import {
  CogIcon,
  DropletIcon,
  FileTextIcon,
  LayersIcon,
  MessageIcon,
  ReservoirIcon,
  WrenchIcon,
} from "@/components/icons/StrokeIcons";
import { CALCULATORS_RELATED_LINK } from "@/lib/calculator-links";

/** Sitewide related service links — aligned with header Services dropdown labels. */
export const RELATED_SERVICE_LINKS: readonly RelatedServiceLink[] = [
  {
    href: "/dam-liners",
    label: "Dam Liners & Dam Lining Services",
    Icon: LayersIcon,
  },
  {
    href: "/hdpe-dam-lining",
    label: "HDPE Dam Lining",
    Icon: LayersIcon,
  },
  {
    href: "/pvc-dam-lining",
    label: "PVC Dam Lining",
    Icon: LayersIcon,
  },
  {
    href: "/steel-water-storage-tanks",
    label: "Steel Water Tanks",
    Icon: ReservoirIcon,
  },
  {
    href: "/bitumen-waterproofing",
    label: "Waterproofing",
    Icon: DropletIcon,
  },
  {
    href: "/reservoir-lining",
    label: "Reservoir Lining",
    Icon: ReservoirIcon,
  },
  {
    href: "/dam-repair-services",
    label: "Leaking Dam Repair",
    Icon: WrenchIcon,
  },
  {
    href: "/projects",
    label: "Projects",
    Icon: CogIcon,
  },
  {
    href: CALCULATORS_RELATED_LINK.href,
    label: CALCULATORS_RELATED_LINK.label,
    Icon: FileTextIcon,
  },
  {
    href: "/services",
    label: "All Services",
    Icon: CogIcon,
  },
  {
    href: "/faq",
    label: "FAQ",
    Icon: MessageIcon,
  },
  {
    href: "/quote",
    label: "Request a Quote",
    Icon: MessageIcon,
  },
];

type SimpleRelatedLink = {
  href: string;
  label: string;
};

/** Map page-specific related links onto the shared icon registry where possible. */
export function resolveRelatedLinks(
  links: readonly SimpleRelatedLink[],
): RelatedServiceLink[] {
  return links.map((link) => {
    const known = RELATED_SERVICE_LINKS.find((item) => item.href === link.href);
    return known ?? link;
  });
}
