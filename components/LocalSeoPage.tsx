import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { FAQ } from "@/components/FAQ";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { SiteSection } from "@/components/SiteSection";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { altForImagePath } from "@/lib/images";
import { DAM_LINERS_SCHEMA_OFFERS } from "@/lib/service-pages-content";
import type { LocalLandingPage } from "@/lib/local-pages";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

type LocalSeoPageProps = {
  page: LocalLandingPage;
};

const CONTENT_SECTIONS: Array<{
  key: keyof Pick<
    LocalLandingPage,
    "climate" | "soil" | "irrigation" | "sectors" | "waterStorage"
  >;
  heading: string;
  eyebrow: string;
}> = [
  { key: "climate", heading: "Climate & Seasonal Rainfall", eyebrow: "LOCAL CONDITIONS" },
  { key: "soil", heading: "Soils & Ground Conditions", eyebrow: "SITE FACTORS" },
  { key: "irrigation", heading: "Irrigation & On-Farm Water Use", eyebrow: "WATER USE" },
  { key: "sectors", heading: "Agriculture, Mining & Industry", eyebrow: "SECTORS" },
  { key: "waterStorage", heading: "Water Storage Needs", eyebrow: "STORAGE" },
];

export function LocalSeoPage({ page }: LocalSeoPageProps) {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: page.h1, path: `/${page.slug}` },
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
            path: `/${page.slug}`,
            offers: [...(page.schemaOffers ?? DAM_LINERS_SCHEMA_OFFERS)],
          }),
          createFaqPageSchema(page.faqs),
        ]}
      />

      <Hero
        compact
        title={page.h1}
        description={page.heroDescription}
        eyebrow={page.serviceName}
        breadcrumbs={breadcrumbs}
      />

      <SiteSection>
        <div className="site-overview">
          <div className="site-overview__content">
            <p className="site-overview__intro">{page.intro}</p>

            <div className="site-prose-sections mt-10">
              {CONTENT_SECTIONS.map((section) => (
                <article key={section.key} className="site-prose-card">
                  <PageSectionHeader
                    eyebrow={section.eyebrow}
                    title={section.heading}
                  />
                  <p className="site-prose-card__text">{page[section.key]}</p>
                </article>
              ))}
            </div>

            <div className="mt-10">
              <PageSectionHeader
                title="Damtech Services in This Area"
                eyebrow="LOCAL SERVICES"
              />
              <ul className="home-why-choose__cards site-card-grid site-card-grid--compact">
                {page.services.map((service) => (
                  <li key={service} className="home-why-choose__card">
                    <p className="home-why-choose__card-text">{service}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="site-overview__media">
            <PageImage
              src={page.image}
              alt={altForImagePath(page.image) || page.h1}
              caption="Damtech dam lining and water storage installations."
            />
          </div>
        </div>
      </SiteSection>

      {page.relatedProjects.length > 0 ? (
        <SiteSection tone="muted">
          <PageSectionHeader
            eyebrow="CASE STUDIES"
            title="Related Projects"
            intro="Dam lining and water storage projects completed by Damtech in similar conditions."
          />
          <ul className="home-why-choose__links">
            {page.relatedProjects.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="home-why-choose__link-card">
                  <span className="home-why-choose__link-label">{link.label}</span>
                  <span className="home-why-choose__link-arrow" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SiteSection>
      ) : null}

      <FAQ
        items={page.faqs}
        heading="Frequently Asked Questions"
        eyebrow="FAQ"
        tone="default"
      />

      {page.relatedLocations.length > 0 ? (
        <SiteSection tone="muted">
          <PageSectionHeader
            eyebrow="MORE REGIONS"
            title="Explore Further"
            intro="Regional dam lining and water storage information for other parts of South Africa."
          />
          <ul className="home-why-choose__links">
            {page.relatedLocations.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="home-why-choose__link-card">
                  <span className="home-why-choose__link-label">{link.label}</span>
                  <span className="home-why-choose__link-arrow" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SiteSection>
      ) : null}

      <RelatedServicesGrid
        links={RELATED_SERVICE_LINKS}
        heading="Related Damtech Services"
        intro="Explore dam linings, waterproofing, steel water tanks and maintenance services available across South Africa."
        excludeHref={`/${page.slug}`}
      />

      <CTA
        title="Request a quote for your area"
        description="Tell us about your dam, tank or waterproofing project and we will recommend a practical solution."
      />
    </>
  );
}
