import { SectionHeading } from "@/components/SectionHeading";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import {
  LazyCTA as CTA,
  LazyFAQ as FAQ,
  LazyFormSection as FormSection,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";
import {
  CONTACT_SERVICES,
  createPageMetadata,
  FAQ_ITEMS,
  PAGE_SEO,
} from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";
import { OFFICES, phoneTel, siteConfig } from "@/lib/site";

const seo = PAGE_SEO.contact;

export const metadata = createPageMetadata(seo);

const AREAS_SERVED = [
  "Agricultural farms and game farms",
  "Industrial and commercial properties",
  "Mining and earth dam applications",
  "Residential waterproofing projects",
  "Rural water storage and irrigation",
  "Nationwide — Pretoria, Western Cape and surrounds",
] as const;

function ContactAside() {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
        <SectionHeading as="h3" id="contact-details" className="!mt-0 text-xl">
          Prefer to talk first?
        </SectionHeading>
        <p className="mt-2 text-sm text-slate-600">
          Speak to our team about dam liners, steel tanks or waterproofing — we
          can often give initial guidance over the phone.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <a href={`tel:${phoneTel}`} className="btn-primary text-center">
            Call {siteConfig.phone}
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="btn-secondary text-center"
          >
            Email {siteConfig.email}
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Monday – Friday 08:00 – 17:00 (SAST) · Saturday by appointment
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm">
        <SectionHeading as="h3" id="areas-served" className="!mt-0 text-lg">
          Areas we serve
        </SectionHeading>
        <ul className="mt-3 grid gap-2">
          {AREAS_SERVED.map((area) => (
            <li
              key={area}
              className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700 ring-1 ring-slate-200"
            >
              {area}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm">
        <SectionHeading as="h3" id="our-locations" className="!mt-0 text-lg">
          Our offices
        </SectionHeading>
        <ul className="mt-3 space-y-3">
          {OFFICES.map((office) => (
            <li
              key={office.name}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="font-semibold text-navy">{office.name}</p>
              <a
                href={`tel:${office.phone.replace(/\s/g, "")}`}
                className="mt-1 block text-water hover:text-navy"
              >
                {office.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Contact", path: seo.path },
        ]}
      />

      <Hero
        compact
        eyebrow="Contact Damtech"
        title={seo.h1}
        description="Request a free quote for dam liners, steel reservoirs or waterproofing — or call us to discuss your project."
        showActions={false}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="#request-quote" className="hero-btn-primary w-full sm:w-auto">
            Request a Free Quote
          </Link>
          <a
            href={`tel:${phoneTel}`}
            className="hero-btn-secondary w-full sm:w-auto"
          >
            Call {siteConfig.phone}
          </a>
        </div>
      </Hero>

      <section
        id="request-quote"
        className="scroll-mt-24 border-b border-slate-200 bg-gradient-to-b from-sky-50/80 to-white"
      >
        <div className="content-wrap">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <FormSection
              title="Request Your Free Quote"
              subtitle="Tell us about your project and we'll respond within one business day."
            sourcePage="/contact"
          />
            <ContactAside />
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <SectionHeading id="services-we-quote" className="!mt-0">
          Services We Quote On
        </SectionHeading>
        <p className="mt-3 max-w-3xl text-slate-600">
          Not sure which service fits? Submit the form above with your project
          details — we will recommend HDPE, PVC, steel tank or waterproofing
          options.
        </p>
        <ul className="mt-8 content-grid-4">
          {CONTACT_SERVICES.map((service) => (
            <li
              key={service.href}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-navy">
                <Link href={service.href} className="hover:text-water">
                  {service.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                {service.description}
              </p>
              <Link
                href={service.href}
                className="mt-4 text-sm font-semibold text-water hover:text-navy"
              >
                Learn more →
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <PageImage {...SITE_IMAGES.contact} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <SectionHeading id="common-questions" className="!mt-0">
            Common Questions
          </SectionHeading>
          <p className="mt-3 max-w-3xl text-slate-600">
            Quick answers before you call. Read our full{" "}
            <Link
              href="/waterproofing-and-dam-liners"
              className="text-water hover:text-navy"
            >
              FAQ page
            </Link>{" "}
            for more on liners, tanks and warranties.
          </p>
          <div className="mt-6">
            <FAQ items={FAQ_ITEMS.slice(0, 3)} showHeading={false} />
          </div>
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Ready to get started?"
        description="Submit the form above or call us — we arrange site inspections and free quotes across South Africa."
      />
    </>
  );
}
