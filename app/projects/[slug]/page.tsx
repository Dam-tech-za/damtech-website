import { notFound } from "next/navigation";
import Link from "next/link";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageSeo } from "@/components/PageSeo";
import { ProjectGallery } from "@/components/ProjectGallery";
import { createMetadata } from "@/lib/seo";
import { getProjectBySlug, getProjectSlugs } from "@/lib/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return createMetadata({
    title: project.seo.title,
    description: project.seo.description,
    path: `/projects/${project.slug}`,
    image: project.images[0]?.src,
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.slug}` },
        ]}
      />

      <Hero compact title={project.h1} description={project.summary} />

      <section className="content-wrap">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Location", value: project.location },
            { label: "Service", value: project.serviceType },
            { label: "Material", value: project.material },
            { label: "Scope", value: project.scope },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-navy">{item.value}</dd>
            </div>
          ))}
        </dl>

        {project.todo && project.todo.length > 0 ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Editor note:</strong> {project.todo.join(" · ")}
          </p>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-heading">Challenge</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">{project.challenge}</p>
          </div>
          <div>
            <h2 className="section-heading">Solution</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">{project.solution}</p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="section-heading">Result</h2>
          <p className="mt-4 max-w-3xl text-slate-600 leading-relaxed">{project.result}</p>
        </div>

        <div className="mt-12">
          <h2 className="section-heading">Project Gallery</h2>
          <div className="mt-6">
            <ProjectGallery images={project.images} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="section-heading">Related Services</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {project.relatedServices.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-water hover:text-water"
                >
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <InternalServiceLinks heading="Explore Damtech Services" />
      <CTA
        title="Planning a similar project?"
        description="Share your location, liner or tank requirements and we will provide a tailored quote."
      />
    </>
  );
}
