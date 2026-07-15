import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";

export const metadata: Metadata = {
  title: "Quote request received | Damtech",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ ref?: string; upload?: string }>;
};

export default async function QuoteSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rfqNumber = params.ref || "your request";
  const uploadToken = params.upload;
  const showUpload =
    Boolean(uploadToken) &&
    uploadToken !== "spam" &&
    Boolean(params.ref) &&
    params.ref !== "RFQ-RECEIVED";

  return (
    <>
      <Hero
        compact
        eyebrow="Received"
        title="Thank you — your quote request is with Damtech"
        description="We typically respond within one business day. No quotation has been issued yet; our team will confirm details before quoting."
      />
      <SiteSection>
        <p>
          Your reference: <strong>{rfqNumber}</strong>
        </p>
        <p>
          We have emailed a confirmation if you provided an email address. Exact
          site measurements are not required to start — we confirm quantities
          before issuing a quote.
        </p>
        {showUpload ? (
          <p>
            <Link
              className="btn btn--md btn--primary"
              href={`/quote/${encodeURIComponent(params.ref!)}/upload/?token=${encodeURIComponent(uploadToken!)}`}
            >
              Upload photos or drawings
            </Link>
          </p>
        ) : null}
        <p>
          <Link href="/">Return home</Link>
          {" · "}
          <Link href="/calculators/">Browse calculators</Link>
        </p>
      </SiteSection>
    </>
  );
}
