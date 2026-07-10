import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DropletIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@/components/icons/StrokeIcons";
import { SITE_IMAGES } from "@/lib/images";

const TRUST_CARDS = [
  {
    id: "experience",
    title: "30+ Years Combined Industry Experience",
    text: "Decades of hands-on expertise in dam lining, waterproofing and water storage projects.",
    Icon: ClockIcon,
  },
  {
    id: "materials",
    title: "HDPE, PVC & Bitumen Systems",
    text: "High-quality materials and proven waterproofing systems for long-term performance.",
    Icon: ShieldCheckIcon,
  },
  {
    id: "sectors",
    title: "Farms, Mines, Game Lodges & Commercial",
    text: "Serving agricultural, mining, hospitality and commercial water storage applications.",
    Icon: BuildingIcon,
  },
  {
    id: "nationwide",
    title: "Nationwide Service",
    text: "Project teams and partners available across South Africa.",
    Icon: MapPinIcon,
  },
  {
    id: "warranty",
    title: "Supplier-Backed Material Warranty",
    text: "Qualifying HDPE, PVC and waterproofing materials where applicable, subject to supplier terms.",
    Icon: ShieldCheckIcon,
  },
] as const;

const IMAGE_OVERLAY_ITEMS = [
  {
    id: "premium",
    label: "Premium Materials",
    detail: "Sourced from trusted local and global suppliers.",
    Icon: ShieldCheckIcon,
  },
  {
    id: "leak",
    label: "Leak Prevention First",
    detail: "Engineered systems for long-term water retention.",
    Icon: DropletIcon,
  },
  {
    id: "install",
    label: "Expert Installation",
    detail: "Skilled teams focused on detail and durability.",
    Icon: CogIcon,
  },
  {
    id: "endure",
    label: "Built to Last",
    detail: "Solutions designed for harsh environments and heavy use.",
    Icon: CheckCircleIcon,
  },
] as const;

const WARRANTY_BULLETS = [
  "Supplier-backed material warranty where applicable",
  "Warranty terms subject to the relevant supplier's conditions",
  "Applies to qualifying HDPE, PVC, bitumen or waterproofing materials",
  "Workmanship, site conditions and third-party damage excluded unless separately agreed in writing",
] as const;

const INSTALLATION_ALT =
  "Damtech team installing HDPE dam lining for earth dam waterproofing in South Africa";

/** Homepage trust + warranty section — sits directly below the hero. */
export function HomeTrustWarrantySection() {
  const installationImage = SITE_IMAGES.homeDamLiner;

  return (
    <section
      className="home-trust-warranty"
      aria-labelledby="damtech-trust-heading"
    >
      <div className="home-trust-warranty__inner">
        <header className="home-trust-warranty__header">
          <p className="home-trust-warranty__eyebrow">
            TRUSTED. PROVEN. PROTECTING WHAT MATTERS.
          </p>
          <h2 id="damtech-trust-heading" className="home-trust-warranty__title">
            Built on Experience. Backed by Quality.
          </h2>
          <span className="home-trust-warranty__divider" aria-hidden />
        </header>

        <ul className="home-trust-warranty__cards">
          {TRUST_CARDS.map((card) => (
            <li key={card.id} className="home-trust-warranty__card">
              <span className="home-trust-warranty__card-icon-wrap" aria-hidden>
                <card.Icon className="home-trust-warranty__card-icon" />
              </span>
              <h3 className="home-trust-warranty__card-title">{card.title}</h3>
              <p className="home-trust-warranty__card-text">{card.text}</p>
            </li>
          ))}
        </ul>

        <div className="home-trust-warranty__main">
          <figure className="home-trust-warranty__figure">
            <div className="home-trust-warranty__image-frame">
              <Image
                src={installationImage.image}
                alt={INSTALLATION_ALT}
                fill
                loading="lazy"
                sizes="(max-width: 1023px) 100vw, 55vw"
                placeholder="blur"
                className="home-trust-warranty__image"
              />
              <div className="home-trust-warranty__image-overlay" aria-hidden>
                <ul className="home-trust-warranty__overlay-items">
                  {IMAGE_OVERLAY_ITEMS.map((item) => (
                    <li key={item.id} className="home-trust-warranty__overlay-item">
                      <item.Icon className="home-trust-warranty__overlay-icon" />
                      <span className="home-trust-warranty__overlay-copy">
                        <span className="home-trust-warranty__overlay-label">
                          {item.label}
                        </span>
                        <span className="home-trust-warranty__overlay-detail">
                          {item.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </figure>

          <article className="home-trust-warranty__warranty-card">
            <p className="home-trust-warranty__warranty-eyebrow">
              <ShieldCheckIcon
                className="home-trust-warranty__warranty-eyebrow-icon"
                aria-hidden
              />
              OUR COMMITMENT
            </p>
            <h3 className="home-trust-warranty__warranty-title">
              Supplier-Backed Material Warranty
            </h3>
            <span
              className="home-trust-warranty__warranty-divider"
              aria-hidden
            />
            {/* TODO(business-confirm): exact warranty terms. */}
            <p className="home-trust-warranty__warranty-text">
              Qualifying dam liner and waterproofing materials carry a
              supplier-backed material warranty of up to 10 years, where
              applicable. Ask us what applies to your project.
            </p>
            <ul className="home-trust-warranty__warranty-list">
              {WARRANTY_BULLETS.map((item) => (
                <li key={item} className="home-trust-warranty__warranty-list-item">
                  <CheckCircleIcon
                    className="home-trust-warranty__warranty-check"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/quote"
              className="home-trust-warranty__cta"
            >
              Request Material Warranty Details
              <ArrowRightIcon className="home-trust-warranty__cta-icon" aria-hidden />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
