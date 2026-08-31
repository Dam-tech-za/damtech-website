import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { shortIncidentRef } from "@/lib/rfq/submission-result";
import { phoneTel, siteConfig, whatsAppUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order received via backup channel | Damtech",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ incident?: string }>;
};

export default async function OrderFallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const incident = params.incident?.trim() || "your incident reference";

  return (
    <>
      <Hero
        compact
        eyebrow="Backup channel"
        title="Your order request was delivered through our backup channel"
        description="We could not record your order in the catalogue system, but DamTech has received the details by email. A formal order reference and invoice will follow."
      />
      <SiteSection>
        <p>
          Please keep this incident reference:{" "}
          <strong>{incident.length === 36 ? shortIncidentRef(incident) : incident}</strong>
        </p>
        <p>
          This is not an order number. Please do not submit the form again.
        </p>
        <p>
          For urgent enquiries, call{" "}
          <a href={`tel:${phoneTel}`}>{siteConfig.phone}</a>, email{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>, or{" "}
          <a href={whatsAppUrl}>WhatsApp DamTech</a>.
        </p>
        <p>
          <Link href="/steel-water-storage-tanks/">Return to the catalogue</Link>
        </p>
      </SiteSection>
    </>
  );
}
