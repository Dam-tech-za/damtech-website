import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { FAQ } from "@/components/FAQ";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/icons/StrokeIcons";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { SiteSection } from "@/components/SiteSection";
import { createFaqPageSchema, createOfficeLocalBusinessSchemas, createServiceSchema } from "@/lib/seo";
import { altForImagePath } from "@/lib/images";
import { DAM_LINERS_SCHEMA_OFFERS } from "@/lib/service-pages-content";
import type { LocalLandingPage } from "@/lib/local-pages";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";
import { SITEMAP_LASTMOD } from "@/lib/sitemap-lastmod.generated";
import {
  HEAD_OFFICE,
  phoneTel,
} from "@/lib/site";
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

const PLAN_LINKS = [
  {
    href: "/hdpe-dam-lining",
    label: "HDPE dam lining",
    note: " for large earth dams, mine and effluent dams.",
  },
  {
    href: "/pvc-dam-lining",
    label: "PVC dam lining",
    note: " for ponds, steel tanks and smaller dams.",
  },
  {
    href: "/dam-lining-cost-south-africa",
    label: "Dam lining cost guide",
    note: " to see what drives the price of a lined dam.",
  },
  {
    href: "/quote",
    label: "Request a dam lining quote",
    note: " with your dam size, location and photos.",
  },
] as const;

export function LocalSeoPage({ page }: LocalSeoPageProps) {
  const isWesternCape = page.slug === "western-cape-dam-liners";
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: page.h1, path: `/${page.slug}` },
  ];

  const schemas = [
    createServiceSchema({
      name: page.serviceName,
      serviceType: page.serviceName,
      description: page.description,
      path: `/${page.slug}`,
      offers: [...(page.schemaOffers ?? DAM_LINERS_SCHEMA_OFFERS)],
      ...(isWesternCape ? { areaServed: "Western Cape" } : {}),
    }),
    createFaqPageSchema(page.faqs),
    ...(isWesternCape
      ? createOfficeLocalBusinessSchemas({
          officeIds: ["western-cape"],
          areaServedOverride: "Western Cape",
        })
      : []),
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} schemas={schemas} />

      <Hero
        compact
        tone="ink"
        title={page.h1}
        description={page.heroDescription}
        eyebrow={page.serviceName}
        breadcrumbs={breadcrumbs}
        updated={SITEMAP_LASTMOD[`/${page.slug}`]}
      />

      <SiteSection>
        <div className="site-overview">
          <div className="site-overview__content">
            <p className="site-overview__intro">{page.intro}</p>

            {isWesternCape ? (
              <aside className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-navy">
                  Western Cape service area
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Damtech operates from Betty&apos;s Bay in the Western Cape and
                  mobilises across the province for dam lining, waterproofing and
                  water-storage projects. This is an operating base — not a walk-in
                  office.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  <a href={`tel:${phoneTel}`} className="text-water hover:underline">
                    {HEAD_OFFICE.phone}
                  </a>
                </p>
              </aside>
            ) : null}

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

            {page.typicalUses && page.typicalUses.length > 0 ? (
              <div className="mt-10">
                <PageSectionHeader title="Typical Local Uses" eyebrow="WHERE LINERS ARE USED" />
                <ul className="dt-checklist">
                  {page.typicalUses.map((use) => (
                    <li key={use}>
                      <CheckCircleIcon className="dt-checklist__icon" aria-hidden />
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

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

            <div className="mt-10">
              <PageSectionHeader title="Plan Your Dam Liner" eyebrow="NEXT STEPS" />
              <ul className="dt-checklist">
                {PLAN_LINKS.map((link) => (
                  <li key={link.href}>
                    <ArrowRightIcon className="dt-checklist__icon" aria-hidden />
                    <span>
                      <Link href={link.href} className="font-medium text-water hover:text-navy">
                        {link.label}
                      </Link>
                      {link.note}
                    </span>
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
