import Link from "next/link";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";
import { PvcLinerPicker } from "@/components/shop/PvcLinerPicker";
import { PVC_LINER_PAGE_PATH } from "@/lib/shop/pvc-liners";

/** The PVC liner selector card with a heading, for the home and shop pages. */
export function PvcLinerShopSection({
  id = "pvc-tank-liners",
  tone = "default",
  title = "Order a PVC tank liner online",
}: {
  id?: string;
  tone?: "default" | "muted";
  title?: string;
}) {
  return (
    <SiteSection tone={tone} id={id} aria-labelledby={`${id}-heading`}>
      <PageSectionHeader
        id={`${id}-heading`}
        eyebrow="BUY ONLINE"
        title={title}
        intro="Made-to-order blue or black PVC liners for corrugated steel water tanks. Choose your tank size to see the price including VAT."
      />
      <PvcLinerPicker />
      <p className="pvc-shop__more">
        <Link href={PVC_LINER_PAGE_PATH} className="text-water hover:underline">
          How to measure your tank and choose a liner
        </Link>
      </p>
    </SiteSection>
  );
}
