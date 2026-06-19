import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { LeadForm } from "@/components/LeadForm";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata } from "@/lib/pages";
import { phoneTel, siteConfig } from "@/lib/site";

const seo = {
  title: "Request a Quote | Damtech Dam Liners & Water Storage",
  description:
    "Request a free quote for HDPE dam liners, steel water tanks, bitumen waterproofing or reservoir repair. Tell us about your project and we will respond promptly.",
  path: "/quote",
  h1: "Request a Free Quote",
  image: "/images/hdpe-dam-liner-farm-water-storage.webp",
};

export const metadata = createPageMetadata(seo);

export default function QuotePage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Request a Quote", path: seo.path },
        ]}
      />

      <Hero
        compact
        title={seo.h1}
        description="Share your project details and our team will recommend a practical lining, tank or waterproofing solution with a tailored quote."
      />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-navy">Project Enquiry Form</h2>
            <p className="mt-2 text-sm text-slate-600">
              Fields marked with <span className="text-red-600">*</span> are
              required. We typically respond within one business day.
            </p>
            <div className="mt-6">
              <LeadForm sourcePage="/quote" submitLabel="Request My Quote" />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-navy">What to include</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Dam or tank dimensions (or approximate surface area)</li>
                <li>Current condition — new build, leak repair or re-lining</li>
                <li>Intended use — livestock, irrigation, mining or domestic</li>
                <li>Site access and preferred installation timeframe</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm">
              <h2 className="font-semibold text-navy">Prefer to talk?</h2>
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
        description="Browse our dam liner, steel tank and waterproofing pages, then submit your quote request when you are ready."
      />
    </>
  );
}
