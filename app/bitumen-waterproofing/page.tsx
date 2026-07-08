import { ComparisonTable } from "@/components/ComparisonTable";
import { Hero } from "@/components/Hero";
import { BenefitCardGrid } from "@/components/BenefitCardGrid";
import { InfoCardGrid } from "@/components/InfoCardGrid";
import { PageOverviewSection } from "@/components/PageOverviewSection";
import { PageSeo } from "@/components/PageSeo";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import { SiteSection } from "@/components/SiteSection";
import {
  RelatedPageLinks,
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import { DropletIcon } from "@/components/icons/StrokeIcons";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";
import { BITUMEN_CONTENT, BITUMEN_SCHEMA_OFFERS } from "@/lib/service-pages-content";

const seo = PAGE_SEO.bitumen;

export const metadata = createPageMetadata(seo);

const APPLICATIONS = [
  "Roofs (cement slabs and metal roofs)",
  "Foundations and basements",
  "Retaining walls",
  "Ponds and reservoirs",
  "Agricultural packhouses and stores",
  "Parapets, flashings and roof outlets",
] as const;

const BITUMEN_BENEFITS = [
  "Free site inspection",
  "Supplier-backed materials from leading local suppliers",
  "Expert advice at no cost",
  "Certified installation technicians",
  "Premium bitumen materials",
  "Competitive, transparent pricing",
] as const;

const SYSTEM_CARDS = [
  {
    id: "torch-on",
    title: "Torch-On Membranes",
    description:
      "Heated and applied directly to the primed surface using a torch, creating a strong seamless bond — the standard for flat concrete roofs and many reservoir repairs in South Africa.",
    Icon: DropletIcon,
  },
  {
    id: "self-adhesive",
    title: "Self-Adhesive Membranes",
    description:
      "Pre-applied adhesive backing for faster installation without open flame — useful on confined sites, parapet details and areas where hot work is restricted.",
    Icon: DropletIcon,
  },
  {
    id: "coatings",
    title: "Bitumen Coatings",
    description:
      "Liquid coatings applied with brushes or rollers for corners, pipe penetrations and irregular surfaces before wider membrane sheets are laid.",
    Icon: DropletIcon,
  },
] as const;

export default function BitumenWaterproofingPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Waterproofing", path: seo.path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createServiceSchema({
            name: seo.serviceName ?? seo.title,
            serviceType: seo.serviceName ?? "Bitumen Waterproofing",
            description: seo.description,
            path: seo.path,
            offers: [...BITUMEN_SCHEMA_OFFERS],
          }),
          createFaqPageSchema(BITUMEN_CONTENT.faqs),
        ]}
      />

      <Hero
        compact
        eyebrow="Roofs · Foundations · Reservoirs"
        title={seo.h1}
        description="Damtech offers bitumen torch-on waterproofing, leak prevention and maintenance waterproofing services for water-retaining structures and commercial properties across South Africa."
        breadcrumbs={breadcrumbs}
      />

      <PageOverviewSection intro={BITUMEN_CONTENT.intro} image={SITE_IMAGES.bitumen}>
        <ServiceProseSections
          sections={[BITUMEN_CONTENT.sections[0]!]}
          nested
          tone="default"
        />
      </PageOverviewSection>

      <BenefitCardGrid
        items={APPLICATIONS}
        heading="Common Applications"
        eyebrow="WHERE IT WORKS"
        intro="Bitumen waterproofing for roofs, foundations, retaining structures and water-retaining applications."
        tone="default"
      />

      <SiteSection tone="muted">
        <ComparisonTable
          title="Compare bitumen systems"
          columns={[
            { key: "system", label: "System" },
            { key: "application", label: "Application" },
            { key: "bestFor", label: "Best for" },
          ]}
          rows={[
            {
              system: "Torch-on membrane",
              application: "Heat-welded sheets on primed surfaces",
              bestFor: "Flat roofs, reservoirs, large areas",
            },
            {
              system: "Self-adhesive membrane",
              application: "Peel-and-stick without open flame",
              bestFor: "Confined sites, parapets, detail zones",
            },
            {
              system: "Liquid bitumen coating",
              application: "Brush or roller applied",
              bestFor: "Corners, pipes, irregular shapes",
            },
          ]}
        />
      </SiteSection>

      <InfoCardGrid
        items={SYSTEM_CARDS}
        heading="Waterproofing System Options"
        eyebrow="SYSTEM OPTIONS"
        intro="Torch-on, self-adhesive and liquid bitumen systems for leak prevention and long-term waterproofing."
      />

      <ServiceProseSections sections={BITUMEN_CONTENT.sections.slice(1)} />

      <BenefitCardGrid
        items={BITUMEN_BENEFITS}
        heading="Why Damtech is Your Best Choice"
        eyebrow="WHY DAMTECH"
        tone="default"
      />

      <SiteSection tone="muted">
        <SectionCta
          title="Book a free roof or dam inspection"
          description="We assess leaks, failed paint systems and membrane condition before quoting repair or overlay work."
        />
      </SiteSection>

      <ProcessStepsSection />

      <ProjectProofStrip
        title="Bitumen lining projects"
        projects={[
          {
            href: "/projects/hoedspruit-bitumen-dam-lining",
            location: "Hoedspruit",
            detail: "Bitumen torch-on dam lining — 9,240 m²",
          },
        ]}
      />

      <ServiceFaqSection faqs={BITUMEN_CONTENT.faqs} />

      <SiteSection tone="muted">
        <RelatedPageLinks links={BITUMEN_CONTENT.relatedLinks} />
      </SiteSection>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Get In Touch"
        description="Leaking roof or damp walls? Tell us about the structure and we will recommend a practical bitumen repair or overlay."
      />
    </>
  );
}
