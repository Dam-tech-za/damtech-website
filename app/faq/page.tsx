import { Hero } from "@/components/Hero";
import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";
import { PageSeo } from "@/components/PageSeo";
import { ServiceProseSections } from "@/components/ServicePageSections";
import { SiteSection } from "@/components/SiteSection";
import { createFaqPageSchema } from "@/lib/seo";
import { createPageMetadata, FAQ_ITEMS, PAGE_SEO, SEO_FAQ_ITEMS } from "@/lib/pages";
import { FAQ_PAGE_CONTENT } from "@/lib/service-pages-content";
import { siteConfig } from "@/lib/site";
import {
  LazyCTA as CTA,
  LazyFAQ as FAQ,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";

const seo = PAGE_SEO.faq;

const ALL_FAQS = [...FAQ_ITEMS, ...SEO_FAQ_ITEMS, ...FAQ_PAGE_CONTENT.extraFaqs];

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
        schemas={createFaqPageSchema(ALL_FAQS)}
      />

      <Hero
        compact
        eyebrow="Dam linings · Tanks · Waterproofing"
        title={seo.h1}
        description={`Answers about our waterproofing services, dam linings and steel water tanks. Call us on ${siteConfig.phone} if you need more help.`}
        breadcrumbs={[...FAQ_BREADCRUMBS]}
      />

      <SiteSection>
        <p className="site-overview__intro">{FAQ_PAGE_CONTENT.intro}</p>
      </SiteSection>

      <ServiceProseSections sections={FAQ_PAGE_CONTENT.sections} />

      <RelatedServicesGrid
        links={RELATED_SERVICE_LINKS}
        heading="Explore Damtech Services"
        intro="Find practical information on dam linings, waterproofing, steel water tanks and maintenance for your property."
        excludeHref="/faq"
      />

      <FAQ
        items={ALL_FAQS}
        heading="Common Questions"
        eyebrow="FAQ"
        intro="Straight answers about dam linings, steel water tanks and bitumen waterproofing."
        tone="muted"
      />

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Still Have Questions?"
        description="Our team can walk you through dam lining thickness, tank sizing or waterproofing options for your site."
      />
    </>
  );
}
