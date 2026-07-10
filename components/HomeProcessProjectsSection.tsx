import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
} from "@/components/icons/StrokeIcons";
import { FEATURED_PROJECT_IMAGES } from "@/lib/images";
import { getFeaturedHomeProjects } from "@/lib/projects";

const PROCESS_STEPS = [
  {
    id: "quote",
    step: 1,
    title: "Request Your Free Quote",
    description:
      "Complete the contact form or call Damtech to schedule a free quote and project discussion.",
    note: "No obligation. No pressure.",
    Icon: FileTextIcon,
  },
  {
    id: "inspection",
    step: 2,
    title: "Free Site Inspection",
    description:
      "A Damtech specialist can visit your site to assess the area, application and project requirements.",
    note: "Thorough. Practical. Honest.",
    Icon: SearchIcon,
  },
  {
    id: "solution",
    step: 3,
    title: "Tailored Solution",
    description:
      "We recommend a suitable dam lining, waterproofing or water storage solution based on your site conditions and needs.",
    note: "Clear recommendations.",
    Icon: LayersIcon,
  },
  {
    id: "delivery",
    step: 4,
    title: "Service Delivery",
    description:
      "Our team delivers the agreed service with practical workmanship, clear communication and attention to detail.",
    note: "On time. On standard.",
    Icon: CheckCircleIcon,
  },
] as const;

/** Homepage process + featured projects — below services/maintenance. */
export function HomeProcessProjectsSection() {
  const featuredProjects = getFeaturedHomeProjects();

  return (
    <section
      className="home-process-projects"
      aria-labelledby="damtech-process-heading"
    >
      <div className="home-process-projects__inner">
        <div className="home-process-projects__process">
          <span className="home-process-projects__decor" aria-hidden />

          <header className="home-process-projects__header">
            <p className="home-process-projects__eyebrow">HOW IT WORKS</p>
            <h2 id="damtech-process-heading" className="home-process-projects__title">
              Our Simple 4-Step Process
            </h2>
            <span className="home-process-projects__divider" aria-hidden />
            <p className="home-process-projects__intro">
              From your first enquiry to final handover, Damtech keeps the process
              clear, practical and hassle-free.
            </p>
          </header>

          <ol className="home-process-projects__steps">
            {PROCESS_STEPS.map((step) => (
              <li key={step.id} className="home-process-projects__step-item">
                <article className="home-process-projects__step">
                  <div className="home-process-projects__step-top">
                    <span className="home-process-projects__step-number" aria-hidden>
                      {step.step}
                    </span>
                    <span className="home-process-projects__step-icon-wrap" aria-hidden>
                      <step.Icon className="home-process-projects__step-icon" />
                    </span>
                  </div>
                  <h3 className="home-process-projects__step-title">{step.title}</h3>
                  <p className="home-process-projects__step-text">
                    {step.description}
                  </p>
                  <p className="home-process-projects__step-note">{step.note}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>

        <div className="home-process-projects__projects">
          <header className="home-process-projects__projects-header">
            <div className="home-process-projects__projects-heading">
              <p className="home-process-projects__eyebrow">OUR PROJECTS</p>
              <h2
                id="damtech-projects-heading"
                className="home-process-projects__title"
              >
                Explore Some Of Our Work
              </h2>
              <span className="home-process-projects__divider" aria-hidden />
              <p className="home-process-projects__intro">
                Quality materials, expert installation and practical solutions for
                dam linings, waterproofing and water storage projects.
              </p>
            </div>
            <Link href="/projects" className="home-process-projects__all-link">
              View all Damtech projects
              <ArrowRightIcon
                className="home-process-projects__all-link-icon"
                aria-hidden
              />
            </Link>
          </header>

          <ul className="home-process-projects__project-grid">
            {featuredProjects.map((project) => {
              const href = `/projects/${project.slug}`;
              const image =
                FEATURED_PROJECT_IMAGES[
                  project.slug as keyof typeof FEATURED_PROJECT_IMAGES
                ] ?? project.images[0]?.src;
              const alt = project.images[0]?.alt ?? project.title;
              const location =
                project.homepageLocationLabel ??
                project.location.split(",")[0]?.trim() ??
                project.location;
              const area = project.featuredArea ?? "";
              const service =
                project.homepageServiceLabel ?? project.serviceType;
              const linkLabel =
                project.homepageLinkLabel ??
                `View ${project.title} project`;

              return (
                <li key={project.slug}>
                  <article className="home-process-projects__project-card">
                    <Link
                      href={href}
                      className="home-process-projects__project-media"
                    >
                      {typeof image === "string" ? (
                        <Image
                          src={image}
                          alt={alt}
                          fill
                          loading="lazy"
                          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          className="home-process-projects__project-image"
                        />
                      ) : (
                        <Image
                          src={image}
                          alt={alt}
                          fill
                          loading="lazy"
                          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          placeholder="blur"
                          className="home-process-projects__project-image"
                        />
                      )}
                    </Link>
                    <div className="home-process-projects__project-body">
                      <div className="home-process-projects__project-meta">
                        <h3 className="home-process-projects__project-location">
                          {location}
                        </h3>
                        {area ? (
                          <span className="home-process-projects__project-area">
                            {area}
                          </span>
                        ) : null}
                      </div>
                      <p className="home-process-projects__project-service">
                        {service}
                      </p>
                      <Link
                        href={href}
                        className="home-process-projects__project-link"
                      >
                        {linkLabel}
                        <ArrowRightIcon
                          className="home-process-projects__project-link-icon"
                          aria-hidden
                        />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
