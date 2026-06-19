import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { createServiceSchema } from "@/lib/seo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";

const seo = PAGE_SEO["steel-tanks"];

export const metadata = createPageMetadata(seo);

const TWO_RING = [
  ["11 kL", "3 m", "1.55 m"],
  ["20 kL", "4 m", "1.55 m"],
  ["31 kL", "5 m", "1.55 m"],
  ["44 kL", "6 m", "1.55 m"],
  ["60 kL", "7 m", "1.55 m"],
  ["78 kL", "8 m", "1.55 m"],
  ["99 kL", "9 m", "1.55 m"],
  ["122 kL", "10 m", "1.55 m"],
  ["148 kL", "11 m", "1.55 m"],
  ["176 kL", "12 m", "1.55 m"],
  ["206 kL", "13 m", "1.55 m"],
  ["239 kL", "14 m", "1.55 m"],
  ["274 kL", "15 m", "1.55 m"],
  ["312 kL", "16 m", "1.55 m"],
  ["352 kL", "17 m", "1.55 m"],
];

function TankTable({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <h3 className="border-b border-slate-200 px-4 py-3 font-semibold text-navy">
        {title}
      </h3>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2 font-medium">Volume</th>
            <th className="px-4 py-2 font-medium">Diameter</th>
            <th className="px-4 py-2 font-medium">Height</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="border-t border-slate-100">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-2 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SteelTanksPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Steel Water Tanks", path: seo.path },
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
        description="Our steel water tanks are known for robust construction and long-lasting performance. Made from high-quality corrugated galvanised steel for reliable water storage."
      />

      <section className="content-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="section-heading">What You Can Expect</h2>
            <p className="mt-4 text-slate-600">
          We specialise in delivering high-quality, durable water storage
          solutions tailored to your needs. Our tanks are crafted from 0.8 mm
          thick corrugated hot dip galvanised steel sheets, available from 3 m
          to 17 m in diameter. Each tank includes a standard 850 gsm PVC lining,
          bidem floor sheet, sturdy upright columns, and an optional roof for
              additional protection.
            </p>
          </div>
          <PageImage {...SITE_IMAGES.steelTank} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap space-y-8">
          <TankTable title="Two Rings — 1.55 m" rows={TWO_RING} />
          <TankTable
            title="Three Rings — 2.3 m (selected sizes)"
            rows={[
              ["17 kL", "3 m", "2.3 m"],
              ["89 kL", "7 m", "2.3 m"],
              ["181 kL", "10 m", "2.3 m"],
              ["306 kL", "13 m", "2.3 m"],
              ["523 kL", "17 m", "2.3 m"],
            ]}
          />
          <TankTable
            title="Four Rings — 3.05 m (selected sizes)"
            rows={[
              ["22 kL", "3 m", "3.05 m"],
              ["87 kL", "6 m", "3.05 m"],
              ["195 kL", "9 m", "3.05 m"],
              ["470 kL", "14 m", "3.05 m"],
            ]}
          />
          <p className="text-sm text-slate-500">
            Full capacity tables available on request. Sizes up to 500 kL+.
          </p>
        </div>
      </section>

      <InternalServiceLinks currentPath={seo.path} />
      <CTA />
    </>
  );
}
