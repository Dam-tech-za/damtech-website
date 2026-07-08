import Link from "next/link";

import { Hero } from "@/components/Hero";

import { PageImage } from "@/components/PageImage";

import { PageSeo } from "@/components/PageSeo";

import { ServiceOverviewGrid } from "@/components/ServiceOverviewGrid";

import { SiteSection } from "@/components/SiteSection";

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

import {

  CONTACT_SERVICE_AREAS,

  OFFICES,

  formatOfficeAddressLines,

  HEAD_OFFICE_MAP_EMBED_URL,

  phoneTel,

  siteConfig,

} from "@/lib/site";

import { PageSectionHeader } from "@/components/PageSectionHeader";



const seo = PAGE_SEO.contact;



export const metadata = createPageMetadata(seo);



function ContactQuickActions() {

  return (

    <aside className="site-contact-aside">

      <div className="home-final-cta__card home-final-cta__card--inline">

        <h3 className="home-final-cta__title home-final-cta__title--inline">

          Prefer to talk first?

        </h3>

        <p className="home-final-cta__intro">

          Speak to our team about dam linings, steel tanks or waterproofing — we

          can often give initial guidance over the phone.

        </p>

        <div className="home-final-cta__actions">

          <a href={`tel:${phoneTel}`} className="btn-primary home-final-cta__btn">

            Call {siteConfig.phone}

          </a>

          <a

            href={`mailto:${siteConfig.email}`}

            className="btn-secondary home-final-cta__btn"

          >

            Email {siteConfig.email}

          </a>

        </div>

        <p className="mt-4 text-xs text-slate-500">

          Monday – Friday 08:00 – 17:00 (SAST) · Saturday by appointment

        </p>

      </div>

    </aside>

  );

}



function ContactLocationsSection() {

  return (

    <SiteSection

      id="our-locations"

      tone="muted"

      aria-labelledby="our-locations-heading"

    >

      <PageSectionHeader

        id="our-locations-heading"

        eyebrow="OUR OFFICES"

        title="Our Offices"

        intro="Damtech offices in Gauteng and the Western Cape with nationwide project coverage for dam linings, waterproofing and water storage."

      />



      <ul className="home-why-choose__cards site-card-grid">

        {OFFICES.map((office) => (

          <li key={office.id} className="home-why-choose__card">

            <h3 className="home-why-choose__card-title">{office.name}</h3>

            <span className="home-why-choose__card-accent" aria-hidden />

            {formatOfficeAddressLines(office).map((line) => (

              <p key={line} className="home-why-choose__card-text">

                {line}

              </p>

            ))}

            <a

              href={`tel:${office.phone.replace(/\s/g, "")}`}

              className="mt-2 inline-block text-sm font-medium text-water hover:text-navy"

            >

              {office.phone}

            </a>

            {"googleBusinessProfileUrl" in office &&

            office.googleBusinessProfileUrl ? (

              <a

                href={office.googleBusinessProfileUrl}

                target="_blank"

                rel="noopener noreferrer"

                className="home-services__card-link mt-2"

              >

                View on Google Maps →

              </a>

            ) : null}

          </li>

        ))}

      </ul>



      <PageSectionHeader

        id="areas-served"

        eyebrow="COVERAGE"

        title="Areas We Work In"

        intro="Damtech mobilises project teams across Gauteng and the Western Cape, with nationwide coverage for larger dam, tank and waterproofing contracts."

        className="mt-12"

      />



      <div className="site-card-grid">

        {Object.entries(CONTACT_SERVICE_AREAS).map(([region, towns]) => (

          <div key={region} className="home-why-choose__card">

            <h3 className="home-why-choose__card-title">{region}</h3>

            <span className="home-why-choose__card-accent" aria-hidden />

            <ul className="mt-3 flex flex-wrap gap-2">

              {towns.map((town) => (

                <li

                  key={town}

                  className="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200"

                >

                  {town}

                </li>

              ))}

            </ul>

          </div>

        ))}

      </div>



      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">

        <iframe

          title="Damtech head office on Google Maps"

          src={HEAD_OFFICE_MAP_EMBED_URL}

          className="h-[28rem] w-full border-0 sm:h-[32rem]"

          loading="lazy"

          referrerPolicy="no-referrer-when-downgrade"

          allowFullScreen

        />

      </div>

    </SiteSection>

  );

}



export default function ContactPage() {

  const breadcrumbs = [

    { name: "Home", path: "/" },

    { name: "Contact", path: seo.path },

  ];



  return (

    <>

      <PageSeo breadcrumbs={breadcrumbs} />



      <Hero

        compact

        eyebrow="Contact Damtech"

        title={seo.h1}

        description="Request a free quote for dam linings, steel reservoirs or waterproofing — or call us to discuss your project."

        showActions={false}

        breadcrumbs={breadcrumbs}

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



      <SiteSection id="request-quote" tone="muted">

        <div className="site-contact-grid">

          <FormSection

            title="Request Your Free Quote"

            subtitle="Tell us about your project and we'll respond within one business day."

            sourcePage="/contact"

          />

          <ContactQuickActions />

        </div>

      </SiteSection>



      <ContactLocationsSection />



      <ServiceOverviewGrid

        items={CONTACT_SERVICES}

        heading="Services We Quote On"

        eyebrow="WHAT WE QUOTE"

        intro="Not sure which service fits? Submit the form above with your project details — we will recommend HDPE, PVC, steel tank or waterproofing options."

      />



      <SiteSection>

        <PageImage {...SITE_IMAGES.contact} />

      </SiteSection>



      <SiteSection tone="muted" aria-labelledby="common-questions">

        <PageSectionHeader

          id="common-questions"

          eyebrow="FAQ"

          title="Common Questions"

          intro="Quick answers before you call. Read our full FAQ page for more on liners, tanks and warranties."

        />

        <FAQ items={FAQ_ITEMS.slice(0, 3)} showHeading={false} />

        <Link href="/faq" className="btn-secondary mt-6 inline-flex">

          View all FAQs

        </Link>

      </SiteSection>



      <InternalServiceLinks currentPath={seo.path} />

      <CTA

        title="Ready to get started?"

        description="Submit the form above or call us — we arrange site inspections and free quotes across South Africa."

      />

    </>

  );

}

