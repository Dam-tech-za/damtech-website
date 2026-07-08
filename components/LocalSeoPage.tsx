import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { SectionHeading } from "@/components/SectionHeading";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { altForImagePath } from "@/lib/images";
import { DAM_LINERS_SCHEMA_OFFERS } from "@/lib/service-pages-content";
import type { LocalLandingPage } from "@/lib/local-pages";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

type LocalSeoPageProps = {
  page: LocalLandingPage;
};

const CONTENT_SECTIONS: Array<{
  key: keyof Pick<
    LocalLandingPage,
    "climate" | "soil" | "irrigation" | "sectors" | "waterStorage"
  >;
  heading: string;
}> = [
  { key: "climate", heading: "Climate & Seasonal Rainfall" },
  { key: "soil", heading: "Soils & Ground Conditions" },
  { key: "irrigation", heading: "Irrigation & On-Farm Water Use" },
  { key: "sectors", heading: "Agriculture, Mining & Industry" },
  { key: "waterStorage", heading: "Water Storage Needs" },
];

export function LocalSeoPage({ page }: LocalSeoPageProps) {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: page.h1, path: `/${page.slug}` },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createServiceSchema({
            name: page.serviceName,
            serviceType: page.serviceName,
            description: page.description,
            path: `/${page.slug}`,
            offers: [...(page.schemaOffers ?? DAM_LINERS_SCHEMA_OFFERS)],
          }),
          createFaqPageSchema(page.faqs),
        ]}
      />

      <Hero
        compact
        title={page.h1}
        description={page.heroDescription}
        eyebrow={page.serviceName}
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-10">
            <p className="text-lg leading-relaxed text-slate-700">{page.intro}</p>

            {CONTENT_SECTIONS.map((section) => (
              <div key={section.key}>
                <SectionHeading>{section.heading}</SectionHeading>
                <p className="mt-4 leading-relaxed text-slate-600">
                  {page[section.key]}
                </p>
              </div>
            ))}

            <div>
              <SectionHeading>Damtech Services in This Area</SectionHeading>
              <ul className="mt-4 space-y-2">
                {page.services.map((service) => (
                  <li
                    key={service}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <PageImage
            src={page.image}
            alt={altForImagePath(page.image) || page.h1}
            caption="Damtech dam lining and water storage installations."
          />
        </div>

        {page.relatedProjects.length > 0 ? (
          <div className="mt-16">
            <SectionHeading>Related Projects</SectionHeading>
            <ul className="mt-4 flex flex-wrap gap-3">
              {page.relatedProjects.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-water hover:text-water"
                  >
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-16">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <div className="mt-6 space-y-4">
            {page.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <SectionHeading>Explore Further</SectionHeading>
          <ul className="mt-4 flex flex-wrap gap-3">
            {page.relatedLocations.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-water hover:text-water"
                >
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTA
        title="Request a quote for your area"
        description="Tell us about your dam, tank or waterproofing project and we will recommend a practical solution."
      />
    </>
  );
}
