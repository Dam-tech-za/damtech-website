import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { SITE_IMAGES } from "@/lib/images";

export const metadata = createPageMetadata(PAGE_SEO.about);

export default function AboutPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "About Us", path: "/about-us-waterproofing-company" },
        ]}
      />

      <Hero
        compact
        title={PAGE_SEO.about.h1}
        description="At Damtech, we excel in delivering top-tier solutions for earth dam liners, steel water tanks and waterproofing systems. Innovation, reliability and exceptional customer service drive everything we do."
      />

      <section className="content-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="section-heading">Who Are We?</h2>
            <p className="mt-4 text-slate-600">
              We are your trusted experts in earth dam liners, waterproofing and
              steel water storage tank suppliers with over 30+ years of experience
              in the industry. With a legacy rooted in excellence, we deliver
              innovative solutions that safeguard your investment and enhance its
              longevity.
            </p>

            <h2 className="section-heading mt-12">Our Mission</h2>
            <p className="mt-4 text-slate-600">
              To provide top-tier waterproofing and lining solutions that stand the
              test of time. We strive to exceed our clients&apos; expectations by
              offering reliable, effective and tailored services — whether you need
              advanced earth dam liners for large-scale dams or expert waterproofing
              for roofs and foundations.
            </p>
          </div>
          <PageImage {...SITE_IMAGES.about} />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <h2 className="section-heading">What We Do</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-navy">Earth Dam Liners</h3>
              <p className="mt-2 text-sm text-slate-600">
                We specialise in large earth dam liners for agriculture and
                mining applications.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-navy">Steel Water Tanks</h3>
              <p className="mt-2 text-sm text-slate-600">
                Steel and rainwater tanks in various sizes ranging from 10 to 550
                kL.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-navy">Waterproofing</h3>
              <p className="mt-2 text-sm text-slate-600">
                From foundation to roof waterproofing — we do it all.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <h2 className="section-heading">30 Years Of Experience In The Industry</h2>
        <p className="mt-4 max-w-3xl text-slate-600">
          At Damtech, we provide top-quality dam liners with exceptional
          expertise and innovative solutions. Our extensive experience in HDPE,
          PVC and Bitumen Torch-On liners make us the top choice for superior dam
          lining in South Africa.
        </p>

        <h2 className="section-heading mt-12">Specialised Services</h2>
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
        <Link
          href="/bitumen-waterproofing-services-and-more"
          className="btn-primary mt-8 inline-flex"
        >
          Learn More
        </Link>
      </section>

      <InternalServiceLinks currentPath="/about-us-waterproofing-company" />
      <CTA title="Request a Quote Today" />
    </>
  );
}
