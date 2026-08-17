import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { SiteSection } from "@/components/SiteSection";
import { MERCHANT_RETURN_POLICY_COPY } from "@/lib/catalogue/merchant-policies";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const path = "/returns";

export const metadata = createMetadata({
  title: "Returns and Cancellation | Damtech",
  description:
    "Damtech accepts returns only for damaged or incorrect catalogue kits. Change-of-mind and correctly supplied made-to-order kits are not returnable.",
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
        description={MERCHANT_RETURN_POLICY_COPY.summary}
      />
      <SiteSection>
        <div className="catalogue-prose space-y-4">
          <p>{MERCHANT_RETURN_POLICY_COPY.summary}</p>
          <h2>Before the invoice is paid</h2>
          <p>{MERCHANT_RETURN_POLICY_COPY.unpaidCancellation}</p>
          <h2>Damaged or incorrect goods</h2>
          <p>{MERCHANT_RETURN_POLICY_COPY.damagedOrWrong}</p>
          <h2>What is not returnable</h2>
          <p>{MERCHANT_RETURN_POLICY_COPY.notReturnable}</p>
          <p>
            {MERCHANT_RETURN_POLICY_COPY.contactIntro}{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>{" "}
            · {siteConfig.phone}. Quote your order reference.
          </p>
        </div>
      </SiteSection>
    </>
  );
}
