import { SectionHeading } from "@/components/SectionHeading";
import { ComparisonTable } from "@/components/ComparisonTable";
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
];

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

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-relaxed text-slate-700">
              {BITUMEN_CONTENT.intro}
            </p>
            <ServiceProseSections
              sections={[BITUMEN_CONTENT.sections[0]!]}
              className="mt-10"
            />
          </div>
          <PageImage {...SITE_IMAGES.bitumen} />
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPLICATIONS.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap space-y-10">
          <SectionHeading id="system-options">Waterproofing System Options</SectionHeading>
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
          <div className="content-grid-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="subsection-heading !mt-0">Torch-On Membranes</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Heated and applied directly to the primed surface using a torch,
                creating a strong seamless bond — the standard for flat concrete
                roofs and many reservoir repairs in South Africa.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="subsection-heading !mt-0">Self-Adhesive Membranes</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pre-applied adhesive backing for faster installation without open
                flame — useful on confined sites, parapet details and areas where
                hot work is restricted.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="subsection-heading !mt-0">Bitumen Coatings</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Liquid coatings applied with brushes or rollers for corners, pipe
                penetrations and irregular surfaces before wider membrane sheets
                are laid.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <ServiceProseSections sections={BITUMEN_CONTENT.sections.slice(1)} />

        <SectionHeading id="why-damtech" className="mt-12">
          Why Damtech is Your Best Choice
        </SectionHeading>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Free site inspection",
            "Satisfaction guarantee",
            "Expert advice at no cost",
            "Certified installation technicians",
            "Premium bitumen materials",
            "Competitive, transparent pricing",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <SectionCta
            title="Book a free roof or dam inspection"
            description="We assess leaks, failed paint systems and membrane condition before quoting repair or overlay work."
          />
        </div>

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

        <div className="mt-12">
          <ServiceFaqSection faqs={BITUMEN_CONTENT.faqs} />
        </div>
        <div className="mt-12">
          <RelatedPageLinks links={BITUMEN_CONTENT.relatedLinks} />
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Get In Touch"
        description="Leaking roof or damp walls? Tell us about the structure and we will recommend a practical bitumen repair or overlay."
      />
    </>
  );
}
