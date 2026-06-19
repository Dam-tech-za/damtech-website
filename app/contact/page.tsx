import Link from "next/link";
import { CTA } from "@/components/CTA";
import { LeadForm } from "@/components/LeadForm";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
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
        title={seo.h1}
        description="Tell us about your dam lining, steel tank or waterproofing project. We respond to quote requests and can arrange a free site inspection where needed."
      />

      <section className="content-wrap">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="section-heading">Request Your Free Quote</h2>
              <p className="mt-3 text-slate-600">
                Whether you need an HDPE dam liner, a corrugated steel reservoir,
                bitumen waterproofing or leak repair, our team will review your
                requirements and recommend a practical solution. Complete the form
                below and we will be in touch.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <LeadForm sourcePage="/contact" submitLabel="Send Enquiry" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy">Services We Quote On</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {CONTACT_SERVICES.map((service) => (
                  <li
                    key={service.href}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="font-semibold text-navy">
                      <Link href={service.href} className="hover:text-water">
                        {service.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-8">
            <PageImage {...SITE_IMAGES.contact} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm">
              <h2 className="text-lg font-semibold text-navy">Contact Details</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-navy">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="text-water hover:text-navy"
                    >
                      {siteConfig.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${phoneTel}`}
                      className="text-water hover:text-navy"
                    >
                      {siteConfig.phone || "+27 82 853 1026"}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy">Business Hours</dt>
                  <dd className="text-slate-600">
                    Monday – Friday: 08:00 – 17:00 (SAST)
                    <br />
                    Saturday: By appointment
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-navy">Areas We Serve</h2>
              <p className="mt-2 text-sm text-slate-600">
                Based in South Africa with projects across agricultural,
                industrial, commercial and water-storage applications. We work
                nationwide — don&apos;t let our office location limit your enquiry.
              </p>
              <ul className="mt-4 grid gap-2">
                {AREAS_SERVED.map((area) => (
                  <li
                    key={area}
                    className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-navy">Our Locations</h2>
              <ul className="mt-4 space-y-4">
                {OFFICES.map((office) => (
                  <li
                    key={office.name}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <h3 className="font-semibold text-navy">{office.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{office.phone}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <h2 className="section-heading">Common Questions</h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Quick answers before you call. You can also{" "}
            <Link href="/quote" className="text-water hover:text-navy">
              request a quote online
            </Link>{" "}
            or read our full{" "}
            <Link
              href="/waterproofing-and-dam-liners"
              className="text-water hover:text-navy"
            >
              FAQ page
            </Link>
            .
          </p>
          <div className="mt-6 space-y-3">
            {FAQ_ITEMS.slice(0, 3).map((item) => (
              <details
                key={item.question}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <summary className="cursor-pointer font-medium text-navy">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA />
    </>
  );
}
