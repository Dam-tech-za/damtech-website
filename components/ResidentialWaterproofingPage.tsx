import Link from "next/link";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { SectionCta } from "@/components/SectionCta";
import { SiteSection } from "@/components/SiteSection";
import {
  RelatedPageLinks,
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import {
  createFaqPageSchema,
  createOfficeLocalBusinessSchemas,
  createServiceSchema,
} from "@/lib/seo";
import {
  RESIDENTIAL_PROCESS_STEPS,
  residentialQuoteHref,
  type ResidentialPageConfig,
} from "@/lib/residential-waterproofing";
import { WARRANTY_PUBLIC } from "@/lib/warranty";
import { phoneTel, siteConfig, whatsAppUrl } from "@/lib/site";

const WARRANTY_SUMMARY = `${WARRANTY_PUBLIC.bullets[0]}, plus ${WARRANTY_PUBLIC.bullets[1]
  .charAt(0)
  .toLowerCase()}${WARRANTY_PUBLIC.bullets[1].slice(1)}.`;

export function ResidentialWaterproofingPage({
  page,
}: {
  page: ResidentialPageConfig;
}) {
  const quoteHref = residentialQuoteHref(page.quoteService);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Waterproofing", path: "/waterproofing" },
    { name: page.breadcrumbLabel ?? page.h1, path: `/${page.slug}` },
  ];

  const schemas = [
    ...page.serviceTypes.map((serviceType) =>
      createServiceSchema({
        name: serviceType,
        serviceType,
        description: page.description,
        path: `/${page.slug}`,
        areaServed: page.areaServed,
      }),
    ),
    createFaqPageSchema(page.faqs),
    ...(page.officeIds
      ? createOfficeLocalBusinessSchemas({
          officeIds: page.officeIds,
          areaServedOverride: page.areaServed,
        })
      : []),
  ];

  const process = page.process ?? RESIDENTIAL_PROCESS_STEPS;

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} schemas={schemas} />

      <Hero
        tone="blue"
        eyebrow={page.heroEyebrow}
        title={page.h1}
        description={page.heroDescription}
        breadcrumbs={breadcrumbs}
        aside={
          <ResidentialEnquiryCard
            areaServed={page.areaServed}
            quoteHref={quoteHref}
          />
        }
      >
        <Link href={quoteHref} className="hero-btn-primary w-full sm:w-auto">
          Request a free assessment
        </Link>
        <a
          href={whatsAppUrl}
          className="hero-btn-secondary w-full sm:w-auto"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp photos of the problem
        </a>
      </Hero>

      {page.intro ? (
        <SiteSection>
          <p className="site-overview__intro max-w-3xl">{page.intro}</p>
        </SiteSection>
      ) : null}

      <ServiceProseSections sections={page.sections} />

      {page.comparison ? (
        <SiteSection tone="muted">
          <ComparisonTable
            title={page.comparison.title}
            columns={page.comparison.columns}
            rows={page.comparison.rows}
          />
          {page.comparison.note ? (
            <p className="mt-4 max-w-3xl text-sm text-slate-600">
              {page.comparison.note}
            </p>
          ) : null}
        </SiteSection>
      ) : null}

      <ProcessStepsSection
        steps={process}
        title="How our process works"
        intro={
          page.processIntro ??
          "From the first photo to the written quote, you know what we found and what we recommend before any work starts."
        }
      />

      <SiteSection>
        <SectionCta
          title={page.ctaTitle ?? "Book a free assessment"}
          description={
            page.ctaDescription ??
            `Tell us about the leak or damp problem and we will arrange a free assessment and written quote. ${WARRANTY_SUMMARY}`
          }
          primaryHref={quoteHref}
          primaryLabel="Request a written quote"
          secondaryHref="/contact/"
          secondaryLabel="Call or email Damtech"
        />
      </SiteSection>

      <ServiceFaqSection
        faqs={page.faqs}
        heading="FAQs"
        intro="Straight answers for homeowners. Dam lining and steel tanks are quoted separately."
      />

      <SiteSection>
        <RelatedPageLinks heading="Related services" links={page.related} />
      </SiteSection>
    </>
  );
}

/** Hero side panel: the three ways to start a residential enquiry. */
export function ResidentialEnquiryCard({
  areaServed,
  quoteHref,
}: {
  areaServed: string;
  quoteHref: string;
}) {
  return (
    <div className="dt-enquiry-card">
      <p className="dt-enquiry-card__label">Free assessment · written quote</p>
      <p className="dt-enquiry-card__areas">
        <span className="dt-enquiry-card__areas-label">Areas we serve</span>
        {areaServed}
      </p>
      <ul className="dt-enquiry-card__list">
        <li>
          <a href={`tel:${phoneTel}`} className="dt-enquiry-card__row">
            <span>Call</span>
            <strong>{siteConfig.phone}</strong>
          </a>
        </li>
        <li>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dt-enquiry-card__row"
          >
            <span>WhatsApp</span>
            <strong>Send photos</strong>
          </a>
        </li>
        <li>
          <Link href={quoteHref} className="dt-enquiry-card__row">
            <span>Online</span>
            <strong>Quote form</strong>
          </Link>
        </li>
      </ul>
    </div>
  );
}
