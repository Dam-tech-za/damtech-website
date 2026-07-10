import type { ProjectCaseStudy } from "@/lib/projects";
import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { resolveRelatedLinks } from "@/lib/related-services";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";
import { CheckCircleIcon } from "@/components/icons/StrokeIcons";
import { LazyProjectGallery as ProjectGallery } from "@/components/lazy";

type ProjectDetailBodyProps = {
  project: ProjectCaseStudy;
};

/** Homepage-style project case study body below hero. */
export function ProjectDetailBody({ project }: ProjectDetailBodyProps) {
  const stats = [
    { label: "Location", value: project.location },
    { label: "Service", value: project.serviceType },
    { label: "Material", value: project.material },
    { label: "Scope", value: project.scope },
    // Only render when confirmed values exist — no placeholder dates/durations.
    ...(project.completedDate
      ? [{ label: "Completed", value: project.completedDate }]
      : []),
    ...(typeof project.durationDays === "number"
      ? [{ label: "Duration", value: `${project.durationDays} days` }]
      : []),
  ];

  const contentSections = [
    { id: "background", heading: "Background", text: project.background },
    { id: "site-conditions", heading: "Site Conditions", text: project.siteConditions },
    { id: "challenge", heading: "Challenge", text: project.challenge },
    { id: "our-approach", heading: "Our Approach", text: project.approach },
    { id: "result", heading: "Result", text: project.result },
  ];

  return (
    <>
      <SiteSection>
        <dl className="home-why-choose__cards site-card-grid site-card-grid--stats">
          {stats.map((item) => (
            <div key={item.label} className="home-why-choose__card">
              <dt className="home-why-choose__card-title">{item.label}</dt>
              <span className="home-why-choose__card-accent" aria-hidden />
              <dd className="home-why-choose__card-text">{item.value}</dd>
            </div>
          ))}
        </dl>

        {project.todo && project.todo.length > 0 ? (
          <p className="site-editor-note">
            <strong>Editor note:</strong> {project.todo.join(" · ")}
          </p>
        ) : null}
      </SiteSection>

      <SiteSection tone="muted">
        <div className="site-prose-sections">
          {contentSections.slice(0, 2).map((section) => (
            <article key={section.id} className="site-prose-card">
              <PageSectionHeader
                id={section.id}
                title={section.heading}
                eyebrow="PROJECT DETAIL"
              />
              <p className="site-prose-card__text">{section.text}</p>
            </article>
          ))}

          <div className="site-overview site-overview--split">
            {contentSections.slice(2, 4).map((section) => (
              <article key={section.id} className="site-prose-card">
                <PageSectionHeader id={section.id} title={section.heading} />
                <p className="site-prose-card__text">{section.text}</p>
              </article>
            ))}
          </div>

          <article className="site-prose-card">
            <PageSectionHeader id="result" title="Result" eyebrow="OUTCOME" />
            <p className="site-prose-card__text">{project.result}</p>
            {project.outcomes.length > 0 ? (
              <ul className="home-why-choose__cards site-card-grid site-card-grid--compact">
                {project.outcomes.map((outcome) => (
                  <li key={outcome} className="home-why-choose__card">
                    <span className="home-why-choose__card-icon-wrap" aria-hidden>
                      <CheckCircleIcon className="home-why-choose__card-icon" />
                    </span>
                    <p className="home-why-choose__card-text">{outcome}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </div>
      </SiteSection>

      <SiteSection>
        <PageSectionHeader
          id="project-gallery"
          eyebrow="PROJECT GALLERY"
          title="On-Site Installation"
          intro={
            project.galleryIntro ??
            `Photos from Damtech's ${project.serviceType} work at ${project.location}.`
          }
        />
        <div className="site-gallery-wrap">
          <ProjectGallery images={project.images} />
        </div>
      </SiteSection>

      <RelatedServicesGrid
        links={resolveRelatedLinks(project.relatedServices)}
        heading="Related Services"
        eyebrow="EXPLORE SERVICES"
        intro="Dam linings, waterproofing and water storage services related to this project."
      />
    </>
  );
}
