import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageSeo } from "@/components/PageSeo";
import { createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";

const seo = PAGE_SEO.services;

export const metadata = createPageMetadata(seo);

export default function ServicesPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Services", path: seo.path },
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
        description="We specialise in bitumen waterproofing, earth dam liners and steel reservoirs for residential and agricultural clients across South Africa."
      />

      <section className="content-wrap space-y-16">
        <div>
          <h2 className="section-heading">Waterproofing</h2>
          <p className="mt-4 max-w-3xl text-slate-600">
            We offer advanced waterproofing solutions designed to protect your
            property from water damage, including bitumen waterproofing for
            concrete slabs and metal roofs, foundation waterproofing, and
            liquid rubber applications for flexible, seamless membranes.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {["Metal Roofs", "Foundations", "Chimneys", "Concrete Slabs"].map(
              (item) => (
                <li
                  key={item}
                  className="rounded-full bg-sky-50 px-3 py-1 text-sm text-navy"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
          <Link href="/bitumen-waterproofing" className="btn-secondary mt-6 inline-flex">
            Bitumen Waterproofing
          </Link>
        </div>

        <div>
          <h2 className="section-heading">Dam Liners</h2>
          <p className="mt-4 max-w-3xl text-slate-600">
            Robust dam lining solutions including HDPE geomembranes for large
            farm dams, PVC linings for ponds and zinc reservoirs, and bitumen
            torch-on linings for cement or gravel dams.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>HDPE Geomembrane (2 mm, 1.5 mm and 1 mm)</li>
            <li>PVC Lining (850 gsm, 700 gsm and 550 gsm)</li>
            <li>Bitumen Torch-On (4 mm or 3 mm)</li>
          </ul>
          <Link href="/dam-liners" className="btn-secondary mt-6 inline-flex">
            Dam Liners
          </Link>
        </div>

        <div>
          <h2 className="section-heading">Corrugated Zinc Reservoirs</h2>
          <p className="mt-4 max-w-3xl text-slate-600">
            Built with 0.8 mm thick corrugated steel sheets, available from 3 m
            to 17 m in diameter. Each reservoir includes standard 850 gsm PVC
            lining, 50 mm inlet and outlet, overflow, optional roof, and sturdy
            upright columns with a bidem floor sheet.
          </p>
          <Link
            href="/steel-water-storage-tanks"
            className="btn-secondary mt-6 inline-flex"
          >
            Steel Water Tanks
          </Link>
        </div>

        <div>
          <h2 className="section-heading">Maintenance</h2>
          <p className="mt-4 max-w-3xl text-slate-600">
            Expert maintenance for leaking roofs and damp walls. We assess root
            causes of moisture infiltration, apply effective treatments, and
            offer preventative maintenance with regular inspections.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              "Leaking Roofs",
              "Damp / water seepage",
              "Preventative Maintenance",
              "FREE Inspection",
            ].map((item) => (
              <li
                key={item}
                className="rounded-full bg-green-50 px-3 py-1 text-sm text-navy"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA />
    </>
  );
}
