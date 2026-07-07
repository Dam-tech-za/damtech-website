import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { ProjectProofStrip } from "@/components/ProjectProofStrip";
import { SectionCta } from "@/components/SectionCta";
import {
  RelatedPageLinks,
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";
import { PROJECTS } from "@/lib/site";
import {
  DAM_LINERS_CONTENT,
  DAM_LINERS_SCHEMA_OFFERS,
} from "@/lib/service-pages-content";

const seo = PAGE_SEO["dam-liners"];

export const metadata = createPageMetadata(seo);

const LINER_TYPES = [
  {
    id: "hdpe",
    title: "HDPE",
    href: "/hdpe-dam-lining",
    summary:
      "High tensile strength, UV resistance and puncture resistance — ideal for large farm and mining dams.",
    sizes: "1 mm, 1.5 mm and 2 mm",
    uses: "Earth dams, mining ponds, irrigation storage",
    lifespan: "20–30 years",
  },
  {
    id: "bitumen",
    title: "Bitumen Torch-On",
    href: "/torch-on-dam-lining",
    summary:
      "Heat-bonded membrane with strong adhesion to prepared cement and rigid dam surfaces.",
    sizes: "3 mm and 4 mm",
    uses: "Cement dams, canals, rigid reservoirs",
    lifespan: "15–20 years",
  },
  {
    id: "pvc",
    title: "PVC",
    href: "/pvc-dam-lining",
    summary:
      "Flexible liner for ponds, steel tanks and smaller reservoirs where ease of handling matters.",
    sizes: "550–850 gsm",
    uses: "Steel tanks, ponds, small reservoirs",
    lifespan: "10–15 years",
  },
];

const DAM_PROJECTS = PROJECTS.filter((project) =>
  project.detail.includes("HDPE") || project.detail.includes("Bitumen"),
);

export default function DamLinersPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Dam Liners", path: seo.path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          createServiceSchema({
            name: seo.serviceName ?? seo.title,
            serviceType: seo.serviceName ?? "HDPE Dam Lining",
            description: seo.description,
            path: seo.path,
            offers: [...DAM_LINERS_SCHEMA_OFFERS],
          }),
          createFaqPageSchema(DAM_LINERS_CONTENT.faqs),
        ]}
      />

      <Hero
        compact
        eyebrow="HDPE · PVC · Bitumen"
        title={seo.h1}
        description="Professional HDPE, PVC and bitumen torch-on dam liner supply and installation for farm dams, earth dams and reservoirs across South Africa."
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-relaxed text-slate-700">
              {DAM_LINERS_CONTENT.intro}
            </p>
            <ServiceProseSections
              sections={[DAM_LINERS_CONTENT.sections[0]!]}
              className="mt-10"
            />
          </div>
          <PageImage {...SITE_IMAGES.damLiners} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap space-y-10">
          <SectionHeading id="compare-liners">Compare Dam Liner Types</SectionHeading>
          <ComparisonTable
            title="At-a-glance comparison"
            columns={[
              { key: "type", label: "Liner type" },
              { key: "sizes", label: "Sizes" },
              { key: "uses", label: "Best for" },
              { key: "lifespan", label: "Typical lifespan" },
            ]}
            rows={LINER_TYPES.map((liner) => ({
              type: liner.title,
              sizes: liner.sizes,
              uses: liner.uses,
              lifespan: liner.lifespan,
            }))}
          />
          <div className="content-grid-3">
            {LINER_TYPES.map((liner) => (
              <article
                key={liner.id}
                className="card flex h-full flex-col"
              >
                <h3 className="subsection-heading !mt-0">
                  <Link href={liner.href} className="hover:text-water">
                    {liner.title}
                  </Link>
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {liner.summary}
                </p>
                <Link
                  href={liner.href}
                  className="link-row mt-1"
                >
                  Learn more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <SectionHeading id="why-damtech">Why Choose Damtech?</SectionHeading>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Expert installation by certified professionals",
            "Top-quality materials from leading local suppliers",
            "Custom solutions tailored to your requirements",
            "Dedicated support from consultation to completion",
            "Competitive pricing with high-value outcomes",
            "10-year material warranty on all dam liners",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <SectionCta
            title="Not sure which liner fits your dam?"
            description="Share photos, approximate dimensions and how you use stored water — we will recommend HDPE, PVC or bitumen torch-on."
          />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <ServiceProseSections sections={DAM_LINERS_CONTENT.sections.slice(1)} />
        </div>
      </section>

      <section className="content-wrap">
        <ProjectProofStrip
          title="Dam liner projects"
          projects={DAM_PROJECTS}
        />
        <div className="mt-12">
          <ServiceFaqSection faqs={DAM_LINERS_CONTENT.faqs} />
        </div>
        <div className="mt-12">
          <RelatedPageLinks links={DAM_LINERS_CONTENT.relatedLinks} />
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Have Questions About Your Dam?"
        description="Call us on +27 82 853 1026 or submit our quote form with dam dimensions and photos for a tailored liner recommendation."
      />
    </>
  );
}
