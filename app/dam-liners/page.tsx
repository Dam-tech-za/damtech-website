import Link from "next/link";

import { ComparisonTable } from "@/components/ComparisonTable";

import { Hero } from "@/components/Hero";

import { BenefitCardGrid } from "@/components/BenefitCardGrid";

import { InfoCardGrid } from "@/components/InfoCardGrid";

import { PageSeo } from "@/components/PageSeo";

import { ProcessStepsSection } from "@/components/ProcessStepsSection";

import { ProjectProofStrip } from "@/components/ProjectProofStrip";

import { SectionCta } from "@/components/SectionCta";

import { SiteSection } from "@/components/SiteSection";

import {

  RelatedPageLinks,

  ServiceFaqSection,

  ServiceProseSections,

} from "@/components/ServicePageSections";

import {

  DropletIcon,

  LayersIcon,

} from "@/components/icons/StrokeIcons";

import {

  LazyCTA as CTA,

  LazyInternalServiceLinks as InternalServiceLinks,

} from "@/components/lazy";

import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";

import { createPageMetadata, PAGE_SEO } from "@/lib/pages";

import { SITE_IMAGES } from "@/lib/images";

import { PROJECTS } from "@/lib/site";

import {

  DAM_LINERS_CONTENT,

  DAM_LINERS_SCHEMA_OFFERS,

} from "@/lib/service-pages-content";

import { PageOverviewSection } from "@/components/PageOverviewSection";



const seo = PAGE_SEO["dam-liners"];



export const metadata = createPageMetadata(seo);



const LINER_TYPES = [

  {

    id: "hdpe",

    title: "HDPE",

    href: "/hdpe-dam-lining",

    summary:

      "High tensile strength, UV resistance and puncture resistance — ideal for large farm and mining dams.",

    sizes: "1 mm, 1.5 mm and 2 mm",

    uses: "Earth dams, mining ponds, irrigation storage",

    lifespan: "20–30 years",

    Icon: LayersIcon,

  },

  {

    id: "bitumen",

    title: "Bitumen Torch-On",

    href: "/torch-on-dam-lining",

    summary:

      "Heat-bonded membrane with strong adhesion to prepared cement and rigid dam surfaces.",

    sizes: "3 mm and 4 mm",

    uses: "Cement dams, canals, rigid reservoirs",

    lifespan: "15–20 years",

    Icon: DropletIcon,

  },

  {

    id: "pvc",

    title: "PVC",

    href: "/pvc-dam-lining",

    summary:

      "Flexible dam lining for ponds, steel tanks and smaller reservoirs where ease of handling matters.",

    sizes: "550–850 gsm",

    uses: "Steel tanks, ponds, small reservoirs",

    lifespan: "10–15 years",

    Icon: LayersIcon,

  },

];



const DAM_PROJECTS = PROJECTS.filter((project) =>

  project.detail.includes("HDPE") || project.detail.includes("Bitumen"),

);



const DAM_BENEFITS = [

  "Expert installation by certified professionals",

  "Top-quality materials from leading local suppliers",

  "Custom solutions tailored to your requirements",

  "Dedicated support from consultation to completion",

  "Competitive pricing with high-value outcomes",

  "Supplier-backed material warranty where applicable",

] as const;



export default function DamLinersPage() {

  const breadcrumbs = [

    { name: "Home", path: "/" },

    { name: "Services", path: "/services" },

    { name: "Dam Linings", path: seo.path },

  ];



  return (

    <>

      <PageSeo

        breadcrumbs={breadcrumbs}

        schemas={[

          createServiceSchema({

            name: seo.serviceName ?? seo.title,

            serviceType: seo.serviceName ?? "Dam Linings",

            description: seo.description,

            path: seo.path,

            offers: [...DAM_LINERS_SCHEMA_OFFERS],

          }),

          createFaqPageSchema(DAM_LINERS_CONTENT.faqs),

        ]}

      />



      <Hero

        compact

        eyebrow="HDPE · PVC · Bitumen"

        title={seo.h1}

        description="Damtech supplies and installs HDPE, PVC and torch-on dam linings for earth dams, reservoirs, ponds and water storage applications across South Africa."

        breadcrumbs={breadcrumbs}

      />



      <PageOverviewSection intro={DAM_LINERS_CONTENT.intro} image={SITE_IMAGES.damLiners}>

        <ServiceProseSections

          sections={[DAM_LINERS_CONTENT.sections[0]!]}

          nested

          tone="default"

        />

      </PageOverviewSection>



      <SiteSection tone="muted">

        <ComparisonTable

          title="At-a-glance comparison"

          columns={[

            { key: "type", label: "Lining type" },

            { key: "sizes", label: "Sizes" },

            { key: "uses", label: "Best for" },

            { key: "lifespan", label: "Typical lifespan" },

          ]}

          rows={LINER_TYPES.map((liner) => ({

            type: liner.title,

            sizes: liner.sizes,

            uses: liner.uses,

            lifespan: liner.lifespan,

          }))}

        />

      </SiteSection>



      <InfoCardGrid

        items={LINER_TYPES.map((liner) => ({

          id: liner.id,

          title: liner.title,

          description: liner.summary,

          href: liner.href,

          cta: "Learn more",

          Icon: liner.Icon,

        }))}

        heading="Compare Dam Lining Types"

        eyebrow="MATERIAL OPTIONS"

        intro="HDPE, PVC and bitumen torch-on dam linings for farms, mines, game lodges and commercial water storage."

      />



      <BenefitCardGrid

        items={DAM_BENEFITS}

        heading="Why Choose Damtech?"

        eyebrow="WHY DAMTECH"

        intro="Practical dam lining installation with supplier-backed materials and clear communication from quote to handover."

        tone="default"

      />



      <SiteSection tone="muted">

        <SectionCta

          title="Not sure which liner fits your dam?"

          description="Share photos, approximate dimensions and how you use stored water — we will recommend HDPE, PVC or bitumen torch-on."

        />

      </SiteSection>



      <ServiceProseSections sections={DAM_LINERS_CONTENT.sections.slice(1)} />



      <ProcessStepsSection />



      <ProjectProofStrip title="Dam lining projects" projects={DAM_PROJECTS} />



      <ServiceFaqSection faqs={DAM_LINERS_CONTENT.faqs} />



      <SiteSection tone="muted">

        <RelatedPageLinks links={DAM_LINERS_CONTENT.relatedLinks} />

      </SiteSection>



      <InternalServiceLinks currentPath={seo.path} />

      <CTA

        title="Have Questions About Your Dam?"

        description="Call us on +27 82 853 1026 or submit our quote form with dam dimensions and photos for a tailored liner recommendation."

      />

    </>

  );

}

