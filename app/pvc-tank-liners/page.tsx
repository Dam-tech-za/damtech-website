import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { PageSeo } from "@/components/PageSeo";
import { RelatedPageLinks, ServiceFaqSection, ServiceProseSections } from "@/components/ServicePageSections";
import { SiteSection } from "@/components/SiteSection";
import { PvcLinerSizeTable } from "@/components/shop/PvcLinerSizeTable";
import { PvcLinerDiagram } from "@/components/shop/PvcLinerDiagram";
import { PvcLinerPicker } from "@/components/shop/PvcLinerPicker";
import { createFaqPageSchema, createMetadata } from "@/lib/seo";
import { PVC_LINER_FAQS, PVC_LINER_SECTIONS } from "@/lib/shop/pvc-liner-content";
import { buildPvcLinerProductGroupSchema } from "@/lib/shop/pvc-merchant";
import { getPvcLinerBySku, PVC_LINER_MANUFACTURE_LABEL, PVC_LINER_PAGE_PATH } from "@/lib/shop/pvc-liners";

export const metadata = createMetadata({
  title: "PVC Tank Liners for Steel Water Tanks | Buy Online",
  description:
    "Made-to-order 550 or 800 gsm PVC liners for 3 m to 17 m corrugated steel water tanks. See the price incl. VAT for your size and pay online.",
  path: PVC_LINER_PAGE_PATH,
});

const RELATED_LINKS = [
  { href: "/shop/", label: "Damtech shop" },
  { href: "/steel-water-storage-tanks/", label: "Corrugated steel water tanks and prices" },
  { href: "/pvc-dam-lining/", label: "PVC dam lining for ponds and dams" },
  { href: "/calculators/", label: "Tank and dam calculators" },
  { href: "/quote/", label: "Request a quote for installation or a custom size" },
] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PvcTankLinersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = Array.isArray(params.sku) ? params.sku[0] : params.sku;
  const initialLiner = requested ? getPvcLinerBySku(requested) : null;
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "PVC Tank Liners", path: "/pvc-tank-liners" },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[buildPvcLinerProductGroupSchema(), createFaqPageSchema(PVC_LINER_FAQS)]}
      />
      <Hero
        compact
        eyebrow="Buy online"
        title="PVC tank liners"
        description="Replacement and new PVC liners for corrugated steel water tanks, made to order for your tank size in blue or black. Pick the diameter and height, see the price including VAT, and pay securely online."
        breadcrumbs={breadcrumbs}
        showActions={false}
      />

      <SiteSection id="choose-size" aria-labelledby="pvc-picker-heading">
        <PageSectionHeader
          id="pvc-picker-heading"
          eyebrow="PRICES INCL. VAT"
          title="Choose your tank size"
          intro="Measure the inside diameter of the tank and count the rows of corrugated sheet. Each row is 762 mm high."
        />
        <PvcLinerDiagram />
        <PvcLinerPicker initialSku={initialLiner?.sku ?? null} syncUrl />
      </SiteSection>

      <ServiceProseSections sections={PVC_LINER_SECTIONS} tone="muted" />

      <SiteSection aria-labelledby="pvc-included-heading">
        <div className="pvc-shop__columns">
          <div>
            <h2 id="pvc-included-heading" className="pvc-shop__heading">
              What you get
            </h2>
            <ul className="pvc-shop__list">
              <li>One made-up PVC liner: floor and walls welded to your tank size.</li>
              <li>A 300 mm fold-over at the top, to clip over the tank rim.</li>
              <li>Your choice of 550 gsm or 800 gsm, in blue or black.</li>
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
              <Link href="/quote/" className="btn-secondary">
                Request a quote
              </Link>
            </p>
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="muted" aria-labelledby="pvc-all-sizes-heading">
        <PageSectionHeader
          id="pvc-all-sizes-heading"
          eyebrow="ALL LINERS"
          title="All PVC tank liner sizes and prices"
          intro="Every liner has its own product page. Select a price to open it."
        />
        <PvcLinerSizeTable />
      </SiteSection>

      <ServiceFaqSection faqs={[...PVC_LINER_FAQS]} heading="PVC tank liner questions" />
      <RelatedPageLinks links={RELATED_LINKS} />
    </>
  );
}
