import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { PvcLinerShopSection } from "@/components/shop/PvcLinerShopSection";
import {
  formatZarWholeInclVat,
  getFishPondProducts,
  getWaterStorageProducts,
} from "@/lib/catalogue";
import {
  RESERVOIR_PRIMARY_IMAGE,
  SHALLOW_BASIN_PRIMARY_IMAGE,
} from "@/lib/catalogue/images";
import { createMetadata } from "@/lib/seo";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import {
  cheapestPvcLinerInclVat,
  PVC_LINER_COLOUR_IMAGES,
  PVC_LINER_PAGE_PATH,
} from "@/lib/shop/pvc-liners";

const PATH = "/shop";

export const metadata = createMetadata({
  title: "Shop Steel Water Tanks, Fish Ponds & PVC Liners",
  description:
    "Buy Damtech corrugated steel reservoir kits, fish pond tanks and made-to-order PVC tank liners. Prices in rand including VAT, delivered in South Africa.",
  path: PATH,
});

export default function ShopPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: PATH },
  ];
  const tanks = getWaterStorageProducts();
  const ponds = getFishPondProducts();
  const cheapest = (prices: number[]) => Math.min(...prices);

  const categories = [
    {
      id: "reservoirs",
      title: "Steel reservoirs",
      price: `From ${formatZarWholeInclVat(cheapest(tanks.map((p) => p.priceInclVatZar)))}`,
      text: "Corrugated steel water tank kits with a PVC liner, from 10 000 L to 100 000 L. Supply-only, fixed prices.",
      href: "/steel-water-storage-tanks/#popular-tank-sizes",
      link: "View reservoir sizes and prices",
      image: RESERVOIR_PRIMARY_IMAGE,
    },
    {
      id: "fish-tanks",
      title: "Fish ponds and aquaculture tanks",
      price: `From ${formatZarWholeInclVat(cheapest(ponds.map((p) => p.priceInclVatZar)))}`,
      text: "Shallow corrugated steel pond kits with a PVC liner for fish farming and ornamental ponds.",
      href: "/steel-water-storage-tanks/#fish-ponds-aquaculture",
      link: "View fish pond kits",
      image: SHALLOW_BASIN_PRIMARY_IMAGE,
    },
    {
      id: "pvc-liners",
      title: "PVC tank liners",
      price: `From ${formatZarExactAmount(cheapestPvcLinerInclVat())} incl. VAT`,
      text: "Made-to-order blue or black liners for 3 m to 17 m steel tanks, in 550 gsm or 800 gsm. Pay online.",
      href: PVC_LINER_PAGE_PATH,
      link: "Choose a liner",
      image: PVC_LINER_COLOUR_IMAGES.blue,
    },
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} />
      <Hero
        compact
        eyebrow="Shop"
        title="Damtech shop"
        description="Steel reservoir kits, fish pond tanks and PVC tank liners with prices in rand, including VAT. For dam linings, waterproofing or installation, request a quote."
        breadcrumbs={breadcrumbs}
        showActions={false}
      />

      <SiteSection aria-labelledby="shop-categories-heading">
        <PageSectionHeader id="shop-categories-heading" eyebrow="PRODUCTS" title="What would you like to buy?" />
        <div className="shop-grid">
          {categories.map((c) => (
            <Link key={c.id} href={c.href} className="shop-card">
              <div className="shop-card__media">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 768px) 26rem, 100vw" />
              </div>
              <div className="shop-card__body">
                <h3 className="shop-card__title">{c.title}</h3>
                <p className="shop-card__price">{c.price}</p>
                <p className="shop-card__text">{c.text}</p>
                <span className="shop-card__link">{c.link}</span>
              </div>
            </Link>
          ))}
        </div>
      </SiteSection>

      <PvcLinerShopSection tone="muted" />
    </>
  );
}
