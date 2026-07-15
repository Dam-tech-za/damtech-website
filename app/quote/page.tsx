import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { QuoteTrustPanel } from "@/components/QuoteTrustPanel";
import { SiteSection } from "@/components/SiteSection";
import { SimpleQuoteForm } from "@/components/SimpleQuoteForm";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import {
  LazyCTA as CTA,
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
        description="Share your project details — exact measurements are not required. We typically respond within one business day."
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Request a Free Quote", path: seo.path },
        ]}
      />

      <SiteSection>
        <div className="site-quote-grid">
          <SimpleQuoteForm sourcePage="/quote" />
          <QuoteTrustPanel />
        </div>
      </SiteSection>

      <SiteSection tone="muted">
        <p className="site-overview__intro max-w-3xl">
          Prefer a detailed, multi-step quote with company and site details?{" "}
          <Link
            href="/calculators/#project-budget"
            className="text-water hover:underline"
          >
            Use Quote Preparation
          </Link>{" "}
          on the calculators page.
        </p>
      </SiteSection>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Need help choosing a service?"
        description="Browse dam lining, steel tank and waterproofing pages, then return here to submit your quote request."
      />
    </>
  );
}
