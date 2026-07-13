import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProjectsIndexClient } from "@/components/ProjectsIndexClient";
import { SiteSection } from "@/components/SiteSection";
import { createPageMetadata } from "@/lib/pages";
import {
  getPublishedProjects,
  PROJECTS_INDEX_SEO,
} from "@/lib/projects";
import { LazyCTA as CTA } from "@/components/lazy";

export const metadata = createPageMetadata(PROJECTS_INDEX_SEO);

export default function ProjectsIndexPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
  ];

  const projects = getPublishedProjects();

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} />

      <Hero
        compact
        eyebrow="Case studies"
        title={PROJECTS_INDEX_SEO.h1}
        description="Case studies from Damtech dam lining, waterproofing and water storage projects completed for South African clients."
        breadcrumbs={breadcrumbs}
      />

      <SiteSection tone="muted">
        <ProjectsIndexClient projects={projects} />
        <div className="mt-12 text-center">
          <Link href="/quote" className="btn-primary">
            Need similar work? Request a Free Quote
          </Link>
        </div>
      </SiteSection>

      <CTA
        title="Request a Similar Quote"
        description="Share your dam lining, waterproofing or water storage requirements and our team will recommend a practical solution for your site."
      />
    </>
  );
}
