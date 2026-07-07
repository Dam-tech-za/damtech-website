import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata } from "@/lib/pages";
import {
  PROJECT_CASE_STUDIES,
  PROJECTS_INDEX_SEO,
} from "@/lib/projects";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

export const metadata = createPageMetadata(PROJECTS_INDEX_SEO);

export default function ProjectsIndexPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} />

      <Hero
        compact
        eyebrow="Case studies"
        title={PROJECTS_INDEX_SEO.h1}
        description="Case studies from Damtech dam liner, steel tank and waterproofing work across South Africa — farms, game lodges, fruit districts and industrial yards."
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="content-grid">
          {PROJECT_CASE_STUDIES.map((project) => (
            <article
              key={project.slug}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-water/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {project.location}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-navy">
                <Link
                  href={`/projects/${project.slug}`}
                  className="hover:text-water"
                >
                  {project.title}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{project.summary}</p>
              <p className="mt-3 text-sm font-medium text-water">
                {project.serviceType} · {project.material}
              </p>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-4 inline-flex text-sm font-semibold text-navy hover:text-water"
              >
                View project →
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/quote" className="btn-primary">
            Need similar work? Request a Free Quote
          </Link>
        </div>
      </section>

      <CTA />
    </>
  );
}
