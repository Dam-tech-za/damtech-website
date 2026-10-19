import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  MessageIcon,
  SearchIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@/components/icons/StrokeIcons";
import { SITE_IMAGES, type SiteImage } from "@/lib/images";

type ServiceCard = {
  id: string;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  featured: boolean;
  image: SiteImage | null;
};

const SERVICE_CARDS: readonly ServiceCard[] = [
  {
    id: "reservoirs",
    title: "Steel Reservoirs",
    description:
      "Fixed-price corrugated steel water tank kits for farms, estates, game lodges and commercial sites — VAT-inclusive supply-only prices.",
    linkLabel: "View steel tank sizes and prices",
    href: "/steel-water-storage-tanks/#popular-tank-sizes",
    featured: false,
    image: SITE_IMAGES.steelTank,
  },
  {
    id: "waterproofing",
    title: "Roof & Home Waterproofing",
    description:
      "Flat roof, torch-on and liquid membrane waterproofing, damp-proofing and leak repairs for homes in Pretoria, Centurion and the Overstrand. Free assessments in Betty's Bay; written quotes everywhere.",
    linkLabel: "See roof and home waterproofing",
    href: "/waterproofing",
    featured: true,
    // Representative roof photo supplied by the owner; alt text stays generic (no job or location claimed).
    image: SITE_IMAGES.flatRoofWaterproofing,
  },
  {
    id: "dam-linings",
    title: "Dam Linings",
    description:
      "HDPE and PVC dam linings for earth dams, ponds, reservoirs and water storage applications requiring long-term leak prevention.",
    linkLabel: "Learn more about Dam linings",
    href: "/dam-liners",
    featured: false,
    image: SITE_IMAGES.villiersdorpLining,
  },
];

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

/** Homepage service discovery — large photo tiles, then maintenance split. */
export function HomeServicesSection() {
  const maintenanceImage = SITE_IMAGES.maintenance;

  return (
    <section className="dt-services" aria-labelledby="damtech-services-heading">
      <div className="site-shell">
        <header className="dt-split-header">
          <div>
            <p className="dt-eyebrow">SERVICES</p>
            <h2 id="damtech-services-heading" className="dt-display dt-display--xl">
              What We Offer
            </h2>
          </div>
          <p className="dt-lede">
            Damtech provides practical water storage, waterproofing and dam
            lining solutions for farms, mines, game lodges and commercial
            properties across South Africa.
          </p>
        </header>

        <ul className="dt-services__tiles">
          {SERVICE_CARDS.map((card) => (
            <li
              key={card.id}
              className={`dt-tile${card.featured ? " dt-tile--featured" : ""}`}
            >
              <Link href={card.href} className="dt-tile__media" tabIndex={-1} aria-hidden>
                {card.image ? (
                  <Image
                    src={card.image.image}
                    alt={card.image.alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, 33vw"
                    placeholder="blur"
                    className="dt-cover dt-tile__image"
                  />
                ) : (
                  <span className="dt-tile__type" aria-hidden>
                    Roofs
                    <br />
                    Walls
                    <br />
                    Foundations
                  </span>
                )}
              </Link>
              <div className="dt-tile__body">
                {card.featured ? (
                  <span className="dt-pill">OUR EXPERTISE</span>
                ) : null}
                <h3 className="dt-tile__title">{card.title}</h3>
                <p className="dt-tile__text">{card.description}</p>
                <Link href={card.href} className="dt-arrow-link">
                  {card.linkLabel}
                  <ArrowRightIcon className="dt-arrow-link__icon" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <div className="dt-maintenance">
          <div className="dt-maintenance__copy">
            <p className="dt-eyebrow">MAINTENANCE</p>
            <h3 className="dt-display dt-display--lg">Maintenance &amp; Aftercare</h3>
            <p className="dt-maintenance__intro">
              Protect your property with waterproofing maintenance, inspections
              and repair services. Damtech helps identify leaks, prevent water
              damage and extend the life of dam linings, reservoirs and
              waterproofing systems.
            </p>

            <ul className="dt-maintenance__grid">
              {MAINTENANCE_CARDS.map((item) => (
                <li key={item.id} className="dt-maintenance__item">
                  <item.Icon className="dt-maintenance__icon" aria-hidden />
                  <h4 className="dt-maintenance__title">{item.title}</h4>
                  <p className="dt-maintenance__text">{item.text}</p>
                </li>
              ))}
            </ul>

            <Link href="/contact" className="dt-btn dt-btn--ink">
              Contact Damtech for Maintenance
              <ArrowRightIcon className="dt-btn__icon" aria-hidden />
            </Link>
          </div>

          <figure className="dt-maintenance__figure">
            <Image
              src={maintenanceImage.image}
              alt={MAINTENANCE_ALT}
              fill
              loading="lazy"
              sizes="(max-width: 1023px) 100vw, 45vw"
              placeholder="blur"
              className="dt-cover"
            />
            <figcaption className="dt-maintenance__callout">
              <span className="dt-maintenance__callout-title">
                Built to Protect. Backed by Care.
              </span>
              <span className="dt-maintenance__callout-text">
                Ongoing support and practical maintenance for long-term
                protection.
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
