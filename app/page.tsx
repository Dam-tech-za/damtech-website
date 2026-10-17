import Link from "next/link";
import { HomeTrustWarrantySection } from "@/components/HomeTrustWarrantySection";
import { HomeServicesSection } from "@/components/HomeServicesSection";
import { HomeProcessProjectsSection } from "@/components/HomeProcessProjectsSection";
import { HomeWhyChooseSection } from "@/components/HomeWhyChooseSection";
import { HomeHero } from "@/components/HomeHero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { LazyHomeFinalCtaSection as HomeFinalCtaSection } from "@/components/lazy";

export const metadata = createPageMetadata(PAGE_SEO.home);

export default function HomePage() {
  return (
    <>
      <PageSeo breadcrumbs={[{ name: "Home", path: "/" }]} />

      <HomeHero />

      <p className="border-b bg-white px-4 py-3 text-center text-sm sm:text-base">
        <Link href="/waterproofing/" className="link-row font-semibold">
          Leaking roof or damp walls? We waterproof homes too
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
