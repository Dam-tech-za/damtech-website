import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import { ServiceOverviewGrid } from "@/components/ServiceOverviewGrid";
import { SiteSection } from "@/components/SiteSection";
import { TrustStrip } from "@/components/TrustStrip";
import {
  RelatedPageLinks,
  ServiceFaqSection,
} from "@/components/ServicePageSections";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import {
  SERVICES_HUB_CONTENT,
  SERVICES_HUB_SCHEMA_OFFERS,
  SERVICES_OVERVIEW_CARDS,
} from "@/lib/service-pages-content";
import { PROJECTS } from "@/lib/site";

const seo = PAGE_SEO.services;

export const metadata = createPageMetadata(seo);

export default function ServicesPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: seo.path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createServiceSchema({
            name: seo.serviceName ?? seo.title,
            serviceType: "Dam Lining and Water Storage Services",
            description: seo.description,
            path: seo.path,
            offers: [...SERVICES_HUB_SCHEMA_OFFERS],
          }),
          createFaqPageSchema(SERVICES_HUB_CONTENT.faqs),
        ]}
      />

      <Hero
        compact
        eyebrow="Nationwide contractor"
        title={seo.h1}
        description="HDPE and PVC dam linings, corrugated steel water tanks, reservoir lining, leaking dam repair and bitumen waterproofing for farms, mines and commercial properties across South Africa."
        showActions
        breadcrumbs={breadcrumbs}
      />

      <SiteSection>
        <p className="site-overview__intro">{SERVICES_HUB_CONTENT.intro}</p>
        <div className="mt-8">
          <SectionCta
            title="Request a Free Quote"
            description="Tell us about your dam, tank or waterproofing project — we typically respond within one business day."
            primaryLabel="Request a Free Quote"
          />
        </div>
      </SiteSection>

      <TrustStrip />

      <ServiceOverviewGrid
        items={SERVICES_OVERVIEW_CARDS}
        heading="Our Services"
        eyebrow="WHAT WE OFFER"
        intro="Dam linings, steel water tanks, waterproofing, reservoir lining and maintenance for farms, mines and commercial properties."
      />

      <ProcessStepsSection />

      <ProjectProofStrip title="Recent projects" projects={PROJECTS.slice(0, 4)} />

      <ServiceFaqSection
        faqs={SERVICES_HUB_CONTENT.faqs}
        intro="Practical answers about dam linings, steel water tanks and waterproofing services."
      />

      <SiteSection tone="muted">
        <RelatedPageLinks
          heading="Explore our services"
          eyebrow="RELATED PAGES"
          intro="Browse dam linings, waterproofing, steel water tanks, projects and quote options."
          links={[
            { href: "/dam-liners", label: "Dam Linings" },
            { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
            { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
            { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
            { href: "/dam-repair-services", label: "Leaking Dam Repair" },
            { href: "/reservoir-lining", label: "Reservoir Lining" },
            { href: "/projects", label: "Project Case Studies" },
            { href: "/quote", label: "Request a Quote" },
            { href: "/contact", label: "Contact Damtech" },
          ]}
        />
      </SiteSection>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Need help choosing a service?"
        description="Call us or submit our quote form with photos and approximate dimensions — we will recommend the right liner, tank or waterproofing system."
      />
    </>
  );
}
