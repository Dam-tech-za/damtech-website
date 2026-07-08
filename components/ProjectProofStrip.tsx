import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";
import { ProjectCard } from "@/components/ProjectCard";
import { SiteSection } from "@/components/SiteSection";
import { PROJECT_CASE_STUDIES } from "@/lib/projects";

export type ProjectProofItem = {
  href: string;
  location: string;
  detail: string;
};

type ProjectProofStripProps = {
  title?: string;
  eyebrow?: string;
  intro?: string;
  projects: readonly ProjectProofItem[];
};

export function ProjectProofStrip({
  title = "Recent project work",
  eyebrow = "OUR PROJECTS",
  intro = "Quality materials, expert installation and practical solutions for dam linings, waterproofing and water storage.",
  projects,
}: ProjectProofStripProps) {
  const caseStudies = projects
    .map((project) =>
      PROJECT_CASE_STUDIES.find((study) => `/projects/${study.slug}` === project.href),
    )
    .filter((study): study is NonNullable<typeof study> => Boolean(study));

  if (caseStudies.length === 0) return null;

  return (
    <SiteSection tone="muted" aria-labelledby="project-proof-heading">
      <div className="home-process-projects__projects-header">
        <header className="home-process-projects__projects-heading">
          <p className="home-process-projects__eyebrow">{eyebrow}</p>
          <h2 id="project-proof-heading" className="home-process-projects__title">
            {title}
          </h2>
          <span className="home-process-projects__divider" aria-hidden />
          {intro ? <p className="home-process-projects__intro">{intro}</p> : null}
        </header>
        <Link href="/projects" className="home-process-projects__all-link">
          View all Damtech projects
          <ArrowRightIcon
            className="home-process-projects__all-link-icon"
            aria-hidden
          />
        </Link>
      </div>

      <ul className="home-process-projects__project-grid">
        {caseStudies.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </SiteSection>
  );
}
