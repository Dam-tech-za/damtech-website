import { Hero } from "@/components/Hero";
import { LegalSupplierDetails } from "@/components/LegalSupplierDetails";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
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
            {LEGAL_ENTITY.legalName} (“Damtech”, “we”) is the responsible party
            under the Protection of Personal Information Act 4 of 2013 (POPIA).
            We use personal information to respond to enquiries, prepare
            invoices and process catalogue orders. We do not sell personal
            information.
          </p>
          <LegalSupplierDetails heading="Who we are" headingId="who-we-are" />
          <h2>What we collect</h2>
          <p>
            Depending on the form you submit, this may include your name,
            business name, email address, phone number, billing address,
            delivery address, VAT number, purchase-order number and project
            notes. Catalogue orders also store the SKU, quantity and price
            snapshot for that order. When you send an enquiry we also store
            the first page and campaign tags that brought you to the form, so
            we can see how the enquiry reached us.
          </p>
          <h2>How we use it</h2>
          <p>
            We use this information to confirm orders, send invoices, arrange
            delivery, answer RFQs and keep records required for South African
            tax and consumer law. That processing is needed to take steps at
            your request, to perform the supply contract, and to meet legal
            duties. Order confirmation emails are sent through our email
            provider. Hosting and database providers store the records so our
            team can fulfil the work.
          </p>
          <h2>How long we keep it</h2>
          <p>
            Enquiry and order records are kept while we complete the work and
            for as long as South African tax and consumer law requires. Tax
            invoices and the records that support them are kept for at least
            five years from the end of the relevant tax year. After that we
            delete or de-identify the information unless a dispute, warranty
            claim or legal duty requires a longer hold.
          </p>
          <h2>Analytics</h2>
          <p>
            This website uses Google Tag Manager, Google Analytics and the
            Meta Pixel to measure visits and advertising. Those tools may set
            cookies or similar identifiers and receive your IP address and
            page URL. We do not use them to collect card numbers or banking
            details.
          </p>
          <h2>What we do not collect online</h2>
          <p>
            We do not collect card numbers or banking credentials through this
            website. Payment is made against the official Damtech invoice using
            the banking details shown on that invoice.
          </p>
          <h2>Your rights</h2>
          <p>
            Under POPIA you may ask us for access to the personal information
            we hold about you, ask us to correct it, object to our processing,
            or ask us to delete it where no legal duty requires us to keep it.
            To do that, email{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or
            call {siteConfig.phone}. If you are not satisfied, you may complain
            to the Information Regulator (South Africa) at{" "}
            <a
              href="https://inforegulator.org.za/"
              target="_blank"
              rel="noopener noreferrer"
            >
              inforegulator.org.za
            </a>
            .
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
