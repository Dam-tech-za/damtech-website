import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const path = "/terms";

export const metadata = createMetadata({
  title: "Terms of Sale | Damtech",
  description:
    "Terms for Damtech fixed-price supply-only steel reservoir kits, invoice payment and delivery.",
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
            Catalogue prices are VAT-inclusive for the supply-only kit. Delivery
            and installation are excluded unless Damtech quotes them separately.
          </p>
          <h2>Orders and invoices</h2>
          <p>
            Placing an order records the kit, quantity, customer details and
            delivery address. It does not take payment. Damtech sends a tax
            invoice separately. Payment must be made only using the banking
            details on that invoice.
          </p>
          <h2>Fulfilment</h2>
          <p>
            Catalogue kits are delivery only throughout South Africa. DamTech
            does not offer customer collection and does not provide a public
            collection point. DamTech will confirm the delivery charge on the
            formal invoice. Delivery is never added as a hidden amount to the
            online kit total.
          </p>
          <h2>Availability and lead times</h2>
          <p>
            Kits are made to order and available to order. Manufacturing takes
            5–10 business days after cleared payment. Estimated delivery takes a
            further 3–5 business days after manufacturing is complete. Estimated
            total fulfilment time is 8–15 business days after cleared payment.
          </p>
          <h2>Custom work</h2>
          <p>
            Installation, modified fittings, non-standard sizes and unusual
            delivery requirements remain quotation items. Use the custom-quote
            form for that work.
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
