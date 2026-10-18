import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CogIcon,
  DropletIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@/components/icons/StrokeIcons";
import { SITE_IMAGES } from "@/lib/images";
import { phoneTel, siteConfig } from "@/lib/site";

const HERO_EYEBROW = "SOUTH AFRICA'S DAM LINING & WATER STORAGE SPECIALISTS";

const HERO_DESCRIPTION =
  "HDPE and PVC dam linings, corrugated steel reservoirs and waterproofing solutions for farms, mines, estates and commercial properties.";

const TRUST_ITEMS = [
  {
    id: "materials",
    title: "Quality Materials",
    detail: "HDPE & PVC Linings",
    Icon: ShieldCheckIcon,
  },
  {
    id: "leak",
    title: "Leak Prevention",
    detail: "Proven Waterproofing",
    Icon: DropletIcon,
  },
  {
    id: "installation",
    title: "Expert Installation",
    detail: "Professional Team",
    Icon: CogIcon,
  },
  {
    id: "endure",
    title: "Built to Endure",
    detail: "Long-Term Performance",
    Icon: CheckCircleIcon,
  },
] as const;

/**
 * Homepage hero — full-bleed site photograph (crew lining an earth dam) with an
 * oversized Damtech wordmark in the sky. On mobile the supporting copy and CTAs
 * drop below the photo onto a light panel so the photograph stays visible.
 */
export function HomeHero() {
  const heroImage = SITE_IMAGES.homeHeroInstall;

  return (
    <section
      className="dt-hero"
      aria-label="Dam lining and water storage solutions in the Western Cape"
    >
      <div className="dt-hero__stage">
        <div className="dt-hero__media" aria-hidden>
          <Image
            src={heroImage.image}
            alt={heroImage.alt}
            fill
            priority
            fetchPriority="high"
            placeholder="blur"
            sizes="100vw"
            className="dt-hero__image"
          />
        </div>
        <div className="dt-hero__scrim" aria-hidden />
        <p className="dt-hero__wordmark" aria-hidden>
          Damtech
        </p>

        <div className="dt-hero__headline site-shell">
          <p className="dt-hero__eyebrow">{HERO_EYEBROW}</p>
          <h1 className="dt-hero__title">
            <span className="dt-hero__title-line">
              Damtech <span className="dt-hero__accent">Dam Lining</span>
              {" "}&amp;{" "}
            </span>
            <span className="dt-hero__title-line">
              Water Storage
              <span> Solutions</span>
            </span>
            <span className="dt-hero__title-line">Built to Last</span>
          </h1>
        </div>
      </div>

      <div className="dt-hero__details">
        <div className="dt-hero__details-inner">
          <p className="dt-hero__description">{HERO_DESCRIPTION}</p>

          <div className="dt-hero__actions">
            <Link href="/quote" className="dt-btn dt-btn--cyan dt-btn--lg">
              Request a Free Quote
              <ArrowRightIcon className="dt-btn__icon" aria-hidden />
            </Link>
            <Link href="/services" className="dt-btn dt-btn--ghost dt-btn--lg">
              View Our Services
            </Link>
          </div>

          <p className="dt-hero__phone">
            <PhoneIcon className="dt-hero__phone-icon" aria-hidden />
            <span>
              Prefer to speak directly?{" "}
              <a href={`tel:${phoneTel}`} className="dt-hero__phone-link">
                {siteConfig.phone}
              </a>
            </span>
          </p>
        </div>
      </div>

      <ul className="dt-hero__trust">
        {TRUST_ITEMS.map((item) => (
          <li key={item.id} className="dt-hero__trust-item">
            <item.Icon className="dt-hero__trust-icon" aria-hidden />
            <span className="dt-hero__trust-title">{item.title}</span>
            <span className="dt-hero__trust-detail">{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
