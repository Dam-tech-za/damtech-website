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
    ...(project.province
      ? [{ label: "Province", value: project.province }]
      : []),
    ...(project.municipality
      ? [{ label: "Municipality", value: project.municipality }]
      : []),
    { label: "Service", value: project.serviceType },
    { label: "System", value: project.material },
    { label: "Scope", value: project.scope },
    ...(project.numberOfDams
      ? [{ label: "Dams", value: String(project.numberOfDams) }]
      : []),
    ...(project.damBreakdown?.length
      ? [
          {
            label: "Dam areas",
            value: project.damBreakdown
              .map((dam) => `${dam.label}: ${dam.area}`)
              .join(" · "),
          },
        ]
      : []),
    ...(project.completedDate
      ? [{ label: "Completed", value: project.completedDate }]
      : []),
    ...(typeof project.durationDays === "number"
      ? [{ label: "Duration", value: `${project.durationDays} days` }]
      : []),
  ].filter((item) => Boolean(item.value?.trim()));

  const contentSections = [
    { id: "overview", heading: "Overview", text: project.background },
    {
      id: "site-conditions",
      heading: "Site Conditions",
      text: project.siteConditions ?? "",
    },
    { id: "requirement", heading: "Requirement", text: project.challenge },
    { id: "our-approach", heading: "Our Approach", text: project.approach },
    { id: "result", heading: "Result", text: project.result },
  ].filter((section) => Boolean(section.text?.trim()));

  const overviewSections = contentSections.filter((section) =>
    ["overview", "site-conditions"].includes(section.id),
  );
  const midSections = contentSections.filter((section) =>
    ["requirement", "our-approach"].includes(section.id),
  );
  const resultSection = contentSections.find((section) => section.id === "result");

  return (
    <>
      {stats.length > 0 ? (
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
        </SiteSection>
      ) : null}

      <SiteSection tone="muted">
        <div className="site-prose-sections">
          {overviewSections.map((section) => (
            <article key={section.id} className="site-prose-card">
              <PageSectionHeader
                id={section.id}
                title={section.heading}
                eyebrow="PROJECT DETAIL"
              />
              <p className="site-prose-card__text">{section.text}</p>
            </article>
          ))}

          {midSections.length > 0 ? (
            <div className="site-overview site-overview--split">
              {midSections.map((section) => (
                <article key={section.id} className="site-prose-card">
                  <PageSectionHeader id={section.id} title={section.heading} />
                  <p className="site-prose-card__text">{section.text}</p>
                </article>
              ))}
            </div>
          ) : null}

          {resultSection ? (
            <article className="site-prose-card">
              <PageSectionHeader id="result" title="Result" eyebrow="OUTCOME" />
              <p className="site-prose-card__text">{resultSection.text}</p>
              {project.outcomes.length > 0 ? (
                <ul className="home-why-choose__cards site-card-grid site-card-grid--compact">
                  {project.outcomes.map((outcome) => (
                    <li key={outcome} className="home-why-choose__card">
                      <span
                        className="home-why-choose__card-icon-wrap"
                        aria-hidden
                      >
                        <CheckCircleIcon className="home-why-choose__card-icon" />
                      </span>
                      <p className="home-why-choose__card-text">{outcome}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ) : null}

          {project.warranty?.trim() ? (
            <article className="site-prose-card">
              <PageSectionHeader
                id="project-warranty"
                title="Project Warranty"
                eyebrow="WARRANTY"
              />
              <p className="site-prose-card__text">{project.warranty}</p>
            </article>
          ) : null}
        </div>
      </SiteSection>

      {project.images.length > 0 ? (
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
      ) : null}

      <RelatedServicesGrid
        links={resolveRelatedLinks(project.relatedServices)}
        heading="Related Services"
        eyebrow="EXPLORE SERVICES"
        intro="Dam linings, waterproofing and water storage services related to this project."
      />
    </>
  );
}
