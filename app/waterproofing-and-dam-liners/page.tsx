import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageSeo } from "@/components/PageSeo";
import { createFaqPageSchema } from "@/lib/seo";
import { createPageMetadata, FAQ_ITEMS, PAGE_SEO } from "@/lib/pages";
import { siteConfig } from "@/lib/site";

const seo = PAGE_SEO.faq;

export const metadata = createPageMetadata(seo);

export default function FaqPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: seo.path },
        ]}
        schemas={createFaqPageSchema(FAQ_ITEMS)}
      />

      <Hero
        compact
        title={seo.h1}
        description={`Answers about our waterproofing services, earth dam liners and steel water tanks. Call us on ${siteConfig.phone} if you need more help.`}
      />

      <section className="content-wrap">
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
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
      <CTA />
    </>
  );
}
