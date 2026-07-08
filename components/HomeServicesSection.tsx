import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  DropletIcon,
  LayersIcon,
  MessageIcon,
  ReservoirIcon,
  SearchIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@/components/icons/StrokeIcons";
import { SITE_IMAGES } from "@/lib/images";

const SERVICE_CARDS = [
  {
    id: "reservoirs",
    title: "Steel Reservoirs",
    description:
      "Durable corrugated steel reservoirs engineered for reliable, weather-resistant water storage on farms, mines, estates and commercial sites.",
    linkLabel: "Learn more about steel reservoirs",
    href: "/steel-water-storage-tanks",
    Icon: ReservoirIcon,
    featured: false,
  },
  {
    id: "waterproofing",
    title: "Waterproofing",
    description:
      "Bitumen, torch-on and maintenance waterproofing systems designed to protect buildings, reservoirs and water-retaining structures.",
    linkLabel: "Learn more about waterproofing services",
    href: "/bitumen-waterproofing",
    Icon: DropletIcon,
    featured: true,
  },
  {
    id: "dam-linings",
    title: "Dam Linings",
    description:
      "HDPE and PVC dam linings for earth dams, ponds, reservoirs and water storage applications requiring long-term leak prevention.",
    linkLabel: "Learn more about Dam linings",
    href: "/dam-liners",
    Icon: LayersIcon,
    featured: false,
  },
] as const;

const MAINTENANCE_CARDS = [
  {
    id: "inspections",
    title: "Property Inspections",
    text: "Thorough assessments to identify leaks, weak points and early signs of water damage.",
    Icon: SearchIcon,
  },
  {
    id: "repairs",
    title: "Roof and Foundation Repairs",
    text: "Practical repairs that restore protection and reduce future waterproofing failures.",
    Icon: WrenchIcon,
  },
  {
    id: "preventative",
    title: "Preventative Maintenance",
    text: "Routine care that helps extend the life of waterproofing and water-retaining systems.",
    Icon: ShieldCheckIcon,
  },
  {
    id: "advice",
    title: "Expert Advice",
    text: "Professional guidance on the right waterproofing, dam lining or repair solution.",
    Icon: MessageIcon,
  },
] as const;

const MAINTENANCE_ALT =
  "Waterproofing maintenance and inspection for leak prevention by Damtech";

/** Homepage services + maintenance section — sits below the trust/warranty section. */
export function HomeServicesSection() {
  const maintenanceImage = SITE_IMAGES.maintenance;

  return (
    <section
      className="home-services"
      aria-labelledby="damtech-services-heading"
    >
      <span className="home-services__decor" aria-hidden />

      <div className="home-services__inner">
        <header className="home-services__header">
          <p className="home-services__eyebrow">SERVICES</p>
          <h2 id="damtech-services-heading" className="home-services__title">
            What We Offer
          </h2>
          <span className="home-services__divider" aria-hidden />
          <p className="home-services__intro">
            Damtech provides practical water storage, waterproofing and dam
            lining solutions for farms, mines, game lodges and commercial
            properties across South Africa.
          </p>
        </header>

        <ul className="home-services__cards">
          {SERVICE_CARDS.map((card) => (
            <li
              key={card.id}
              className={`home-services__card${
                card.featured ? " home-services__card--featured" : ""
              }`}
            >
              {card.featured ? (
                <span className="home-services__card-pill">OUR EXPERTISE</span>
              ) : null}
              <span className="home-services__card-icon-wrap" aria-hidden>
                <card.Icon className="home-services__card-icon" />
              </span>
              <h3 className="home-services__card-title">{card.title}</h3>
              <p className="home-services__card-text">{card.description}</p>
              <Link href={card.href} className="home-services__card-link">
                {card.linkLabel}
                <ArrowRightIcon
                  className="home-services__card-link-icon"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="home-services__maintenance">
          <div className="home-services__maintenance-copy">
            <p className="home-services__eyebrow">MAINTENANCE</p>
            <h3 className="home-services__maintenance-title">
              Maintenance &amp; Aftercare
            </h3>
            <span className="home-services__divider" aria-hidden />
            <p className="home-services__maintenance-intro">
              Protect your property with waterproofing maintenance, inspections
              and repair services. Damtech helps identify leaks, prevent water
              damage and extend the life of dam linings, reservoirs and
              waterproofing systems.
            </p>

            <ul className="home-services__maintenance-cards">
              {MAINTENANCE_CARDS.map((item) => (
                <li key={item.id} className="home-services__info-card">
                  <span className="home-services__info-icon-wrap" aria-hidden>
                    <item.Icon className="home-services__info-icon" />
                  </span>
                  <span className="home-services__info-copy">
                    <h4 className="home-services__info-title">{item.title}</h4>
                    <p className="home-services__info-text">{item.text}</p>
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/contact" className="home-services__cta">
              Contact Damtech for Maintenance
              <ArrowRightIcon className="home-services__cta-icon" aria-hidden />
            </Link>
          </div>

          <figure className="home-services__maintenance-figure">
            <div className="home-services__maintenance-image-frame">
              <Image
                src={maintenanceImage.image}
                alt={MAINTENANCE_ALT}
                fill
                loading="lazy"
                sizes="(max-width: 1023px) 100vw, 45vw"
                placeholder="blur"
                className="home-services__maintenance-image"
              />
              <div className="home-services__callout">
                <span className="home-services__callout-icon-wrap" aria-hidden>
                  <ShieldCheckIcon className="home-services__callout-icon" />
                </span>
                <span className="home-services__callout-copy">
                  <span className="home-services__callout-title">
                    Built to Protect. Backed by Care.
                  </span>
                  <span className="home-services__callout-text">
                    Ongoing support and practical maintenance for long-term
                    protection.
                  </span>
                </span>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
