import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { phoneTel, siteConfig } from "@/lib/site";
import {
  LazyCTA as CTA,
  LazyFormSection as FormSection,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";

const seo = PAGE_SEO.quote;

export const metadata = createPageMetadata(seo);

export default function QuotePage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Request a Free Quote", path: seo.path },
        ]}
      />

      <Hero
        compact
        eyebrow="Free quote"
        title={seo.h1}
        description="Share your project details and our team will recommend a practical dam lining, tank or waterproofing solution with a tailored quote."
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Request a Free Quote", path: seo.path },
        ]}
      />

      <section className="content-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <FormSection
            title="Request Your Free Quote"
            subtitle="Tell us about your project and we'll respond within one business day."
            sourcePage="/quote"
            id="quote-form"
          />

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
              <h3 className="text-lg font-semibold text-navy">What to include</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Dam or tank dimensions (or approximate surface area)</li>
                <li>Current condition — new build, leak repair or re-lining</li>
                <li>Intended use — livestock, irrigation, mining or domestic</li>
                <li>Site access and preferred installation timeframe</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm">
              <h3 className="font-semibold text-navy">Prefer to talk?</h3>
              <p className="mt-2 text-slate-600">
                Call{" "}
                <a href={`tel:${phoneTel}`} className="font-semibold text-water">
                  {siteConfig.phone}
                </a>{" "}
                or email{" "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="font-semibold text-water"
                >
                  {siteConfig.email}
                </a>
                .
              </p>
              <Link href="/contact" className="btn-secondary mt-4 inline-flex text-sm">
                Contact page
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Need help choosing a service?"
        description="Browse our dam lining, steel tank and waterproofing pages, then submit your quote request when you are ready."
      />
    </>
  );
}
