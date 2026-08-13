import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const path = "/returns";

export const metadata = createMetadata({
  title: "Returns and Cancellation | Damtech",
  description:
    "Returns, cancellation and refund terms for Damtech supply-only steel reservoir kit orders.",
  path,
});

export default function ReturnsPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Returns and cancellation", path },
        ]}
      />
      <Hero
        compact
        eyebrow="Legal"
        title="Returns and cancellation"
        description="How to cancel a catalogue order or request a return before or after the invoice is issued."
      />
      <SiteSection>
        <div className="catalogue-prose space-y-4">
          <p>
            Catalogue kits are made to order. Cancellation and return rights
            depend on whether fabrication has started and whether the invoice
            has been paid.
          </p>
          <h2>Before the invoice is paid</h2>
          <p>
            Contact Damtech with your order reference if you need to cancel or
            change quantity. We will confirm in writing. No payment should be
            made until you receive the official invoice.
          </p>
          <h2>After payment</h2>
          <p>
            Refunds, returns and restocking conditions are confirmed in writing
            on the Damtech invoice. Standard supply-only kits that have not been
            fabricated or dispatched are reviewed case by case. Custom
            fabrication, liners cut to size and installed work are not freely
            returnable.
          </p>
          <h2>Damaged or incorrect goods</h2>
          <p>
            Report shortages or transport damage as soon as the kit is collected
            or received, with photographs and your order reference. Damtech will
            assess replacement or credit under the invoice terms.
          </p>
          <p>
            Contact: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>{" "}
            · {siteConfig.phone}. Quote your order reference.
          </p>
        </div>
      </SiteSection>
    </>
  );
}
