import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ViewItemAnalytics } from "@/components/catalogue/CatalogueAnalytics";
import { ProductPageBody } from "@/components/catalogue/ProductPageBody";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import {
  CATALOGUE_CATEGORY_PATH,
  catalogueProductUrlPath,
  formatJsonLdPrice,
  formatZarWholeInclVat,
  getCatalogueProductBySlug,
  getCatalogueSlugs,
  getOgImageAsset,
  getSchemaImageUrls,
} from "@/lib/catalogue";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import {
  createFaqPageSchema,
  createProductSchema,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalogueSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = getCatalogueProductBySlug(slug);
  if (!product) return {};

  const ogImage = getOgImageAsset(product.images);

  return createPageMetadata(
    {
      title: product.seoTitle,
      description: product.seoDescription,
      path: catalogueProductUrlPath(product),
      h1: product.h1,
      image: ogImage?.src,
    },
    ogImage ? { imageAlt: ogImage.alt } : undefined,
  );
}

export default async function CatalogueProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getCatalogueProductBySlug(slug);
  if (!product) notFound();

  const path = catalogueProductUrlPath(product);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Steel Water Tanks", path: CATALOGUE_CATEGORY_PATH },
    { name: product.name, path },
  ];
  const schemaImages = getSchemaImageUrls(product.images);

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createProductSchema({
            name: product.name,
            description: product.seoDescription,
            path,
            sku: product.sku,
            priceInclVatZar: formatJsonLdPrice(product.priceInclVatZar),
            imageUrls: schemaImages,
          }),
          createFaqPageSchema(product.faqs),
        ]}
      />
      <ViewItemAnalytics product={product} />
      <Hero
        compact
        eyebrow={`${product.sku} · ${formatZarWholeInclVat(product.priceInclVatZar)}`}
        title={product.h1}
        description={`${product.heroCopy} ${product.supplyNotice}`}
        breadcrumbs={breadcrumbs}
        showActions={false}
      />
      <ProductPageBody product={product} />
      {product.categoryId === "corrugated-steel-water-tanks" ? (
        <InternalServiceLinks currentPath={PAGE_SEO["steel-tanks"].path} />
      ) : null}
      <CTA
        title={
          product.categoryId === "fish-ponds-and-aquaculture-tanks"
            ? "Need a different pond size?"
            : product.categoryId === "livestock-water-troughs"
              ? "Need farm water storage as well?"
              : "Need a different tank size?"
        }
        description={
          product.categoryId === "fish-ponds-and-aquaculture-tanks"
            ? "Compare the 10 000L and 15 000L fish pond kits. Larger containment can be quoted on request. Filtration and aeration are specified separately."
            : product.categoryId === "livestock-water-troughs"
              ? "Pair this cattle water trough with a steel tank kit or estimate livestock demand with the annual water calculator."
              : "Compare the fixed-price kits or use the tank size calculator. Larger reservoirs remain available on request."
        }
      />
    </>
  );
}
