import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageSeo } from "@/components/PageSeo";
import { ServiceProseSections } from "@/components/ServicePageSections";
import { createFaqPageSchema } from "@/lib/seo";
import { createPageMetadata, FAQ_ITEMS, PAGE_SEO } from "@/lib/pages";
import { FAQ_PAGE_CONTENT } from "@/lib/service-pages-content";
import { siteConfig } from "@/lib/site";

const seo = PAGE_SEO.faq;

const ALL_FAQS = [...FAQ_ITEMS, ...FAQ_PAGE_CONTENT.extraFaqs];

export const metadata = createPageMetadata(seo);

export default function FaqPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: seo.path },
        ]}
        schemas={createFaqPageSchema(ALL_FAQS)}
      />

      <Hero
        compact
        eyebrow="Dam liners · Tanks · Waterproofing"
        title={seo.h1}
        description={`Answers about our waterproofing services, earth dam liners and steel water tanks. Call us on ${siteConfig.phone} if you need more help.`}
      />

      <section className="content-wrap">
        <p className="max-w-3xl text-lg leading-relaxed text-slate-700">
          {FAQ_PAGE_CONTENT.intro}
        </p>

        <div className="mt-12">
          <ServiceProseSections sections={FAQ_PAGE_CONTENT.sections} />
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/dam-liners" className="btn-secondary">
            Dam Liners
          </Link>
          <Link href="/steel-water-storage-tanks" className="btn-secondary">
            Steel Tanks
          </Link>
          <Link href="/bitumen-waterproofing" className="btn-secondary">
            Waterproofing
          </Link>
          <Link href="/quote" className="btn-primary">
            Request a Quote
          </Link>
        </div>

        <h2 className="section-heading mt-16">Common Questions</h2>
        <div className="mt-6 space-y-4">
          {ALL_FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Still Have Questions?"
        description="Our team can walk you through liner thickness, tank sizing or waterproofing options for your site."
      />
    </>
  );
}
