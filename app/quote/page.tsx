import Link from "next/link";
import { Hero } from "@/components/Hero";

import { PageSeo } from "@/components/PageSeo";

import { QuoteTrustPanel } from "@/components/QuoteTrustPanel";

import { SiteSection } from "@/components/SiteSection";

import { createPageMetadata, PAGE_SEO } from "@/lib/pages";

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



      <SiteSection>

        <div className="site-quote-grid">

          <FormSection

            title="Request Your Free Quote"

            subtitle="Tell us about your project and we'll respond within one business day."

            sourcePage="/quote"

            id="quote-form"

          />

          <QuoteTrustPanel />

        </div>

      </SiteSection>



      <SiteSection tone="muted">

        <p className="site-overview__intro max-w-3xl">

          Not sure about dimensions or storage needs?{" "}

          <Link href="/calculators" className="text-water hover:underline">

            Use Damtech&apos;s calculators

          </Link>{" "}

          to estimate dam lining area, steel water tank size or waterproofing material

          before you submit your quote request.

        </p>

      </SiteSection>



      <InternalServiceLinks currentPath={seo.path} />

      <CTA

        title="Need help choosing a service?"

        description="Browse our dam lining, steel tank and waterproofing pages, then submit your quote request when you are ready."

      />

    </>

  );

}

