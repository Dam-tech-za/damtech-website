import Image from "next/image";
import Link from "next/link";
import { SITE_IMAGES } from "@/lib/images";
import { PAGE_SEO } from "@/lib/pages";
import { phoneTel, siteConfig } from "@/lib/site";

const HERO_EYEBROW = "Dam Lining & Water Storage Contractors";

const HERO_DESCRIPTION =
  "HDPE and PVC dam liners, corrugated steel reservoirs and waterproofing solutions for farms, mines, estates and commercial properties.";

const TRUST_ITEMS = [
  "30+ Years' Experience",
  "Nationwide Service",
  "Material Warranty Available",
] as const;

const SERVICE_CHIPS = [
  { label: "HDPE Dam Lining", href: "/hdpe-dam-lining" },
  { label: "PVC Dam Lining", href: "/pvc-dam-lining" },
  { label: "Reservoir Liners", href: "/reservoir-lining" },
  { label: "Waterproofing", href: "/bitumen-waterproofing" },
  { label: "Leak Repairs", href: "/dam-repair-services" },
] as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="home-hero__trust-icon">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HeroHeading({ title }: { title: string }) {
  const parts = title.split(/(Dam Lining)/g);

  return (
    <h1 className="home-hero__title">
      {parts.map((part, index) =>
        part === "Dam Lining" ? (
          <span key={index} className="home-hero__accent">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </h1>
  );
}

/** Homepage hero — background image with left-aligned contractor content only. */
export function HomeHero() {
  const { homeHero } = SITE_IMAGES;
  const title = PAGE_SEO.home.h1;

  return (
    <section className="home-hero" aria-label="Hero">
      <div className="home-hero__media" aria-hidden>
        <Image
          src={homeHero.image}
          alt=""
          fill
          priority
          fetchPriority="high"
          placeholder="blur"
          sizes="100vw"
          className="home-hero__image"
        />
      </div>

      <div className="home-hero__inner site-container">
        <div className="home-hero__copy">
          <p className="home-hero__eyebrow">{HERO_EYEBROW}</p>
          <HeroHeading title={title} />
          <p className="home-hero__description">{HERO_DESCRIPTION}</p>

          <div className="home-hero__actions">
            <Link href="/quote" className="home-hero__btn home-hero__btn--primary">
              Request a Free Quote
            </Link>
            <Link href="/dam-liners" className="home-hero__btn home-hero__btn--secondary">
              View Dam Lining Services
            </Link>
          </div>

          <p className="home-hero__phone">
            <span className="home-hero__phone-prompt">Prefer to speak directly? Call </span>
            <a href={`tel:${phoneTel}`} className="home-hero__phone-link">
              {siteConfig.phone}
            </a>
          </p>

          <ul className="home-hero__chips">
            {SERVICE_CHIPS.map((chip) => (
              <li key={chip.href}>
                <Link href={chip.href} className="home-hero__chip">
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="home-hero__trust">
            {TRUST_ITEMS.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
