import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";
import type { CatalogueProduct } from "@/lib/catalogue";
import { CatalogueProductCard } from "./CatalogueProductCard";

export function CatalogueProductGrid({
  id,
  eyebrow,
  title,
  intro,
  products,
  tone = "default",
  variant = "tanks",
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  products: readonly CatalogueProduct[];
  tone?: "default" | "muted";
  variant?: "tanks" | "ponds" | "troughs";
  children?: React.ReactNode;
}) {
  return (
    <SiteSection tone={tone} aria-labelledby={id}>
      <PageSectionHeader id={id} eyebrow={eyebrow} title={title} intro={intro} />
      <div className={`catalogue-card-grid catalogue-card-grid--${variant}`}>
        {products.map((product) => (
          <CatalogueProductCard key={product.sku} product={product} />
        ))}
      </div>
      {children}
    </SiteSection>
  );
}
