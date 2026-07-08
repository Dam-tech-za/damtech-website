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

      <HomeTrustWarrantySection />

      <HomeServicesSection />

      <HomeProcessProjectsSection />

      <HomeWhyChooseSection />

      <HomeFinalCtaSection />
    </>
  );
}
