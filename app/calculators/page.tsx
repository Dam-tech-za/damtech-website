import { Hero } from "@/components/Hero";
import { CalculatorsSeoIntro } from "@/components/CalculatorsSeoIntro";
import { CalculatorHeroActions } from "@/components/calculators/CalculatorHeroActions";
import { CalculatorHub } from "@/components/calculators/CalculatorHub";
import { LazyCTA as CTA } from "@/components/lazy";
import { PageSeo } from "@/components/PageSeo";
import { RelatedPageLinks } from "@/components/ServicePageSections";
import { SiteSection } from "@/components/SiteSection";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { createFaqPageSchema, createWebPageSchema } from "@/lib/seo";
import { CALCULATOR_FAQS } from "@/lib/calculators-config";
import { CALCULATORS_RELATED_LINK } from "@/lib/calculator-links";

const seo = PAGE_SEO.calculators;

export const metadata = createPageMetadata(seo);

export default function CalculatorsPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Calculators", path: seo.path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createWebPageSchema({
            name: seo.h1,
            description: seo.description,
            path: seo.path,
          }),
          createFaqPageSchema(CALCULATOR_FAQS),
        ]}
      />

      <Hero
        compact
        eyebrow="DAMTECH CALCULATORS"
        title={seo.h1}
        description="Use these practical tools to estimate dam lining area, waterproofing material, steel water tank sizing and annual water storage requirements before requesting a quote."
        showActions={false}
        breadcrumbs={breadcrumbs}
      >
        <CalculatorHeroActions />
      </Hero>

      <SiteSection>
        <CalculatorsSeoIntro />
        <div className="mt-12">
          <CalculatorHub />
        </div>
      </SiteSection>

      <SiteSection tone="muted">
        <RelatedPageLinks
          heading="Related services"
          eyebrow="EXPLORE DAMTECH"
          intro="Connect your calculator estimate to Damtech's dam linings, waterproofing and water storage services."
          links={[
            { href: "/dam-liners", label: "Dam Linings" },
            { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
            { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
            { href: "/bitumen-waterproofing", label: "Waterproofing" },
            { href: "/dam-repair-services", label: "Leaking Dam Repair" },
            { href: "/reservoir-lining", label: "Reservoir Lining" },
            { href: CALCULATORS_RELATED_LINK.href, label: CALCULATORS_RELATED_LINK.label },
            { href: "/quote", label: "Request a Quote" },
          ]}
        />
      </SiteSection>

      <CTA
        eyebrow="NEED A SITE-SPECIFIC QUOTE?"
        title="Need a Site-Specific Quote?"
        description="Send us your dimensions, location and photos, and Damtech will help confirm the right dam lining, waterproofing or water storage solution."
      />
    </>
  );
}
