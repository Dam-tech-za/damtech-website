import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";
import type { ProjectCaseStudy } from "@/lib/projects";

type ProjectCardProps = {
  project: ProjectCaseStudy;
};

/** Image-led project card — matches homepage featured project cards. */
export function ProjectCard({ project }: ProjectCardProps) {
  const image = project.images[0];
  const href = `/projects/${project.slug}`;

  return (
    <article className="home-process-projects__project-card">
      <Link href={href} className="home-process-projects__project-media">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            loading="lazy"
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="home-process-projects__project-image"
          />
        ) : null}
      </Link>
      <div className="home-process-projects__project-body">
        <div className="home-process-projects__project-meta">
          <p className="home-process-projects__project-location">
            {project.location}
          </p>
          {project.province ? (
            <p className="home-process-projects__project-service">
              {project.province}
            </p>
          ) : null}
          <p className="home-process-projects__project-service">
            {project.serviceType}
          </p>
        </div>
        <h2 className="subsection-heading !mt-0 text-lg font-semibold text-navy">
          <Link href={href} className="hover:text-water">
            {project.title}
          </Link>
        </h2>
        <p className="home-process-projects__project-service">{project.material}</p>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">
          {project.summary}
        </p>
        <Link href={href} className="home-process-projects__project-link">
          View project
          <ArrowRightIcon
            className="home-process-projects__project-link-icon"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
