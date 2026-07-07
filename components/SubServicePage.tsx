import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import { SectionHeading } from "@/components/SectionHeading";
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
import { PROJECTS } from "@/lib/site";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import type { SubServicePageConfig } from "@/lib/sub-service-pages";

type SubServicePageProps = {
  page: SubServicePageConfig;
};

function imageForPage(page: SubServicePageConfig) {
  if (page.slug === "hdpe-dam-lining") return SITE_IMAGES.damLiners;
  if (page.slug === "torch-on-dam-lining") return SITE_IMAGES.bitumen;
  return SITE_IMAGES.contact;
}

export function SubServicePage({ page }: SubServicePageProps) {
  const path = `/${page.slug}`;
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

      <section className="content-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="text-lg leading-relaxed text-slate-700">{page.intro}</p>
            <div className="mt-8">
              <SectionCta
                title={`Need ${page.serviceName}?`}
                description="Request a free quote with site photos and approximate dimensions."
              />
            </div>
          </div>
          <PageImage {...imageForPage(page)} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <SectionHeading id="benefits">Key Benefits</SectionHeading>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.benefits.map((benefit) => (
              <li
                key={benefit}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="content-wrap">
        <SectionHeading id="specifications">
          {page.specsHeading ?? "Specifications"}
        </SectionHeading>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {page.specs.map((spec) => (
            <div
              key={spec.label}
              className="rounded-xl border border-slate-200 bg-white px-5 py-4"
            >
              <dt className="text-sm font-semibold text-navy">{spec.label}</dt>
              <dd className="mt-1 text-sm text-slate-600">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <ServiceProseSections sections={page.sections} />
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="content-wrap">
          <ProjectProofStrip
            title={`${page.serviceName} projects`}
            projects={projects}
          />
        </section>
      ) : null}

      <section className="content-wrap">
        <ServiceFaqSection faqs={page.faqs} />
        <div className="mt-12">
          <RelatedPageLinks links={page.relatedLinks} />
        </div>
        <p className="mt-8 text-sm text-slate-600">
          Compare all liner types on our{" "}
          <Link href="/dam-liners" className="font-medium text-water hover:text-navy">
            dam liners overview
          </Link>
          .
        </p>
      </section>

      <InternalServiceLinks currentPath={path} />
      <CTA title={page.ctaTitle} description={page.ctaDescription} />
    </>
  );
}
