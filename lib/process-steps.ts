import type { ComponentType, SVGProps } from "react";
import {
  CheckCircleIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
} from "@/components/icons/StrokeIcons";

export type ProcessStep = {
  id: string;
  step: number;
  title: string;
  description: string;
  note?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Default 4-step process for service hub and inner pages. */
export const SERVICE_HUB_PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: "quote",
    step: 1,
    title: "Request a Quote",
    description:
      "Tell us what you need, including dam linings, waterproofing, steel water tanks, maintenance or repair.",
    note: "No obligation. No pressure.",
    Icon: FileTextIcon,
  },
  {
    id: "review",
    step: 2,
    title: "Site Review",
    description:
      "We assess the application, site conditions and practical requirements for your project.",
    note: "Thorough. Practical. Honest.",
    Icon: SearchIcon,
  },
  {
    id: "recommendation",
    step: 3,
    title: "Tailored Recommendation",
    description:
      "We recommend a suitable material, system and installation approach for your site.",
    note: "Clear recommendations.",
    Icon: LayersIcon,
  },
  {
    id: "delivery",
    step: 4,
    title: "Delivery & Support",
    description:
      "Our team delivers the agreed service with clear communication and practical workmanship.",
    note: "On time. On standard.",
    Icon: CheckCircleIcon,
  },
];
