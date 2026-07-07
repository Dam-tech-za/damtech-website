import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CogIcon,
  DropletIcon,
  FileTextIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@/components/icons/StrokeIcons";
import { SITE_IMAGES } from "@/lib/images";
import { phoneTel, siteConfig } from "@/lib/site";

const HERO_EYEBROW = "SOUTH AFRICA'S DAM LINING & WATER STORAGE SPECIALISTS";

const HERO_DESCRIPTION =
  "HDPE and PVC dam liners, corrugated steel reservoirs and waterproofing solutions for farms, mines, estates and commercial properties.";

const TRUST_ITEMS = [
  {
    id: "materials",
    title: "Quality Materials",
    detail: "HDPE & PVC Liners",
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

/** Homepage hero — premium contractor layout with left-aligned conversion content. */
export function HomeHero() {
  const heroImage = SITE_IMAGES.homeHero;

  return (
    <section className="home-hero" aria-label="Hero">
      <div className="home-hero__media" aria-hidden>
        <Image
          src={heroImage.image}
          alt={heroImage.alt}
          fill
          priority
          fetchPriority="high"
          placeholder="blur"
          sizes="100vw"
          className="home-hero__image"
        />
      </div>

      <div className="home-hero__inner site-shell">
        <div className="home-hero__copy">
          <div className="home-hero__eyebrow-wrap">
            <p className="home-hero__eyebrow hero-kicker">{HERO_EYEBROW}</p>
            <span className="home-hero__eyebrow-accent" aria-hidden />
          </div>

          <h1 className="home-hero__title hero-h1">
            <span className="home-hero__title-line">
              Reliable <span className="home-hero__accent">Dam Lining</span>
              <span className="home-hero__title-amp"> &amp;</span>
            </span>
            <span className="home-hero__title-line">Water Storage Solutions</span>
            <span className="home-hero__title-line">Built to Last</span>
          </h1>

          <p className="home-hero__description hero-subtext">{HERO_DESCRIPTION}</p>

          <div className="home-hero__actions">
            <Link href="/quote" className="home-hero__btn home-hero__btn--primary">
              <FileTextIcon className="home-hero__btn-icon" />
              Request a Free Quote
            </Link>
            <Link href="/services" className="home-hero__btn home-hero__btn--secondary">
              View Our Services
              <ArrowRightIcon className="home-hero__btn-icon" />
            </Link>
          </div>

          <p className="home-hero__phone hero-phone-line">
            <span className="home-hero__phone-icon-wrap" aria-hidden>
              <PhoneIcon className="home-hero__phone-icon" />
            </span>
            <span>
              Prefer to speak directly?{" "}
              <a href={`tel:${phoneTel}`} className="home-hero__phone-link">
                {siteConfig.phone}
              </a>
            </span>
          </p>
        </div>

        <ul className="home-hero__trust">
          {TRUST_ITEMS.map((item) => (
            <li key={item.id} className="home-hero__trust-item">
              <span className="home-hero__trust-icon-wrap" aria-hidden>
                <item.Icon className="home-hero__trust-icon" />
              </span>
              <span className="home-hero__trust-copy">
                <span className="home-hero__trust-title">{item.title}</span>
                <span className="home-hero__trust-detail">{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
