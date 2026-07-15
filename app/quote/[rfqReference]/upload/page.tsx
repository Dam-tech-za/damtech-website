import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { RfqUploadClient } from "@/components/RfqUploadClient";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";

export const metadata: Metadata = {
  title: "Upload RFQ documents | Damtech",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ rfqReference: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function QuoteUploadPage({
  params,
  searchParams,
}: PageProps) {
  const { rfqReference } = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const hash = createHash("sha256").update(token, "utf8").digest("hex");
  const service = createServiceRoleClient();
  const { data: rfq } = await service
    .from("rfqs")
    .select("id, rfq_number, public_upload_token_expires_at")
    .eq("rfq_number", decodeURIComponent(rfqReference))
    .eq("public_upload_token_hash", hash)
    .maybeSingle();

  if (!rfq) notFound();
  if (
    rfq.public_upload_token_expires_at &&
    new Date(rfq.public_upload_token_expires_at) < new Date()
  ) {
    notFound();
  }

  return (
    <>
      <Hero
        compact
        eyebrow="Secure upload"
        title={`Upload files for ${rfq.rfq_number}`}
        description="JPG, PNG, WEBP or PDF. Files are stored privately for Damtech only."
      />
      <SiteSection>
        <RfqUploadClient rfqId={rfq.id} token={token} rfqNumber={rfq.rfq_number} />
      </SiteSection>
    </>
  );
}
