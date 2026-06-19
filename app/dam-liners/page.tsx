import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";

const seo = PAGE_SEO["dam-liners"];

export const metadata = createPageMetadata(seo);

const LINER_TYPES = [
  {
    id: "hdpe",
    title: "HDPE",
    summary:
      "High-Density Polyethylene liners offer high tensile strength, UV resistance and puncture resistance — ideal for large-scale farm and mining dams.",
    sizes: "1 mm, 1.5 mm and 2 mm thicknesses",
    uses: "Agricultural farm or earth dams and mining industry applications.",
    lifespan: "20 to 30 years with proper installation and maintenance.",
  },
  {
    id: "bitumen",
    title: "Bitumen Torch On",
    summary:
      "Modified bitumen applied with a torch for a seamless waterproof membrane with strong adhesion to cement surfaces.",
    sizes: "3 mm and 4 mm thicknesses",
    uses: "Cement dams requiring a strong bond to the surface.",
    lifespan: "15 to 20 years with proper application and maintenance.",
  },
  {
    id: "pvc",
    title: "PVC",
    summary:
      "Lightweight, flexible polyvinyl chloride liners suited to ponds, steel tanks and smaller reservoirs.",
    sizes: "550 gsm, 600 gsm, 700 gsm, 800 gsm and 850 gsm",
    uses: "Steel and rainwater storage tanks, cement reservoirs and small ponds.",
    lifespan: "10 to 15 years; a roof can extend lifespan further.",
  },
];

export default function DamLinersPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Dam Liners", path: seo.path },
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
        description="Dam liners are essential for ensuring the integrity and longevity of water storage systems. They prevent leaks, reduce maintenance costs and protect the surrounding environment."
      />

      <section className="content-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="section-heading">Why Choose Us?</h2>
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
          </div>
          <PageImage {...SITE_IMAGES.damLiners} />
        </div>
      </section>

      {LINER_TYPES.map((liner, index) => (
        <section
          key={liner.id}
          className={index % 2 === 0 ? "bg-slate-50" : ""}
        >
          <div className="content-wrap">
            <h2 className="section-heading">{liner.title}</h2>
            <p className="mt-4 max-w-3xl text-slate-600">{liner.summary}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <dt className="text-sm font-semibold text-navy">Sizes</dt>
                <dd className="mt-1 text-sm text-slate-600">{liner.sizes}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <dt className="text-sm font-semibold text-navy">Uses</dt>
                <dd className="mt-1 text-sm text-slate-600">{liner.uses}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <dt className="text-sm font-semibold text-navy">Lifespan</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  {liner.lifespan}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ))}

      <InternalServiceLinks currentPath={seo.path} />
      <CTA
        title="Have Questions?"
        description="Call us on +27 82 853 1026 or submit our contact form and we'll be in touch."
      />
    </>
  );
}
