import Link from "next/link";
import { Hero } from "@/components/Hero";
import { InfoCardGrid } from "@/components/InfoCardGrid";
import { PageSeo } from "@/components/PageSeo";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import { SiteSection } from "@/components/SiteSection";
import {
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import {
  DropletIcon,
  LayersIcon,
  ReservoirIcon,
  WrenchIcon,
} from "@/components/icons/StrokeIcons";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SERVICES_HUB_CONTENT, SERVICES_HUB_SCHEMA_OFFERS } from "@/lib/service-pages-content";
import { PROJECTS } from "@/lib/site";

const seo = PAGE_SEO.services;

export const metadata = createPageMetadata(seo);

const LEGACY_SERVICE_CARDS = [
  {
    id: "waterproofing",
    title: "Waterproofing",
    description:
      "Bitumen torch-on waterproofing for metal roofs, foundations, chimneys and concrete slabs.",
    href: "/bitumen-waterproofing",
    cta: "Waterproofing services",
    Icon: DropletIcon,
  },
  {
    id: "dam-linings",
    title: "Dam Linings",
    description:
      "HDPE, PVC and bitumen torch-on dam linings for farm dams, mining ponds and reservoirs.",
    href: "/dam-liners",
    cta: "Dam linings",
    Icon: LayersIcon,
  },
  {
    id: "steel-tanks",
    title: "Corrugated Steel Reservoirs",
    description:
      "Galvanised steel water tanks from 11 kL to 500 kL+ with PVC lining and optional roofs.",
    href: "/steel-water-storage-tanks",
    cta: "Steel water tanks",
    Icon: ReservoirIcon,
  },
  {
    id: "maintenance",
    title: "Maintenance & Leak Repair",
    description:
      "Leaking roofs, damp seepage, preventative maintenance and free inspections where applicable.",
    href: "/dam-repair-services",
    cta: "Repair services",
    Icon: WrenchIcon,
  },
] as const;

export default function LegacyServicesPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Services", path: seo.path },
        ]}
        schemas={[
          createServiceSchema({
            name: seo.serviceName ?? seo.title,
            serviceType: seo.serviceName ?? "Dam Linings, Water Tanks & Waterproofing",
            description: seo.description,
            path: seo.path,
            offers: [...SERVICES_HUB_SCHEMA_OFFERS],
          }),
          createFaqPageSchema(SERVICES_HUB_CONTENT.faqs),
        ]}
      />

      <Hero
        compact
        eyebrow="Full-service contractor"
        title={seo.h1}
        description="Full water storage and protection services: HDPE dam linings, corrugated steel tanks, bitumen waterproofing, leak repair and preventative maintenance."
      />

      <SiteSection>
        <p className="site-overview__intro">{SERVICES_HUB_CONTENT.intro}</p>
      </SiteSection>

      <InfoCardGrid
        items={LEGACY_SERVICE_CARDS}
        heading="Damtech Services"
        eyebrow="WHAT WE OFFER"
        intro="Dam linings, waterproofing, steel water tanks and maintenance for farms, mines and commercial properties."
      />

      <ServiceProseSections sections={SERVICES_HUB_CONTENT.sections} />

      <ProcessStepsSection />

      <SiteSection>
        <SectionCta />
      </SiteSection>

      <ProjectProofStrip title="Selected installations" projects={PROJECTS.slice(0, 3)} />

      <ServiceFaqSection faqs={SERVICES_HUB_CONTENT.faqs} />

      <SiteSection tone="muted">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/quote" className="btn-primary w-full sm:w-auto">
            Request a Quote
          </Link>
          <Link href="/faq" className="btn-secondary w-full sm:w-auto">
            Read the FAQ
          </Link>
          <Link href="/projects" className="btn-secondary w-full sm:w-auto">
            View Projects
          </Link>
        </div>
      </SiteSection>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA />
    </>
  );
}
