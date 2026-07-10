import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { BenefitCardGrid } from "@/components/BenefitCardGrid";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { ServiceIntroSection } from "@/components/ServiceIntroSection";
import { SiteSection } from "@/components/SiteSection";
import { SpecCardGrid } from "@/components/SpecCardGrid";
import {
  RelatedPageLinks,
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { SITE_IMAGES } from "@/lib/images";
import { getSubServiceIntro } from "@/lib/service-intro-content";
import { PROJECTS } from "@/lib/site";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import type { SubServicePageConfig } from "@/lib/sub-service-pages";

type SubServicePageProps = {
  page: SubServicePageConfig;
};

function imageForPage(page: SubServicePageConfig) {
  if (page.slug === "hdpe-dam-lining") return SITE_IMAGES.damLiners;
  if (page.slug === "torch-on-dam-lining") return SITE_IMAGES.bitumen;
  if (page.slug === "dam-repair-services") return SITE_IMAGES.damRepair;
  if (page.slug === "reservoir-lining") return SITE_IMAGES.reservoir;
  if (page.slug === "pvc-dam-lining") return SITE_IMAGES.damLiners;
  return SITE_IMAGES.contact;
}

export function SubServicePage({ page }: SubServicePageProps) {
  const path = `/${page.slug}`;
  const intro = getSubServiceIntro(page.slug);
  const fallbackImage = imageForPage(page);

  const projects = PROJECTS.filter((project) =>
    page.projectDetailMatch.test(project.detail),
  );

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: page.parent.label, path: page.parent.href },
    { name: page.h1, path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createServiceSchema({
            name: page.serviceName,
            serviceType: page.serviceName,
            description: page.description,
            path,
            offers: [...page.schemaOffers],
          }),
          createFaqPageSchema(page.faqs),
        ]}
      />

      <Hero
        compact
        eyebrow={page.heroEyebrow}
        title={page.h1}
        description={page.heroDescription}
        breadcrumbs={breadcrumbs}
      />

      {intro ? (
        <ServiceIntroSection {...intro} />
      ) : (
        <ServiceIntroSection
          eyebrow={page.serviceName.toUpperCase()}
          heading={page.h1}
          description={page.intro}
          cards={page.benefits.slice(0, 3).map((benefit) => ({
            title: page.serviceName,
            description: benefit,
          }))}
          primaryCta={{
            label: page.sectionCtaTitle ?? `Request a ${page.serviceName} Quote`,
            href: "/quote",
          }}
          secondaryCta={{
            label: "View Dam Linings Overview",
            href: "/dam-liners",
          }}
          image={fallbackImage.image}
          imageAlt={fallbackImage.alt}
          imageCaption={fallbackImage.caption}
          benefitChips={page.benefits.slice(3, 6).map((benefit) => ({
            title: "Benefit",
            description: benefit,
          }))}
        />
      )}

      {page.supportImages && page.supportImages.length > 0 ? (
        <SiteSection tone="muted">
          <ul className="grid gap-4 sm:grid-cols-2">
            {page.supportImages.map((item) => (
              <li key={item.path}>
                <PageImage
                  src={item.path}
                  alt={item.alt}
                  caption={item.caption}
                />
              </li>
            ))}
          </ul>
        </SiteSection>
      ) : null}

      <BenefitCardGrid
        items={page.benefits}
        heading="Key Benefits"
        eyebrow="WHY IT MATTERS"
      />

      <SpecCardGrid
        specs={page.specs}
        heading={page.specsHeading ?? "Specifications"}
        eyebrow="TECHNICAL DETAIL"
      />

      <ServiceProseSections sections={page.sections} />

      <ProcessStepsSection />

      {projects.length > 0 ? (
        <ProjectProofStrip
          title={`${page.serviceName} projects`}
          projects={projects}
        />
      ) : null}

      <ServiceFaqSection faqs={page.faqs} />

      <SiteSection tone="muted">
        <RelatedPageLinks links={page.relatedLinks} />
        <p className="mt-8 text-sm text-slate-600">
          Compare all lining types on our{" "}
          <Link
            href="/dam-liners"
            className="font-medium text-water hover:text-navy"
          >
            dam linings overview
          </Link>
          .
        </p>
      </SiteSection>

      <InternalServiceLinks currentPath={path} />
      <CTA title={page.ctaTitle} description={page.ctaDescription} />
    </>
  );
}
