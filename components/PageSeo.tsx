import { SEOJsonLd } from "@/components/SEOJsonLd";
import type { BreadcrumbItem } from "@/lib/seo";
import { createBreadcrumbSchema } from "@/lib/seo";

type PageSeoProps = {
  breadcrumbs: BreadcrumbItem[];
  schemas?: Record<string, unknown> | Record<string, unknown>[];
};

export function PageSeo({ breadcrumbs, schemas }: PageSeoProps) {
  const data = [
    createBreadcrumbSchema(breadcrumbs),
    ...(schemas
      ? Array.isArray(schemas)
        ? schemas
        : [schemas]
      : []),
  ];

  return <SEOJsonLd data={data} />;
}
