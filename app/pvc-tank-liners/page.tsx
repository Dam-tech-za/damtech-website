import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SEOJsonLd } from "@/components/SEOJsonLd";
import { SiteSection } from "@/components/SiteSection";
import { PvcLinerPicker } from "@/components/shop/PvcLinerPicker";
import { createMetadata } from "@/lib/seo";
import {
  PVC_LINERS,
  PVC_LINER_MANUFACTURE_LABEL,
  PVC_LINER_PAGE_PATH,
} from "@/lib/shop/pvc-liners";
import { SITE_URL } from "@/lib/site-url";

export const metadata = createMetadata({
  title: "PVC Tank Liners for Steel Water Tanks | Buy Online",
  description:
    "Made-to-order 550 or 800 gsm PVC liners for 3 m to 17 m corrugated steel water tanks. See the price incl. VAT for your size and pay online.",
  path: PVC_LINER_PAGE_PATH,
});

const prices = PVC_LINERS.map((l) => l.priceInclVatZar);

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "PVC tank liner for corrugated steel water tanks",
  description:
    "Made-to-order PVC liner (550 gsm or 800 gsm) for corrugated steel water tanks from 3 m to 17 m diameter. Floor, walls and a 300 mm fold-over.",
  brand: { "@type": "Brand", name: "Damtech" },
  url: `${SITE_URL}${PVC_LINER_PAGE_PATH}`,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "ZAR",
    lowPrice: Math.min(...prices).toFixed(2),
    highPrice: Math.max(...prices).toFixed(2),
    offerCount: PVC_LINERS.length,
    availability: "https://schema.org/MadeToOrder",
  },
};

export default function PvcTankLinersPage() {
  return (
    <>
      <SEOJsonLd data={productSchema} />
      <Hero
        compact
        eyebrow="Buy online"
        title="PVC tank liners"
        description="Replacement and new PVC liners for corrugated steel water tanks, made to order for your tank size. Pick the diameter and height, see the price including VAT, and pay securely online."
        showActions={false}
      />

      <SiteSection aria-labelledby="pvc-picker-heading">
        <h2 id="pvc-picker-heading" className="pvc-shop__heading">
          Choose your tank size
        </h2>
        <p className="pvc-shop__lead">
          Measure the inside diameter of the tank and count the rows of corrugated sheet. Each row is 762 mm high.
        </p>
        <PvcLinerPicker />
      </SiteSection>

      <SiteSection tone="muted" aria-labelledby="pvc-included-heading">
        <div className="pvc-shop__columns">
          <div>
            <h2 id="pvc-included-heading" className="pvc-shop__heading">
              What you get
            </h2>
            <ul className="pvc-shop__list">
              <li>One made-up PVC liner: floor and walls welded to your tank size.</li>
              <li>A 300 mm fold-over at the top, to clip over the tank rim.</li>
              <li>550 gsm for standard water storage, or 800 gsm where you want a heavier liner.</li>
              <li>{PVC_LINER_MANUFACTURE_LABEL}, then delivered to your address.</li>
            </ul>
          </div>
          <div>
            <h2 className="pvc-shop__heading">Not included</h2>
            <ul className="pvc-shop__list">
              <li>Installation. Damtech can quote this separately.</li>
              <li>The steel tank, fittings, roof or base preparation.</li>
              <li>Sizes outside this list. For a non-standard tank, ask for a quote.</li>
            </ul>
            <p>
              Need a full tank or installation?{" "}
              <Link href="/steel-water-storage-tanks/" className="text-water hover:underline">
                See our steel water tanks
              </Link>{" "}
              or{" "}
              <Link href="/quote/" className="text-water hover:underline">
                request a quote
              </Link>
              . For dams and ponds, read about{" "}
              <Link href="/pvc-dam-lining/" className="text-water hover:underline">
                PVC dam lining
              </Link>
              .
            </p>
          </div>
        </div>
      </SiteSection>
    </>
  );
}
