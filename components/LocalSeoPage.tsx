import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import type { LocalLandingPage } from "@/lib/local-pages";
import { LOCAL_PAGE_LINKS } from "@/lib/local-pages";

type LocalSeoPageProps = {
  page: LocalLandingPage;
};

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

      <Hero compact title={page.h1} description={page.heroDescription} />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-slate-700">{page.intro}</p>

            <div>
              <h2 className="section-heading">Use Case</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">{page.useCase}</p>
            </div>

            <div>
              <h2 className="section-heading">Terrain &amp; Site Conditions</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">{page.terrain}</p>
            </div>

            <div>
              <h2 className="section-heading">Industries We Serve</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">{page.industry}</p>
            </div>

            <div>
              <h2 className="section-heading">Water Storage Needs</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">{page.waterNeed}</p>
            </div>

            <div>
              <h2 className="section-heading">Relevant Damtech Services</h2>
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

        <div className="mt-16">
          <h2 className="section-heading">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-4">
            {page.faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <summary className="cursor-pointer font-semibold text-navy">
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
          <h2 className="section-heading">Related Pages</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {LOCAL_PAGE_LINKS.map((link) => (
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
