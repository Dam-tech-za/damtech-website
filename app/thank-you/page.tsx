import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { IMAGE_PATHS } from "@/lib/images";
import { createPageMetadata } from "@/lib/pages";
import { shortIncidentRef } from "@/lib/rfq/submission-result";
import { phoneTel, siteConfig, whatsAppUrl } from "@/lib/site";

const seo = {
  title: "Thank You | Damtech",
  description:
    "Thank you for contacting Damtech. We have received your enquiry and will be in touch shortly regarding your dam lining, tank or waterproofing project.",
  path: "/thank-you",
  h1: "Thank You",
  image: IMAGE_PATHS.damtechWaterStorageHero,
  noIndex: true,
};

export const metadata = createPageMetadata(seo);

type PageProps = {
  searchParams: Promise<{ fallback?: string; incident?: string }>;
};

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isFallback = params.fallback === "1";
  const incident = params.incident?.trim();

  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Thank You", path: seo.path },
        ]}
      />

      <Hero
        compact
        showActions={false}
        title={isFallback ? "Request received via backup channel" : seo.h1}
        description={
          isFallback
            ? "We could not enter your enquiry into our quotation system, but DamTech has received it through our backup email channel. Your formal reference will follow."
            : "Your enquiry has been received. Thank you — Damtech has received your enquiry and will contact you shortly."
        }
      />

      <section className="content-wrap max-w-2xl">
        <div
          className={`rounded-2xl border p-8 text-center ${
            isFallback
              ? "border-amber-200 bg-amber-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          {isFallback ? (
            <>
              <p className="text-lg font-medium text-navy">
                Your request was delivered through our backup channel. Please do
                not submit the form again.
              </p>
              {incident ? (
                <p className="mt-3 text-slate-700">
                  Incident reference:{" "}
                  <strong>
                    {incident.length === 36
                      ? shortIncidentRef(incident)
                      : incident}
                  </strong>{" "}
                  (not an RFQ number)
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-lg font-medium text-navy">
              Thank you. Damtech has received your enquiry and will contact you
              shortly.
            </p>
          )}
          <p className="mt-3 text-slate-600">
            For urgent enquiries, call{" "}
            <a href={`tel:${phoneTel}`} className="font-semibold text-water">
              {siteConfig.phone}
            </a>
            , email{" "}
            <a href={`mailto:${siteConfig.email}`} className="font-semibold text-water">
              {siteConfig.email}
            </a>
            , or{" "}
            <a href={whatsAppUrl} className="font-semibold text-water">
              WhatsApp DamTech
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
            <Link href="/dam-liners" className="btn-secondary">
              Explore Dam Linings
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
