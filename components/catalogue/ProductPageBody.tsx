import Link from "next/link";
import { AddToRfqControl } from "@/components/catalogue/AddToRfqControl";
import { CatalogueProductCard } from "@/components/catalogue/CatalogueProductCard";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";
import {
  ServiceFaqSection,
  RelatedPageLinks,
} from "@/components/ServicePageSections";
import {
  getPageGalleryImages,
  getRelatedCatalogueProducts,
  isUnresolvedFact,
  type CatalogueProduct,
} from "@/lib/catalogue";

const COMMERCIAL_LINKS = [
  { href: "/contact/", label: "Contact Damtech" },
  { href: "/privacy/", label: "Privacy policy" },
  { href: "/terms/", label: "Terms of sale" },
  { href: "/returns/", label: "Returns and cancellation" },
  { href: "/faq/", label: "Warranty and terms FAQ" },
] as const;

const FALLBACK_RELATED_LINKS = [
  {
    href: "/steel-water-storage-tanks/#popular-tank-sizes",
    label: "Compare all tank sizes and prices",
  },
  {
    href: "/calculators/#steel-tank-size",
    label: "Use the tank size calculator",
  },
  { href: "/quote/", label: "Request an invoice or quote" },
  { href: "/contact/", label: "Contact Damtech" },
] as const;

export function ProductPageBody({ product }: { product: CatalogueProduct }) {
  const related = getRelatedCatalogueProducts(product);
  const gallery = getPageGalleryImages(product.images);
  const inclusions = isUnresolvedFact(product.inclusions)
    ? null
    : product.inclusions;
  const relatedLinks = product.relatedPageLinks ?? FALLBACK_RELATED_LINKS;
  const invoiceAnchor = `#request-invoice-${product.sku}`;
  const calculatorCta = product.secondaryCta ?? {
    href: "/calculators/#steel-tank-size",
    label: "Use the tank size calculator",
  };

  return (
    <>
      <SiteSection>
        <div className="catalogue-product">
          <div className="catalogue-product__media">
            <ProductGallery productName={product.name} images={gallery} />
          </div>
          <AddToRfqControl product={product} />
        </div>
      </SiteSection>

      <SiteSection tone="muted">
        <PageSectionHeader
          id="product-description"
          eyebrow="PRODUCT"
          title={product.bodyHeading ?? "About this supply-only kit"}
          intro={product.description}
        />
        {product.bodyCopy ? (
          <p className="catalogue-prose">{product.bodyCopy}</p>
        ) : null}
        <p className="catalogue-note catalogue-note--emphasis">
          {product.supplyNotice}
        </p>
        {product.supportingSections?.map((section) => (
          <PageSectionHeader
            key={section.heading}
            title={section.heading}
            intro={section.copy}
          />
        ))}
      </SiteSection>

      <SiteSection>
        <PageSectionHeader
          id="specifications"
          eyebrow="SPECIFICATIONS"
          title="Product specifications"
        />
        <dl className="catalogue-spec-list">
          {product.specifications.map((spec) => (
            <div key={spec.label} className="catalogue-spec-list__row">
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>
      </SiteSection>

      <SiteSection tone="muted">
        <div className="catalogue-split">
          <div>
            <PageSectionHeader
              id="inclusions"
              eyebrow="KIT"
              title="Verified kit inclusions"
            />
            {inclusions ? (
              <ul className="catalogue-list">
                {inclusions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>
                Kit accessories for this SKU are confirmed on the invoice.
                Unpublished fittings and liner details are not listed here.
              </p>
            )}
          </div>
          <div>
            <PageSectionHeader
              id="exclusions"
              eyebrow="NOT INCLUDED"
              title="Explicit exclusions"
            />
            <ul className="catalogue-list">
              {product.exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="catalogue-note">Transport and installation excluded.</p>
          </div>
        </div>
      </SiteSection>

      {product.applications?.length ? (
        <SiteSection>
          <PageSectionHeader
            id="applications"
            eyebrow="USE"
            title="Recommended applications"
          />
          <ul className="catalogue-app-grid">
            {product.applications.map((application) => (
              <li key={application} className="catalogue-app-card">
                {application}
              </li>
            ))}
          </ul>
        </SiteSection>
      ) : null}

      {product.sitePreparation ? (
        <SiteSection tone="muted">
          <PageSectionHeader
            id="site-preparation"
            eyebrow="SITE"
            title="Site and base preparation"
            intro={product.sitePreparation}
          />
        </SiteSection>
      ) : null}

      <SiteSection>
        <PageSectionHeader
          id="delivery"
          eyebrow="DELIVERY"
          title="Delivery and invoice process"
          intro={product.deliveryExplanation}
        />
        <PageSectionHeader
          id="warranty"
          eyebrow="WARRANTY"
          title="Warranty"
          intro={product.warranty}
        />
        <PageSectionHeader
          id="commercial-terms"
          eyebrow="TERMS"
          title="Refunds, returns and contact"
          intro="Order this kit online for collection or customer-arranged transport at the advertised VAT-inclusive price. Damtech then sends a tax invoice separately. This website does not take card payments. Refunds, returns and payment terms are confirmed on that invoice. Damtech-arranged transport and installation remain custom-quote items."
        />
        <ul className="catalogue-list">
          {COMMERCIAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-water hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </SiteSection>

      {related.length ? (
        <SiteSection tone="muted">
          <PageSectionHeader
            id="related-products"
            eyebrow="RELATED"
            title={product.relatedHeading ?? "Related tank sizes"}
            intro="Other fixed-price supply-only kits from the Damtech catalogue."
          />
          <div className="catalogue-card-grid catalogue-card-grid--ponds">
            {related.map((item) => (
              <CatalogueProductCard key={item.sku} product={item} />
            ))}
          </div>
        </SiteSection>
      ) : null}

      <ServiceFaqSection
        faqs={[...product.faqs]}
        heading="Product questions"
        intro="Answers that match the details on this page."
      />

      <SiteSection>
        <PageSectionHeader
          id="request-invoice"
          eyebrow="RFQ"
          title="Request an invoice"
          intro="Need installation, modified fittings or Damtech-arranged transport? Request a custom quote. Ordering the standard kit is a separate Place order flow."
        />
        <div className="catalogue-secondary-actions">
          <a href={invoiceAnchor} className="btn-primary catalogue-cta">
            {product.ctaLabel}
          </a>
          <Link href={calculatorCta.href} className="btn-secondary catalogue-cta">
            {calculatorCta.label}
          </Link>
        </div>
      </SiteSection>

      <SiteSection tone="muted">
        <RelatedPageLinks links={[...relatedLinks]} />
      </SiteSection>
    </>
  );
}
