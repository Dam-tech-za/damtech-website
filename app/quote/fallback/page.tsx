import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { shortIncidentRef } from "@/lib/rfq/submission-result";
import { phoneTel, siteConfig, whatsAppUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request received via backup channel | Damtech",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ incident?: string }>;
};

export default async function QuoteFallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const incident = params.incident?.trim() || "your incident reference";

  return (
    <>
      <Hero
        compact
        eyebrow="Backup channel"
        title="Your request was delivered through our backup channel"
        description="We could not enter your request into the quotation system, but DamTech has received the details by email. Your formal RFQ reference will follow."
      />
      <SiteSection>
        <p>
          Please keep this incident reference:{" "}
          <strong>{incident.length === 36 ? shortIncidentRef(incident) : incident}</strong>
        </p>
        <p>
          This is not an RFQ number. Please do not submit the form again. We
          will contact you to confirm details and issue a formal reference.
        </p>
        <p>
          For urgent enquiries, call{" "}
          <a href={`tel:${phoneTel}`}>{siteConfig.phone}</a>, email{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>, or{" "}
          <a href={whatsAppUrl}>WhatsApp DamTech</a>.
        </p>
        <p>
          <Link href="/">Return home</Link>
        </p>
      </SiteSection>
    </>
  );
}
