import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const path = "/privacy";

export const metadata = createMetadata({
  title: "Privacy Policy | Damtech",
  description:
    "How Damtech collects and uses customer details for quotes, catalogue orders and invoices in South Africa.",
  path,
});

export default function PrivacyPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Privacy policy", path },
        ]}
      />
      <Hero
        compact
        eyebrow="Legal"
        title="Privacy policy"
        description="Damtech collects only the details needed to quote, invoice and fulfil supply-only kit orders."
      />
      <SiteSection>
        <div className="catalogue-prose space-y-4">
          <p>
            Damtech (“we”) uses personal information to respond to enquiries,
            prepare invoices and process catalogue orders. We do not sell
            personal information.
          </p>
          <h2>What we collect</h2>
          <p>
            Depending on the form you submit, this may include your name,
            business name, email address, phone number, billing address, VAT
            number, purchase-order number and project notes. Catalogue orders
            also store the SKU, quantity and price snapshot for that order.
          </p>
          <h2>How we use it</h2>
          <p>
            We use this information to confirm orders, send invoices, arrange
            collection, answer RFQs and keep records required for South African
            tax and consumer law. Order confirmation emails are sent through our
            email provider.
          </p>
          <h2>What we do not collect online</h2>
          <p>
            We do not collect card numbers or banking credentials through this
            website. Payment is made against the official Damtech invoice using
            the banking details shown on that invoice.
          </p>
          <h2>Contact</h2>
          <p>
            Questions about this policy:{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or{" "}
            {siteConfig.phone}.
          </p>
        </div>
      </SiteSection>
    </>
  );
}
