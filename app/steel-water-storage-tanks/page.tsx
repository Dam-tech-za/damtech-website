import { SectionHeading } from "@/components/SectionHeading";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <h3 className="subsection-heading border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
        {title}
      </h3>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2 font-medium">Volume</th>
            <th className="px-4 py-2 font-medium">Diameter</th>
            <th className="px-4 py-2 font-medium">Height</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="border-t border-slate-100">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-2 text-slate-700">
                  {cell}
                </td>
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
        description="Corrugated galvanised steel water tanks from 11 kL to 500 kL+, supplied with PVC lining. Built for farms, game reserves, mines and rural water storage."
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-relaxed text-slate-700">
              {STEEL_TANKS_CONTENT.intro}
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              We specialise in delivering high-quality, durable water storage
              solutions tailored to your needs. Our tanks are crafted from 0.8 mm
              thick corrugated hot dip galvanised steel sheets, available from 3 m
              to 17 m in diameter. Each tank includes a standard 850 gsm PVC
              lining, bidem floor sheet, sturdy upright columns, and an optional
              roof for additional protection.
            </p>
          </div>
          <PageImage {...SITE_IMAGES.steelTank} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <ServiceProseSections sections={STEEL_TANKS_CONTENT.sections.slice(0, 2)} />
        </div>
      </section>

      <section className="content-wrap">
        <SectionHeading id="tank-capacity">Tank Capacity Tables</SectionHeading>
        <p className="mt-4 max-w-3xl text-slate-600">
          Select a diameter and ring height to match your daily water demand,
          borehole refill rate and available site footprint. Full schedules are
          available on request for sizes above 500 kL.
        </p>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap space-y-8">
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
      </section>

      <section className="content-wrap">
        <ServiceProseSections sections={STEEL_TANKS_CONTENT.sections.slice(2)} />
        <div className="mt-10">
          <SectionCta
            title="Need help sizing a tank?"
            description="Tell us daily water use, borehole output and site footprint — we will recommend diameter, ring height and optional roof."
          />
        </div>
        <ProjectProofStrip
          title="Steel tank installations"
          projects={PROJECTS.filter((project) => project.detail.includes("Steel"))}
        />
        <div className="mt-12">
          <ServiceFaqSection faqs={STEEL_TANKS_CONTENT.faqs} />
        </div>
        <div className="mt-12">
          <RelatedPageLinks links={STEEL_TANKS_CONTENT.relatedLinks} />
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Need Help Sizing a Reservoir?"
        description="Share your daily water use, pump details and site photos — we will recommend a tank diameter and height that fits."
      />
    </>
  );
}
