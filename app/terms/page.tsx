import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const path = "/terms";

export const metadata = createMetadata({
  title: "Terms of Sale | Damtech",
  description:
    "Terms for Damtech fixed-price supply-only steel reservoir kits, invoice payment and collection.",
  path,
});

export default function TermsPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Terms", path },
        ]}
      />
      <Hero
        compact
        eyebrow="Legal"
        title="Terms of sale"
        description="These terms apply to fixed-price supply-only catalogue kits ordered on dam-tech.co.za."
      />
      <SiteSection>
        <div className="catalogue-prose space-y-4">
          <p>
            Catalogue prices are VAT-inclusive for the supply-only kit. Transport
            and installation are excluded unless Damtech quotes them separately.
          </p>
          <h2>Orders and invoices</h2>
          <p>
            Placing an order records the kit, quantity and customer details. It
            does not take payment. Damtech sends a tax invoice separately.
            Payment must be made only using the banking details on that invoice.
          </p>
          <h2>Fulfilment</h2>
          <p>
            The advertised kit price is for collection or customer-arranged
            transport. Damtech confirms the collection point on the invoice.
            Damtech-arranged transport is quoted on request and is never added
            as a hidden amount to the online kit total.
          </p>
          <h2>Availability</h2>
          <p>
            Kits are made to order. Damtech confirms availability before or with
            the invoice. These terms do not guarantee stock on the day the order
            is placed.
          </p>
          <h2>Custom work</h2>
          <p>
            Installation, modified fittings, non-standard sizes and Damtech
            transport remain quotation items. Use the custom-quote form for that
            work.
          </p>
          <p>
            Contact: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>{" "}
            · {siteConfig.phone}.
          </p>
        </div>
      </SiteSection>
    </>
  );
}
