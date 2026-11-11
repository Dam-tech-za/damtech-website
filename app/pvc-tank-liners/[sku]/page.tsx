import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { PageSeo } from "@/components/PageSeo";
import { RelatedPageLinks } from "@/components/ServicePageSections";
import { SiteSection } from "@/components/SiteSection";
import { PvcLinerDiagram } from "@/components/shop/PvcLinerDiagram";
import { PvcLinerBuyBox } from "@/components/shop/PvcLinerBuyBox";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import { createMetadata } from "@/lib/seo";
import { buildPvcLinerProductSchema } from "@/lib/shop/pvc-merchant";
import {
  getPvcLinerBySku,
  getPvcLinerBySlug,
  isPvcLinerSoldOnline,
  PVC_LINER_COLOUR_IMAGES,
  PVC_LINER_GSM_OPTIONS,
  PVC_LINER_MANUFACTURE_LABEL,
  PVC_LINERS,
  pvcLinerProductPath,
  pvcLinerSizeLabel,
  pvcLinerSku,
  pvcLinerSlug,
  type PvcLiner,
} from "@/lib/shop/pvc-liners";

type Props = { params: Promise<{ sku: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PVC_LINERS.map((liner) => ({ sku: pvcLinerSlug(liner) }));
}

function heading(liner: PvcLiner): string {
  return `${liner.gsm} gsm PVC tank liner for a ${pvcLinerSizeLabel(liner)} steel tank`;
}

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const liner = getPvcLinerBySlug(sku);
  if (!liner) return {};
  const online = isPvcLinerSoldOnline(liner);
  return createMetadata({
    title: online
      ? `${liner.gsm} gsm PVC Tank Liner ${pvcLinerSizeLabel(liner)} | Buy Online`
      : `${liner.gsm} gsm PVC Tank Liner ${pvcLinerSizeLabel(liner)} | Request a Quote`,
    description: online
      ? `Buy a ${liner.gsm} gsm PVC liner for a ${liner.diameterM} m, ${liner.rows}-row steel tank (about ${Math.round(liner.volumeKl)} kL). ${formatZarExactAmount(liner.priceInclVatZar)} incl. VAT, blue or black.`
      : `Made-to-order ${liner.gsm} gsm PVC liner for a ${liner.diameterM} m, ${liner.rows}-row steel tank (about ${Math.round(liner.volumeKl)} kL), blue or black. Request a quote with delivery.`,
    path: pvcLinerProductPath(liner),
    image: PVC_LINER_COLOUR_IMAGES.blue.src,
    imageAlt: PVC_LINER_COLOUR_IMAGES.blue.alt,
  });
}

export default async function PvcLinerProductPage({ params }: Props) {
  const { sku } = await params;
  const liner = getPvcLinerBySlug(sku);
  if (!liner) notFound();

  const path = pvcLinerProductPath(liner);
  const online = isPvcLinerSoldOnline(liner);
  const productSchema = buildPvcLinerProductSchema(liner);
  const priceLabel = (item: PvcLiner) =>
    isPvcLinerSoldOnline(item) ? `${formatZarExactAmount(item.priceInclVatZar)} incl. VAT` : "price on request";
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "PVC Tank Liners", path: "/pvc-tank-liners" },
    { name: liner.name, path: path.replace(/\/$/, "") },
  ];
  const otherGsm = PVC_LINER_GSM_OPTIONS.filter((gsm) => gsm !== liner.gsm)
    .map((gsm) => getPvcLinerBySku(pvcLinerSku(gsm, liner.diameterM, liner.rows)))
    .filter((item): item is PvcLiner => item !== null);
  const relatedLinks = [
    ...otherGsm.map((item) => ({
      href: pvcLinerProductPath(item),
      label: `Same size in ${item.gsm} gsm, ${priceLabel(item)}`,
    })),
    { href: "/pvc-tank-liners/#choose-size", label: "Choose a different tank size" },
    { href: "/pvc-tank-liners/#how-to-measure", label: "How to measure your tank" },
    { href: "/shop/", label: "Damtech shop" },
    { href: "/quote/", label: "Request a quote for installation or a custom size" },
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} schemas={productSchema ? [productSchema] : []} />
      <Hero
        compact
        eyebrow={online ? `${liner.sku} · ${formatZarExactAmount(liner.priceInclVatZar)} incl. VAT` : `${liner.sku} · Price on request`}
        title={heading(liner)}
        description={`Made-to-order liner in blue or black for a ${liner.diameterM} m diameter, ${liner.rows}-row corrugated steel tank of about ${Math.round(liner.volumeKl)} kL. ${online ? "Pay securely online." : "Request a quote with delivery."}`}
        breadcrumbs={breadcrumbs}
        showActions={false}
      />

      <SiteSection>
        <PvcLinerBuyBox liner={liner} />
      </SiteSection>

      <SiteSection tone="muted">
        <PageSectionHeader id="specifications" eyebrow="SPECIFICATIONS" title="Liner specifications" />
        <PvcLinerDiagram
          diameterLabel={`${liner.diameterM} m diameter`}
          heightLabel={`${liner.heightM.toFixed(2)} m high`}
          caption={`This liner is round, made for a round corrugated steel tank or pond ${liner.diameterM} m across and ${liner.heightM.toFixed(2)} m high: a circular floor, the wall, and a 300 mm fold-over that clips over the rim.`}
        />
        <dl className="catalogue-spec-list">
          {[
            ["SKU", liner.sku],
            ["Material", `${liner.gsm} gsm PVC`],
            ["Colour", "Blue or black, same price"],
            ["Fits tank diameter", `${liner.diameterM} m`],
            ["Fits tank height", `${liner.heightM.toFixed(2)} m (${liner.rows} rows of corrugated sheet)`],
            ["Tank volume", `About ${Math.round(liner.volumeKl)} kL`],
            ["Liner area", `About ${liner.linerAreaM2} m², floor and walls with a 300 mm fold-over`],
            ["Lead time", PVC_LINER_MANUFACTURE_LABEL],
          ].map(([label, value]) => (
            <div key={label} className="catalogue-spec-list__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </SiteSection>

      <SiteSection aria-labelledby="pvc-included-heading">
        <div className="pvc-shop__columns">
          <div>
            <h2 id="pvc-included-heading" className="pvc-shop__heading">
              What you get
            </h2>
            <ul className="pvc-shop__list">
              <li>One made-up PVC liner: floor and walls welded to this tank size.</li>
              <li>A 300 mm fold-over at the top, to clip over the tank rim.</li>
              <li>{PVC_LINER_MANUFACTURE_LABEL}, then delivered to your address.</li>
            </ul>
          </div>
          <div>
            <h2 className="pvc-shop__heading">Not included</h2>
            <ul className="pvc-shop__list">
              <li>Installation. Damtech can quote this separately.</li>
              <li>The steel tank, fittings, roof or base preparation.</li>
            </ul>
            <p>
              <Link href="/returns/" className="text-water hover:underline">
                Returns and cancellation policy
              </Link>
            </p>
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="muted">
        <RelatedPageLinks links={relatedLinks} />
      </SiteSection>
    </>
  );
}
