import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { QuoteTrustPanel } from "@/components/QuoteTrustPanel";
import { SiteSection } from "@/components/SiteSection";
import { SimpleQuoteForm } from "@/components/SimpleQuoteForm";
import { resolveCatalogueSelectionFromParams } from "@/lib/catalogue";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { normaliseServiceOption } from "@/lib/form";
import { getPvcLinerBySku } from "@/lib/shop/pvc-liners";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";

const seo = PAGE_SEO.quote;

export const metadata = createPageMetadata(seo);

type QuotePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const params = await searchParams;
  const catalogueLine = resolveCatalogueSelectionFromParams(params);
  const serviceParam = Array.isArray(params.service) ? params.service[0] : params.service;
  const defaultService = serviceParam ? (normaliseServiceOption(serviceParam) ?? "") : "";
  // A PVC liner sent from the shop (too big to buy online): name it in the message.
  const linerParam = Array.isArray(params.liner) ? params.liner[0] : params.liner;
  const quoteLiner = linerParam ? getPvcLinerBySku(linerParam) : null;
  const qtyParam = Math.trunc(Number(Array.isArray(params.qty) ? params.qty[0] : params.qty));
  const linerQty = Number.isFinite(qtyParam) && qtyParam > 0 ? Math.min(qtyParam, 99) : 1;
  const defaultMessage = quoteLiner
    ? `Please quote ${linerQty} x ${quoteLiner.name} (${quoteLiner.sku}), blue or black, delivered to my address. Installation: please say if you need it.`
    : undefined;

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
        showActions={false}
        eyebrow={catalogueLine ? "Invoice request" : "Free quote"}
        title={
          catalogueLine ? "Request an invoice for a supply-only kit" : seo.h1
        }
        description={
          catalogueLine
            ? "Add this fixed-price supply-only kit to your RFQ. Damtech will confirm transport and send an invoice. Transport and installation are excluded."
            : "Share your project details — exact measurements are not required. We typically respond within one business day."
        }
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Request a Free Quote", path: seo.path },
        ]}
      />

      <SiteSection>
        <div className="site-quote-grid">
          <SimpleQuoteForm
            sourcePage="/quote"
            catalogueLine={catalogueLine}
            defaultService={defaultService}
            defaultMessage={defaultMessage}
          />
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
