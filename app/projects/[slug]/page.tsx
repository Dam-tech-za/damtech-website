import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProjectDetailBody } from "@/components/ProjectDetailBody";
import { createMetadata, createProjectCaseStudySchema } from "@/lib/seo";
import { getProjectBySlug, getProjectSlugs } from "@/lib/projects";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";

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

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: project.title, path: `/projects/${project.slug}` },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={createProjectCaseStudySchema({
          title: project.title,
          description: project.seo.description,
          path: `/projects/${project.slug}`,
          location: project.location,
          serviceType: project.serviceType,
          images: project.images,
        })}
      />

      <Hero
        compact
        eyebrow={project.location}
        title={project.h1}
        description={project.summary}
        breadcrumbs={breadcrumbs}
      />

      <ProjectDetailBody project={project} />

      <InternalServiceLinks heading="Explore Damtech Services" />
      <CTA
        title="Request a Similar Quote"
        description="Share your location, service requirements and project scope — our team will recommend a practical dam lining, waterproofing or water storage solution."
      />
    </>
  );
}
