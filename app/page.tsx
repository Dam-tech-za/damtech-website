import Link from "next/link";
import { CTA } from "@/components/CTA";
import { HomeHero } from "@/components/HomeHero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageImage } from "@/components/PageImage";
import { PageSeo } from "@/components/PageSeo";
import { ServiceCard } from "@/components/ServiceCard";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { PROJECTS } from "@/lib/site";
import { SITE_IMAGES } from "@/lib/images";

export const metadata = createPageMetadata(PAGE_SEO.home);

const SERVICES = [
  {
    title: "Reservoirs",
    description:
      "Durable corrugated zinc reservoirs with engineered, weather-resistant designs for long-lasting water storage.",
    href: "/steel-water-storage-tanks",
  },
  {
    title: "Waterproofing",
    description:
      "Comprehensive waterproofing and maintenance to protect your property and keep it water-free.",
    href: "/bitumen-waterproofing",
  },
  {
    title: "Dam Liners",
    description:
      "HDPE, PVC and Torch-On dam liners offering robust protection with unique strengths for every application.",
    href: "/dam-liners",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Request Your Free Quote",
    text: "Fill out the contact form or call us at +27 82 853 1026 to schedule a free quote and inspection.",
  },
  {
    step: "2",
    title: "Free Site Inspection",
    text: "A waterproofing expert from our team will visit the site and complete a detailed inspection.",
  },
  {
    step: "3",
    title: "Tailored Solution",
    text: "We provide a personalised solution outlining the problem, proposed service and expected outcomes.",
  },
  {
    step: "4",
    title: "Service Delivery",
    text: "Our technicians visit your property to deliver the required service depending on your needs.",
  },
];

export default function HomePage() {
  return (
    <>
      <PageSeo breadcrumbs={[{ name: "Home", path: "/" }]} />

      <HomeHero />

      <section className="content-wrap">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <PageImage
            {...SITE_IMAGES.homeDamLiner}
            priority
          />
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6 sm:p-8">
            <h2 className="section-heading">10-Year Warranty On All Our Services</h2>
            <p className="mt-3 text-slate-600">
              We stand behind the quality of our work with a comprehensive 10-year
              warranty. This warranty covers all aspects of our waterproofing
              materials and earth dam liners, ensuring your asset remains
              protected for years to come.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <h2 className="section-heading">What We Offer</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="content-wrap">
        <h2 className="section-heading">We Do Maintenance</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Protect your home with comprehensive waterproofing maintenance and
          services. Our experts ensure your property remains safe from water
          damage with tailored solutions and top-quality materials.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Property Inspections",
            "Seamless Roof and Foundation Repairs",
            "Preventative Maintenance",
            "Expert Advice",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-navy"
            >
              {item}
            </li>
          ))}
        </ul>
        <Link href="/contact" className="btn-primary mt-8 inline-flex">
          Contact Us
        </Link>
      </section>

      <section className="bg-slate-50">
        <div className="content-wrap">
          <h2 className="section-heading">How It Works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-water text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="content-wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="section-heading">Explore Some Of Our Work</h2>
          <Link href="/projects" className="text-sm font-semibold text-water hover:text-navy">
            View all projects →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <article
              key={project.location}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-navy">{project.location}</h3>
              <p className="mt-1 text-sm text-slate-600">{project.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="content-wrap">
          <h2 className="text-2xl font-bold sm:text-3xl">Why Choose Us</h2>
          <p className="mt-4 max-w-3xl text-slate-200">
            With years of experience in the dam liner, waterproofing and
            reservoir industry, we bring unparalleled knowledge and skill to
            every project. Our team is dedicated to delivering solutions that
            stand the test of time.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              "Locally Owned",
              "Over 30+ Years of Experience",
              "Low Cost",
            ].map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center font-medium"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <InternalServiceLinks />

      <CTA />
    </>
  );
}
