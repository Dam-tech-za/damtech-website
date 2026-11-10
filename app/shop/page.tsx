import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { CatalogueProductGrid } from "@/components/catalogue/CatalogueProductGrid";
import { PvcLinerSizeTable } from "@/components/shop/PvcLinerSizeTable";
import { PvcLinerShopSection } from "@/components/shop/PvcLinerShopSection";
import {
  catalogueProductUrlPath,
  formatJsonLdPrice,
  formatZarWholeInclVat,
  getFishPondProducts,
  getLivestockTroughProducts,
  getSchemaImageUrls,
  getWaterStorageProducts,
} from "@/lib/catalogue";
import {
  RESERVOIR_PRIMARY_IMAGE,
  SHALLOW_BASIN_PRIMARY_IMAGE,
} from "@/lib/catalogue/images";
import { createItemListSchema, createMetadata } from "@/lib/seo";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import {
  cheapestPvcLinerInclVat,
  PVC_LINER_COLOUR_IMAGES,
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
  const troughs = getLivestockTroughProducts();
  const kits = [...tanks, ...ponds, ...troughs];
  const cheapest = (prices: number[]) => Math.min(...prices);

  const categories = [
    {
      id: "reservoirs",
      title: "Steel reservoirs",
      price: `From ${formatZarWholeInclVat(cheapest(tanks.map((p) => p.priceInclVatZar)))}`,
      text: "Corrugated steel water tank kits with a PVC liner, from 10 000 L to 100 000 L. Supply-only, fixed prices.",
      href: "#popular-tank-sizes",
      link: "Shop reservoir kits",
      image: RESERVOIR_PRIMARY_IMAGE,
    },
    {
      id: "fish-tanks",
      title: "Fish ponds and aquaculture tanks",
      price: `From ${formatZarWholeInclVat(cheapest(ponds.map((p) => p.priceInclVatZar)))}`,
      text: "Shallow corrugated steel pond kits with a PVC liner for fish farming and ornamental ponds.",
      href: "#fish-ponds-aquaculture",
      link: "Shop fish pond kits",
      image: SHALLOW_BASIN_PRIMARY_IMAGE,
    },
    {
      id: "pvc-liners",
      title: "PVC tank liners",
      price: `From ${formatZarExactAmount(cheapestPvcLinerInclVat())} incl. VAT`,
      text: "Made-to-order blue or black liners for 3 m to 17 m steel tanks, in 550 gsm or 800 gsm. Pay online.",
      href: "#pvc-tank-liners",
      link: "Shop PVC liners",
      image: PVC_LINER_COLOUR_IMAGES.blue,
    },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createItemListSchema(
            kits.map((product) => ({
              name: product.name,
              path: catalogueProductUrlPath(product),
              description: product.seoDescription,
              sku: product.sku,
              priceInclVatZar: formatJsonLdPrice(product.priceInclVatZar),
              imageUrls: getSchemaImageUrls(product.images),
            })),
            "Damtech steel water tank, fish pond and livestock trough kits",
          ),
        ]}
      />
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
            <a key={c.id} href={c.href} className="shop-card">
              <div className="shop-card__media">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 768px) 26rem, 100vw" />
              </div>
              <div className="shop-card__body">
                <h3 className="shop-card__title">{c.title}</h3>
                <p className="shop-card__price">{c.price}</p>
                <p className="shop-card__text">{c.text}</p>
                <span className="shop-card__link">{c.link}</span>
              </div>
            </a>
          ))}
        </div>
      </SiteSection>

      <CatalogueProductGrid
        id="popular-tank-sizes"
        eyebrow="PRICES INCL. VAT"
        title="Steel Water Tank Kits"
        intro="Four fixed-price, supply-only corrugated steel water tank kits. Each price includes 15% VAT. Transport and installation excluded."
        products={tanks}
        variant="tanks"
        tone="muted"
      >
        <div className="catalogue-secondary-actions">
          <Link className="btn-secondary catalogue-cta" href="/steel-water-storage-tanks/">
            Larger tanks and installation
          </Link>
          <Link className="btn-secondary catalogue-cta" href="/calculators/#steel-tank-size">
            Use the tank size calculator
          </Link>
        </div>
      </CatalogueProductGrid>

      <CatalogueProductGrid
        id="fish-ponds-aquaculture"
        eyebrow="AQUACULTURE"
        title="Fish Ponds and Aquaculture Tanks"
        intro="Fixed-price supply-only fish pond kits. VAT included. Transport, installation, filtration, pumps and aeration excluded."
        products={ponds}
        variant="ponds"
      />

      <CatalogueProductGrid
        id="livestock-watering"
        eyebrow="LIVESTOCK"
        title="Livestock Watering"
        intro="Round livestock and cattle water trough. VAT included. Transport, installation, pipework and float valves excluded."
        products={troughs}
        variant="troughs"
        tone="muted"
      />

      <PvcLinerShopSection title="PVC tank liners" />

      <SiteSection tone="muted" aria-labelledby="pvc-all-sizes-heading">
        <PageSectionHeader
          id="pvc-all-sizes-heading"
          eyebrow="ALL LINERS"
          title="All PVC tank liner sizes and prices"
          intro="Every liner has its own product page. Select a price to open it."
        />
        <PvcLinerSizeTable />
      </SiteSection>
    </>
  );
}
