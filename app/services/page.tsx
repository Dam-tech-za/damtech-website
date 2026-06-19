import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceCard } from "@/components/ServiceCard";
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
  SERVICES_PROCESS_STEPS,
} from "@/lib/service-pages-content";
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
        description="HDPE and PVC dam liners, corrugated steel water tanks, reservoir lining, leaking dam repair and bitumen waterproofing for farms, mines and commercial properties across South Africa."
        showActions
      />

      <section className="content-wrap">
        <p className="max-w-3xl text-lg leading-relaxed text-slate-700">
          {SERVICES_HUB_CONTENT.intro}
        </p>
        <div className="mt-8">
          <SectionCta
            title="Request a Free Quote"
            description="Tell us about your dam, tank or waterproofing project — we typically respond within one business day."
            primaryLabel="Request a Free Quote"
          />
        </div>
      </section>

      <TrustStrip />

      <section className="bg-slate-50">
        <div className="content-wrap">
          <SectionHeading id="our-services" className="!mt-0">
            Our Services
          </SectionHeading>
          <div className="mt-8 content-grid-3">
            {SERVICES_OVERVIEW_CARDS.map((card) => (
              <ServiceCard key={card.href} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <SectionHeading id="how-we-work">How We Work</SectionHeading>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SERVICES_PROCESS_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-water text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <ProjectProofStrip title="Recent projects" projects={PROJECTS.slice(0, 4)} />
        </div>
      </section>

      <section className="content-wrap">
        <ServiceFaqSection faqs={SERVICES_HUB_CONTENT.faqs} />
        <div className="mt-12">
          <RelatedPageLinks
            heading="Explore our services"
            links={[
              { href: "/dam-liners", label: "Dam Liners" },
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
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Need help choosing a service?"
        description="Call us or submit our quote form with photos and approximate dimensions — we will recommend the right liner, tank or waterproofing system."
      />
    </>
  );
}
