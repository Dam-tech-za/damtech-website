import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";
import { HomeFinalCtaSection } from "@/components/HomeFinalCtaSection";
import { HomeHero } from "@/components/HomeHero";
import { HomeProcessProjectsSection } from "@/components/HomeProcessProjectsSection";
import { HomeServicesSection } from "@/components/HomeServicesSection";
import { HomeTrustWarrantySection } from "@/components/HomeTrustWarrantySection";
import { HomeWhyChooseSection } from "@/components/HomeWhyChooseSection";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";

export const metadata = createPageMetadata(PAGE_SEO.home);

export default function HomePage() {
  return (
    <>
      <PageSeo breadcrumbs={[{ name: "Home", path: "/" }]} />

      <HomeHero />

      <p className="dt-band">
        <Link href="/waterproofing/" className="dt-band__link">
          Leaking roof or damp walls? We waterproof homes too
          <ArrowRightIcon className="dt-band__icon" aria-hidden />
        </Link>
      </p>

      <HomeTrustWarrantySection />

      <HomeServicesSection />

      <HomeProcessProjectsSection />

      <HomeWhyChooseSection />

      <HomeFinalCtaSection />
    </>
  );
}
