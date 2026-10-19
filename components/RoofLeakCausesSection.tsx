import Link from "next/link";
import { CausesDiagramSection } from "@/components/CausesDiagramSection";
import { SITE_IMAGES } from "@/lib/images";

const ROOF_LEAK_SIGNS = [
  "Brown stains on the ceiling",
  "Peeling or bubbling ceiling paint",
  "Water ponding on the roof",
  "Cracked parapets or copings",
  "Blocked outlets and gutters",
] as const;

/** Roof waterproofing page: why flat roofs leak, from the roof down. */
export function RoofLeakCausesSection({ quoteHref }: { quoteHref: string }) {
  return (
    <CausesDiagramSection
      id="roof-leak-causes"
      eyebrow="Roof leaks explained"
      heading="Why flat roofs leak: the common causes"
      intro="A ceiling stain shows where the water ends up, not where it gets in. Most flat roof leaks start at a detail, so we trace the entry point before we quote."
      signsLabel="Common signs of a roof leak"
      signs={ROOF_LEAK_SIGNS}
      figures={[
        {
          image: SITE_IMAGES.roofLeakCauses,
          title: "Flat roof leak causes, from the roof down",
          text: (
            <>
              Most leaks on South African flat roofs come from a cracked or
              aged waterproofing membrane, failed laps and flashings, ponding
              water, blocked outlets and cracks where the parapet wall meets the
              roof. Inside, they show as ceiling damp patches, damaged ceiling
              boards and mould. Compare{" "}
              <Link href="/waterproofing-membranes-and-coatings/">
                membranes and roof coatings
              </Link>
              .
            </>
          ),
        },
      ]}
      ctaText="Got a leaking roof? WhatsApp us a photo of the stain and the roof above it. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond."
      ctaLabel="Request a roof waterproofing quote"
      whatsAppLabel="WhatsApp a photo of the leak"
      quoteHref={quoteHref}
    />
  );
}
