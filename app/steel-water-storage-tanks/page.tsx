import { Hero } from "@/components/Hero";
import { PageOverviewSection } from "@/components/PageOverviewSection";
import { PageSeo } from "@/components/PageSeo";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import { SiteSection } from "@/components/SiteSection";
import {
  RelatedPageLinks,
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";
import { STEEL_TANKS_CONTENT, STEEL_TANKS_SCHEMA_OFFERS } from "@/lib/service-pages-content";
import { PROJECTS } from "@/lib/site";

const seo = PAGE_SEO["steel-tanks"];

export const metadata = createPageMetadata(seo);

const TWO_RING = [
  ["11 kL", "3 m", "1.55 m"],
  ["20 kL", "4 m", "1.55 m"],
  ["31 kL", "5 m", "1.55 m"],
  ["44 kL", "6 m", "1.55 m"],
  ["60 kL", "7 m", "1.55 m"],
  ["78 kL", "8 m", "1.55 m"],
  ["99 kL", "9 m", "1.55 m"],
  ["122 kL", "10 m", "1.55 m"],
  ["148 kL", "11 m", "1.55 m"],
  ["176 kL", "12 m", "1.55 m"],
  ["206 kL", "13 m", "1.55 m"],
  ["239 kL", "14 m", "1.55 m"],
  ["274 kL", "15 m", "1.55 m"],
  ["312 kL", "16 m", "1.55 m"],
  ["352 kL", "17 m", "1.55 m"],
];

function TankTable({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <div className="site-data-table">
      <h3 className="site-data-table__title">{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Volume</th>
            <th>Diameter</th>
            <th>Height</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SteelTanksPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Steel Water Tanks", path: seo.path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createServiceSchema({
            name: seo.serviceName ?? seo.title,
            serviceType: seo.serviceName ?? "Corrugated Steel Water Tank Installation",
            description: seo.description,
            path: seo.path,
            offers: [...STEEL_TANKS_SCHEMA_OFFERS],
          }),
          createFaqPageSchema(STEEL_TANKS_CONTENT.faqs),
        ]}
      />

      <Hero
        compact
        eyebrow="11 kL – 500 kL+"
        title={seo.h1}
        description="Damtech provides corrugated steel water tanks and reservoirs for farms, mines, estates, game lodges and commercial water storage applications."
        breadcrumbs={breadcrumbs}
      />

      <PageOverviewSection intro={STEEL_TANKS_CONTENT.intro} image={SITE_IMAGES.steelTank}>
        <p className="site-prose-card__text">
          We specialise in delivering high-quality, durable water storage
          solutions tailored to your needs. Our tanks are crafted from 0.8 mm
          thick corrugated hot dip galvanised steel sheets, available from 3 m
          to 17 m in diameter. Each tank includes a standard 850 gsm PVC
          lining, bidem floor sheet, sturdy upright columns, and an optional
          roof for additional protection.
        </p>
      </PageOverviewSection>

      <ServiceProseSections sections={STEEL_TANKS_CONTENT.sections.slice(0, 2)} />

      <SiteSection>
        <PageSectionHeader
          id="tank-capacity"
          eyebrow="CAPACITY GUIDE"
          title="Tank Capacity Tables"
          intro="Select a diameter and ring height to match your daily water demand, borehole refill rate and available site footprint. Full schedules are available on request for sizes above 500 kL."
        />
      </SiteSection>

      <SiteSection tone="muted">
        <div className="site-prose-sections">
          <TankTable title="Two Rings — 1.55 m" rows={TWO_RING} />
          <TankTable
            title="Three Rings — 2.3 m (selected sizes)"
            rows={[
              ["17 kL", "3 m", "2.3 m"],
              ["89 kL", "7 m", "2.3 m"],
              ["181 kL", "10 m", "2.3 m"],
              ["306 kL", "13 m", "2.3 m"],
              ["523 kL", "17 m", "2.3 m"],
            ]}
          />
          <TankTable
            title="Four Rings — 3.05 m (selected sizes)"
            rows={[
              ["22 kL", "3 m", "3.05 m"],
              ["87 kL", "6 m", "3.05 m"],
              ["195 kL", "9 m", "3.05 m"],
              ["470 kL", "14 m", "3.05 m"],
            ]}
          />
          <p className="text-sm text-slate-500">
            Full capacity tables available on request. Sizes up to 500 kL+.
          </p>
        </div>
      </SiteSection>

      <ServiceProseSections sections={STEEL_TANKS_CONTENT.sections.slice(2)} />

      <SiteSection>
        <SectionCta
          title="Need help sizing a tank?"
          description="Tell us daily water use, borehole output and site footprint — we will recommend diameter, ring height and optional roof."
        />
      </SiteSection>

      <ProcessStepsSection />

      <ProjectProofStrip
        title="Steel tank installations"
        projects={PROJECTS.filter((project) => project.detail.includes("Steel"))}
      />

      <ServiceFaqSection faqs={STEEL_TANKS_CONTENT.faqs} />

      <SiteSection tone="muted">
        <RelatedPageLinks links={STEEL_TANKS_CONTENT.relatedLinks} />
      </SiteSection>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Need Help Sizing a Reservoir?"
        description="Share your daily water use, pump details and site photos — we will recommend a tank diameter and height that fits."
      />
    </>
  );
}
