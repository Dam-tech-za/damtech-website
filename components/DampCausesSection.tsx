import Link from "next/link";
import { CausesDiagramSection } from "@/components/CausesDiagramSection";
import { SITE_IMAGES } from "@/lib/images";

const DAMP_SIGNS = [
  "Peeling or bubbling paint",
  "A tide mark low on the wall",
  "Black mould in corners",
  "White salt (efflorescence)",
  "Musty smell, swollen skirtings",
] as const;

/** Waterproofing page: interior (rising/penetrating) damp, then foundation leaks. */
export function DampCausesSection({ quoteHref }: { quoteHref: string }) {
  return (
    <CausesDiagramSection
      id="damp-causes"
      eyebrow="Damp walls explained"
      heading="What causes rising damp and damp walls?"
      intro="Damp is a symptom. Paint keeps peeling until the water getting into the wall is stopped, so we find the cause before we quote."
      signsLabel="Common signs of damp"
      signs={DAMP_SIGNS}
      figures={[
        {
          image: SITE_IMAGES.risingDampCauses,
          title: "Rising damp and penetrating damp inside the house",
          text: "Most damp walls in South African homes come from a failed or bridged damp-proof course (DPC), garden soil or paving built up above it, poor drainage against the wall, or rain getting in through cracked plaster and window sills.",
        },
        {
          image: SITE_IMAGES.foundationLeakPoints,
          title: "Foundation and below-ground leaks",
          text: (
            <>
              Below ground, water pushes through cracks, mortar joints, pipe
              entries and the floor-to-wall joint wherever the waterproofing
              membrane is missing or damaged. See{" "}
              <Link href="/foundation-waterproofing/">
                foundation waterproofing and damp-proofing
              </Link>
              .
            </>
          ),
        },
      ]}
      ctaText="Seeing any of these at home? Send us a photo and we will tell you what we think is causing it. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond."
      ctaLabel="Request a damp-proofing quote"
      whatsAppLabel="WhatsApp a photo of the wall"
      quoteHref={quoteHref}
    />
  );
}
