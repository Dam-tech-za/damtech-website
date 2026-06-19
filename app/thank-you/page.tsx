import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata } from "@/lib/pages";
import { phoneTel, siteConfig } from "@/lib/site";

const seo = {
  title: "Thank You | Damtech",
  description:
    "Thank you for contacting Damtech. We have received your enquiry and will be in touch shortly regarding your dam liner, tank or waterproofing project.",
  path: "/thank-you",
  h1: "Thank You",
  image: "/images/damtech-dam-liners-water-storage-solutions.webp",
  noIndex: true,
};

export const metadata = createPageMetadata(seo);

export default function ThankYouPage() {
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
        title={seo.h1}
        description="Your enquiry has been received. A member of the Damtech team will review your project details and contact you soon."
      />

      <section className="content-wrap max-w-2xl">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-lg font-medium text-navy">
            We appreciate you reaching out.
          </p>
          <p className="mt-3 text-slate-600">
            For urgent enquiries, call{" "}
            <a href={`tel:${phoneTel}`} className="font-semibold text-water">
              {siteConfig.phone}
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
            <Link href="/dam-liners" className="btn-secondary">
              Explore Dam Liners
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
