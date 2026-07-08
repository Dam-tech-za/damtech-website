import { Hero } from "@/components/Hero";
import { FaqCategoryList } from "@/components/FaqCategoryList";
import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { ALL_SITE_FAQS } from "@/lib/faq-content";
import { createFaqPageSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { siteConfig } from "@/lib/site";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { FAQ_CATEGORIES } from "@/lib/faq-content";

const seo = PAGE_SEO.faq;

const FAQ_BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "FAQ", path: seo.path },
] as const;

export const metadata = createPageMetadata(seo);

export default function FaqPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[...FAQ_BREADCRUMBS]}
        schemas={createFaqPageSchema(ALL_SITE_FAQS)}
      />

      <Hero
        compact
        eyebrow="Dam liners · Dam linings · Tanks · Waterproofing"
        title={seo.h1}
        description={`Answers about dam liners, dam linings, waterproofing and steel water tanks. Call us on ${siteConfig.phone} if you need more help.`}
        breadcrumbs={[...FAQ_BREADCRUMBS]}
      />

      <SiteSection>
        <p className="site-overview__intro">
          Straight answers about dam liners, dam linings, corrugated steel
          reservoirs and bitumen waterproofing — from 30+ years combined industry
          experience on South African farms, mines and commercial properties. If
          your question is not covered below, call us or use the quote form.
        </p>
      </SiteSection>

      <FaqCategoryList categories={FAQ_CATEGORIES} />

      <RelatedServicesGrid
        links={RELATED_SERVICE_LINKS}
        heading="Explore Damtech Services"
        intro="Find practical information on dam linings, waterproofing, steel water tanks and maintenance for your property."
        excludeHref="/faq"
      />

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Still Have Questions?"
        description="Our team can walk you through dam lining thickness, tank sizing or waterproofing options for your site."
      />
    </>
  );
}
