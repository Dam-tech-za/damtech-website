import { SectionHeading } from "@/components/SectionHeading";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import {
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import { createFaqPageSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";
import { ABOUT_CONTENT } from "@/lib/service-pages-content";

export const metadata = createPageMetadata(PAGE_SEO.about);

export default function AboutPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about-us-waterproofing-company" },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={createFaqPageSchema(ABOUT_CONTENT.faqs)}
      />

      <Hero
        compact
        eyebrow="30+ years experience"
        title={PAGE_SEO.about.h1}
        description="Damtech provides dam linings, waterproofing, reservoir lining and water storage solutions for farms, mines, game lodges and commercial properties across South Africa."
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-relaxed text-slate-700">
              {ABOUT_CONTENT.intro}
            </p>

            <SectionHeading id="who-we-are" className="mt-10">
              Who Are We?
            </SectionHeading>
            <p className="mt-4 leading-relaxed text-slate-600">
              We are your trusted experts in earth dam linings, waterproofing and
              steel water storage tank suppliers with over 30 years of experience
              in the industry. With a legacy rooted in excellence, we deliver
              innovative solutions that safeguard your investment and enhance its
              longevity.
            </p>

            <SectionHeading id="our-mission" className="mt-10">
              Our Mission
            </SectionHeading>
            <p className="mt-4 leading-relaxed text-slate-600">
              To provide top-tier waterproofing and lining solutions that stand the
              test of time. We strive to exceed our clients&apos; expectations by
              offering reliable, effective and tailored services — whether you need
              advanced earth dam linings for large-scale dams or expert waterproofing
              for roofs and foundations.
            </p>
          </div>
          <PageImage {...SITE_IMAGES.about} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <ServiceProseSections sections={ABOUT_CONTENT.sections.slice(0, 2)} />

          <SectionHeading id="what-we-do" className="mt-12">
            What We Do
          </SectionHeading>
          <div className="mt-8 content-grid-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="subsection-heading !mt-0">Earth Dam Linings</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                HDPE, PVC and bitumen torch-on lining for agricultural farm dams,
                mining ponds and irrigation storage nationwide.
              </p>
              <Link
                href="/dam-liners"
                className="mt-4 inline-block text-sm font-medium text-water hover:underline"
              >
                Dam linings →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="subsection-heading !mt-0">Steel Water Tanks</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Corrugated galvanised reservoirs from 11 kL to 500 kL+ with PVC
                lining, columns and optional roofs.
              </p>
              <Link
                href="/steel-water-storage-tanks"
                className="mt-4 inline-block text-sm font-medium text-water hover:underline"
              >
                Steel water tanks →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="subsection-heading !mt-0">Waterproofing</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Bitumen torch-on and maintenance for roofs, foundations and
                retaining structures on farms and commercial buildings.
              </p>
              <Link
                href="/bitumen-waterproofing"
                className="mt-4 inline-block text-sm font-medium text-water hover:underline"
              >
                Waterproofing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <ServiceProseSections sections={ABOUT_CONTENT.sections.slice(2)} />

        <SectionHeading id="specialised-services" className="mt-12">
          Specialised Services
        </SectionHeading>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            "Steel water storage tanks with custom sizes, roofs and support columns",
            "HDPE geomembrane linings for large gravel and farm dams",
            "PVC linings for ponds and zinc reservoirs",
            "Expert waterproofing from roofs to foundations",
            "Bitumen waterproofing for slab roofs and cement or gravel dams",
            "Preventative maintenance with regular inspections and upkeep",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <ServiceFaqSection faqs={ABOUT_CONTENT.faqs} />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/services"
            className="btn-primary"
          >
            View All Services
          </Link>
          <Link href="/projects" className="btn-secondary">
            Project Case Studies
          </Link>
          <Link href="/quote" className="btn-secondary">
            Request a Quote
          </Link>
        </div>
      </section>

      <InternalServiceLinks currentPath="/about-us-waterproofing-company" />
      <CTA title="Request a Quote Today" />
    </>
  );
}
