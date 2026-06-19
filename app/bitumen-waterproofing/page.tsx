import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";

const seo = PAGE_SEO.bitumen;

export const metadata = createPageMetadata(seo);

export default function BitumenWaterproofingPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Bitumen Waterproofing", path: seo.path },
        ]}
        schemas={createServiceSchema({
          name: seo.serviceName ?? seo.title,
          description: seo.description,
          path: seo.path,
        })}
      />

      <Hero
        compact
        title={seo.h1}
        description="Bitumen waterproofing is a highly effective solution for protecting structures from water damage, creating a robust and long-lasting barrier against leaks and moisture infiltration."
      />

      <section className="content-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="section-heading">Applications</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Roofs (cement slabs and metal roofs)",
                "Foundations and basements",
                "Retaining walls",
                "Ponds and reservoirs",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <PageImage {...SITE_IMAGES.bitumen} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <h2 className="section-heading">How Bitumen Waterproofing Works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-navy">Torch-On Membranes</h3>
              <p className="mt-2 text-sm text-slate-600">
                Heated and applied directly to the surface using a torch,
                creating a strong seamless bond for excellent waterproofing.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-navy">Self-Adhesive Membranes</h3>
              <p className="mt-2 text-sm text-slate-600">
                Pre-applied adhesive backing for faster installation without a
                torch — ideal where heat application is limited.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-navy">Bitumen Coatings</h3>
              <p className="mt-2 text-sm text-slate-600">
                Liquid coatings applied with brushes or rollers for smaller
                areas or intricate surfaces.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <h2 className="section-heading">Why Damtech is Your Best Choice</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Free site inspection",
            "Satisfaction guarantee",
            "Expert advice at no cost",
            "Certified installation technicians",
            "Premium bitumen materials",
            "Competitive, transparent pricing",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA title="Get In Touch" />
    </>
  );
}
