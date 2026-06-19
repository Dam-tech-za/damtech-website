import { SectionHeading } from "@/components/SectionHeading";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import {
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
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

export default function ServicesPage() {
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
            serviceType: seo.serviceName ?? "Dam Liners, Water Tanks & Waterproofing",
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
        description="Full water storage and protection services: HDPE dam liners, corrugated steel tanks, bitumen waterproofing, leak repair and preventative maintenance."
      />

      <section className="content-wrap">
        <p className="max-w-3xl text-lg leading-relaxed text-slate-700">
          {SERVICES_HUB_CONTENT.intro}
        </p>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap space-y-16">
          <div>
            <SectionHeading id="waterproofing" className="!mt-0">
              Waterproofing
            </SectionHeading>
            {SERVICES_HUB_CONTENT.sections[0]!.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mt-4 max-w-3xl leading-relaxed text-slate-600"
              >
                {paragraph}
              </p>
            ))}
            <ul className="mt-4 flex flex-wrap gap-2">
              {["Metal Roofs", "Foundations", "Chimneys", "Concrete Slabs"].map(
                (item) => (
                  <li
                    key={item}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm text-navy"
                  >
                    {item}
                  </li>
                ),
              )}
            </ul>
            <Link
              href="/bitumen-waterproofing"
              className="btn-secondary mt-6 inline-flex"
            >
              Bitumen Waterproofing
            </Link>
          </div>

          <div>
            <SectionHeading id="dam-liners">Dam Liners</SectionHeading>
            {SERVICES_HUB_CONTENT.sections[1]!.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mt-4 max-w-3xl leading-relaxed text-slate-600"
              >
                {paragraph}
              </p>
            ))}
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>HDPE Geomembrane (2 mm, 1.5 mm and 1 mm)</li>
              <li>PVC Lining (850 gsm, 700 gsm and 550 gsm)</li>
              <li>Bitumen Torch-On (4 mm or 3 mm)</li>
            </ul>
            <Link href="/dam-liners" className="btn-secondary mt-6 inline-flex">
              Dam Liners
            </Link>
          </div>

          <div>
            <SectionHeading id="steel-reservoirs">Corrugated Zinc Reservoirs</SectionHeading>
            {SERVICES_HUB_CONTENT.sections[2]!.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mt-4 max-w-3xl leading-relaxed text-slate-600"
              >
                {paragraph}
              </p>
            ))}
            <Link
              href="/steel-water-storage-tanks"
              className="btn-secondary mt-6 inline-flex"
            >
              Steel Water Tanks
            </Link>
          </div>

          <div>
            <SectionHeading id="maintenance">Maintenance</SectionHeading>
            {SERVICES_HUB_CONTENT.sections[3]!.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mt-4 max-w-3xl leading-relaxed text-slate-600"
              >
                {paragraph}
              </p>
            ))}
            <ul className="mt-4 flex flex-wrap gap-2">
              {[
                "Leaking Roofs",
                "Damp / water seepage",
                "Preventative Maintenance",
                "FREE Inspection",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-green-50 px-3 py-1 text-sm text-navy"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <ServiceProseSections sections={[SERVICES_HUB_CONTENT.sections[4]!]} />
        <div className="mt-10">
          <SectionCta />
        </div>
        <ProjectProofStrip title="Selected installations" projects={PROJECTS.slice(0, 3)} />
        <div className="mt-12">
          <ServiceFaqSection faqs={SERVICES_HUB_CONTENT.faqs} />
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/quote" className="btn-primary w-full sm:w-auto">
            Request a Quote
          </Link>
          <Link href="/waterproofing-and-dam-liners" className="btn-secondary w-full sm:w-auto">
            Read the FAQ
          </Link>
          <Link href="/projects" className="btn-secondary w-full sm:w-auto">
            View Projects
          </Link>
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA />
    </>
  );
}
