import Link from "next/link";

import {

  BuildingIcon,

  DropletIcon,

  HomeIcon,

  LayersIcon,

  MapPinIcon,

  ReservoirIcon,

  ShieldCheckIcon,

} from "@/components/icons/StrokeIcons";

import { Hero } from "@/components/Hero";

import { TrustCardGrid } from "@/components/TrustCardGrid";

import { BenefitCardGrid } from "@/components/BenefitCardGrid";
import { InfoCardGrid } from "@/components/InfoCardGrid";

import { PageOverviewSection } from "@/components/PageOverviewSection";

import { PageSeo } from "@/components/PageSeo";

import { SiteSection } from "@/components/SiteSection";

import {

  ServiceFaqSection,

  ServiceProseSections,

} from "@/components/ServicePageSections";

import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";

import { RELATED_SERVICE_LINKS } from "@/lib/related-services";

import {

  LazyCTA as CTA,

  LazyInternalServiceLinks as InternalServiceLinks,

} from "@/components/lazy";

import { createFaqPageSchema } from "@/lib/seo";

import { createPageMetadata, PAGE_SEO } from "@/lib/pages";

import { SITE_IMAGES } from "@/lib/images";

import { ABOUT_CONTENT } from "@/lib/service-pages-content";



export const metadata = createPageMetadata(PAGE_SEO.about);



const ABOUT_TRUST_CARDS = [

  {

    id: "local",

    title: "Locally Owned",

    description:

      "Proudly based in South Africa, with practical understanding of local site conditions, climate and client requirements.",

    Icon: HomeIcon,

  },

  {

    id: "experience",

    title: "Practical Contractor Experience",

    description:

      "Decades of experience in dam linings, waterproofing, reservoir lining and water storage for farms, mines and commercial sites.",

    Icon: ShieldCheckIcon,

  },

  {

    id: "coverage",

    title: "Serving South Africa",

    description:

      "Dam linings, steel water tanks and waterproofing projects for farms, mines, game lodges and commercial properties nationwide.",

    Icon: MapPinIcon,

  },

  {

    id: "clients",

    title: "Trusted by Property Owners",

    description:

      "Practical solutions for agricultural, mining, estate and commercial water storage with supplier-backed materials where applicable.",

    Icon: BuildingIcon,

  },

] as const;



const WHAT_WE_DO = [

  {

    id: "dam-linings",

    title: "Earth Dam Linings",

    description:

      "HDPE, PVC and bitumen torch-on lining for agricultural farm dams, mining ponds and irrigation storage nationwide.",

    href: "/dam-liners",

    cta: "Dam linings",

    Icon: LayersIcon,

  },

  {

    id: "steel-tanks",

    title: "Steel Water Tanks",

    description:

      "Corrugated galvanised reservoirs from 11 kL to 500 kL+ with PVC lining, columns and optional roofs.",

    href: "/steel-water-storage-tanks",

    cta: "Steel water tanks",

    Icon: ReservoirIcon,

  },

  {

    id: "waterproofing",

    title: "Waterproofing",

    description:

      "Bitumen torch-on and maintenance for roofs, foundations and retaining structures on farms and commercial buildings.",

    href: "/bitumen-waterproofing",

    cta: "Waterproofing",

    Icon: DropletIcon,

  },

] as const;



const SPECIALISED_SERVICES = [

  "Steel water storage tanks with custom sizes, roofs and support columns",

  "HDPE geomembrane linings for large gravel and farm dams",

  "PVC linings for ponds and zinc reservoirs",

  "Expert waterproofing from roofs to foundations",

  "Bitumen waterproofing for slab roofs and cement or gravel dams",

  "Preventative maintenance with regular inspections and upkeep",

] as const;



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



      <PageOverviewSection intro={ABOUT_CONTENT.intro} image={SITE_IMAGES.about}>

        <div className="site-prose-sections">

          <article className="site-prose-card">

            <h2 className="page-section-header__title">Who Are We?</h2>

            <span className="page-section-header__divider" aria-hidden />

            <p className="site-prose-card__text">

              We are your trusted experts in earth dam linings, waterproofing and

              steel water storage tank suppliers with over 30 years of experience

              in the industry. With a legacy rooted in excellence, we deliver

              innovative solutions that safeguard your investment and enhance its

              longevity.

            </p>

          </article>

          <article className="site-prose-card">

            <h2 className="page-section-header__title">Our Mission</h2>

            <span className="page-section-header__divider" aria-hidden />

            <p className="site-prose-card__text">

              To provide top-tier waterproofing and lining solutions that stand the

              test of time. We strive to exceed our clients&apos; expectations by

              offering reliable, effective and tailored services — whether you need

              advanced earth dam linings for large-scale dams or expert waterproofing

              for roofs and foundations.

            </p>

          </article>

        </div>

      </PageOverviewSection>



      <SiteSection tone="muted">
        <TrustCardGrid
          items={ABOUT_TRUST_CARDS}
          heading="Experience You Can Trust"
          eyebrow="WHY DAMTECH"
          intro="Damtech delivers practical dam linings, waterproofing and water storage solutions with a focus on long-term leak prevention and reliable workmanship."
        />
      </SiteSection>



      <ServiceProseSections sections={ABOUT_CONTENT.sections.slice(0, 2)} />



      <InfoCardGrid

        items={WHAT_WE_DO}

        heading="What We Do"

        eyebrow="OUR SERVICES"

        intro="Dam linings, steel water tanks and waterproofing for farms, mines and commercial properties."

        tone="default"

      />



      <BenefitCardGrid

        items={SPECIALISED_SERVICES}

        heading="Specialised Services"

        eyebrow="WHAT WE DELIVER"

        tone="muted"

      />



      <ServiceProseSections sections={ABOUT_CONTENT.sections.slice(2)} />



      <ServiceFaqSection faqs={ABOUT_CONTENT.faqs} />



      <SiteSection tone="muted">

        <RelatedServicesGrid

          links={RELATED_SERVICE_LINKS}

          heading="Explore Damtech Services"

          excludeHref="/about-us-waterproofing-company"

          nested

        />

        <div className="mt-10 flex flex-wrap gap-3">

          <Link href="/services" className="btn-primary">

            View All Services

          </Link>

          <Link href="/projects" className="btn-secondary">

            Project Case Studies

          </Link>

          <Link href="/quote" className="btn-secondary">

            Request a Quote

          </Link>

        </div>

      </SiteSection>



      <InternalServiceLinks currentPath="/about-us-waterproofing-company" />

      <CTA title="Request a Quote Today" />

    </>

  );

}

