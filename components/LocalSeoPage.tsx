import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import type { LocalLandingPage } from "@/lib/local-pages";

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
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: page.h1, path: `/${page.slug}` },
        ]}
        schemas={[
          createServiceSchema({
            name: page.serviceName,
            description: page.description,
            path: `/${page.slug}`,
          }),
          createFaqPageSchema(page.faqs),
        ]}
      />

      <Hero compact title={page.h1} description={page.heroDescription} eyebrow={page.serviceName} />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-10">
            <p className="text-lg leading-relaxed text-slate-700">{page.intro}</p>

            {CONTENT_SECTIONS.map((section) => (
              <div key={section.key}>
                <h2 className="section-heading">{section.heading}</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  {page[section.key]}
                </p>
              </div>
            ))}

            <div>
              <h2 className="section-heading">Damtech Services in This Area</h2>
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
            alt={page.h1}
            caption="Damtech dam lining and water storage installations."
          />
        </div>

        {page.relatedProjects.length > 0 ? (
          <div className="mt-16">
            <h2 className="section-heading">Related Projects</h2>
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
          <h2 className="section-heading">Frequently Asked Questions</h2>
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
          <h2 className="section-heading">Explore Further</h2>
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
