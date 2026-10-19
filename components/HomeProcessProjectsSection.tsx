import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";
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
  },
  {
    id: "inspection",
    step: 2,
    title: "Site Inspection",
    description:
      "A Damtech specialist can visit your site to assess the area, application and project requirements. Free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; elsewhere we confirm the call-out fee first.",
    note: "Thorough. Practical. Honest.",
  },
  {
    id: "solution",
    step: 3,
    title: "Tailored Solution",
    description:
      "We recommend a suitable dam lining, waterproofing or water storage solution based on your site conditions and needs.",
    note: "Clear recommendations.",
  },
  {
    id: "delivery",
    step: 4,
    title: "Service Delivery",
    description:
      "Our team delivers the agreed service with practical workmanship, clear communication and attention to detail.",
    note: "On time. On standard.",
  },
] as const;

/** Homepage process (dark numbered band) + editorial featured-project grid. */
export function HomeProcessProjectsSection() {
  const featuredProjects = getFeaturedHomeProjects();

  return (
    <>
      <section className="dt-process" aria-labelledby="damtech-process-heading">
        <div className="site-shell">
          <header className="dt-split-header dt-split-header--dark">
            <div>
              <p className="dt-eyebrow dt-eyebrow--cyan">HOW IT WORKS</p>
              <h2 id="damtech-process-heading" className="dt-display dt-display--xl">
                Our Simple <span className="dt-nowrap">4-Step</span> Process
              </h2>
            </div>
            <p className="dt-lede">
              From your first enquiry to final handover, Damtech keeps the process
              clear, practical and hassle-free.
            </p>
          </header>

          <ol className="dt-process__steps">
            {PROCESS_STEPS.map((step) => (
              <li key={step.id} className="dt-process__step">
                <span className="dt-process__number" aria-hidden>
                  {String(step.step).padStart(2, "0")}
                </span>
                <h3 className="dt-process__title">{step.title}</h3>
                <p className="dt-process__text">{step.description}</p>
                <p className="dt-process__note">{step.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dt-projects" aria-labelledby="damtech-projects-heading">
        <div className="site-shell">
          <header className="dt-split-header">
            <div>
              <p className="dt-eyebrow">OUR PROJECTS</p>
              <h2 id="damtech-projects-heading" className="dt-display dt-display--xl">
                Explore Some Of Our Work
              </h2>
            </div>
            <div className="dt-split-header__aside">
              <p className="dt-lede">
                Quality materials, expert installation and practical solutions for
                dam linings, waterproofing and water storage projects.
              </p>
              <Link href="/projects" className="dt-arrow-link">
                View all Damtech projects
                <ArrowRightIcon className="dt-arrow-link__icon" aria-hidden />
              </Link>
            </div>
          </header>

          <ul className="dt-projects__grid">
            {featuredProjects.map((project, index) => {
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
                project.homepageLinkLabel ?? `View ${project.title} project`;
              const sizes =
                index === 0
                  ? "(max-width: 767px) 100vw, 66vw"
                  : "(max-width: 767px) 100vw, 33vw";

              return (
                <li
                  key={project.slug}
                  className={`dt-project${index === 0 ? " dt-project--lead" : ""}`}
                >
                  <article className="dt-project__card">
                    <Link href={href} className="dt-project__media" tabIndex={-1}>
                      {typeof image === "string" ? (
                        <Image
                          src={image}
                          alt={alt}
                          fill
                          loading="lazy"
                          sizes={sizes}
                          className="dt-cover dt-project__image"
                        />
                      ) : (
                        <Image
                          src={image}
                          alt={alt}
                          fill
                          loading="lazy"
                          sizes={sizes}
                          placeholder="blur"
                          className="dt-cover dt-project__image"
                        />
                      )}
                    </Link>
                    <div className="dt-project__body">
                      <div className="dt-project__meta">
                        <h3 className="dt-project__location">{location}</h3>
                        {area ? <span className="dt-project__area">{area}</span> : null}
                      </div>
                      <p className="dt-project__service">{service}</p>
                      <Link href={href} className="dt-project__link">
                        {linkLabel}
                        <ArrowRightIcon className="dt-arrow-link__icon" aria-hidden />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
