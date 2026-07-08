import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
} from "@/components/icons/StrokeIcons";
import bitumenWaterproofingRoof from "@/public/images/bitumen-waterproofing-roof-reservoir-repair.webp";
import hdpeDamLinerInstallationLimpopo from "@/public/images/hdpe-dam-liner-installation-limpopo.webp";
import hdpeLinedFarmReservoirCattle from "@/public/images/hdpe-lined-farm-reservoir-cattle-south-africa.webp";

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

type FeaturedProject = {
  id: string;
  location: string;
  service: string;
  area: string;
  href: string;
  linkLabel: string;
  image: StaticImageData;
  alt: string;
};

const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: "hartswater",
    location: "Hartswater",
    service: "HDPE Dam Lining",
    area: "3,472 m²",
    href: "/projects/hartswater-hdpe-dam-liner",
    linkLabel: "View Hartswater HDPE dam lining project",
    image: hdpeDamLinerInstallationLimpopo,
    alt: "HDPE dam lining project completed by Damtech in Hartswater, South Africa",
  },
  {
    id: "grabouw",
    location: "Grabouw",
    service: "HDPE Dam Lining",
    area: "10,520 m²",
    href: "/projects/grabouw-hdpe-farm-dam",
    linkLabel: "View Grabouw HDPE dam lining project",
    image: hdpeLinedFarmReservoirCattle,
    alt: "Large HDPE dam lining installation for water storage in Grabouw",
  },
  {
    id: "hoedspruit",
    location: "Hoedspruit",
    service: "Bitumen Torch-On",
    area: "9,240 m²",
    href: "/projects/hoedspruit-bitumen-dam-lining",
    linkLabel: "View Hoedspruit bitumen torch-on waterproofing project",
    image: bitumenWaterproofingRoof,
    alt: "Bitumen torch-on waterproofing project completed by Damtech in Hoedspruit",
  },
];

/** Homepage process + featured projects — below services/maintenance. */
export function HomeProcessProjectsSection() {
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
            {PROCESS_STEPS.map((step, index) => (
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
                {index < PROCESS_STEPS.length - 1 ? (
                  <span
                    className="home-process-projects__connector"
                    aria-hidden
                  >
                    <ArrowRightIcon className="home-process-projects__connector-icon" />
                  </span>
                ) : null}
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
            {FEATURED_PROJECTS.map((project) => (
              <li key={project.id}>
                <article className="home-process-projects__project-card">
                  <Link
                    href={project.href}
                    className="home-process-projects__project-media"
                  >
                    <Image
                      src={project.image}
                      alt={project.alt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      placeholder="blur"
                      className="home-process-projects__project-image"
                    />
                  </Link>
                  <div className="home-process-projects__project-body">
                    <div className="home-process-projects__project-meta">
                      <h3 className="home-process-projects__project-location">
                        {project.location}
                      </h3>
                      <span className="home-process-projects__project-area">
                        {project.area}
                      </span>
                    </div>
                    <p className="home-process-projects__project-service">
                      {project.service}
                    </p>
                    <Link
                      href={project.href}
                      className="home-process-projects__project-link"
                    >
                      {project.linkLabel}
                      <ArrowRightIcon
                        className="home-process-projects__project-link-icon"
                        aria-hidden
                      />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
