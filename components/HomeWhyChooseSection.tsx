import Link from "next/link";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";
import {
  ArrowRightIcon,
  HomeIcon,
  ShieldCheckIcon,
  TagIcon,
} from "@/components/icons/StrokeIcons";

const TRUST_CARDS = [
  {
    id: "local",
    title: "Locally Owned",
    description:
      "Proudly based in South Africa, with practical understanding of local site conditions, climate and client requirements.",
    Icon: HomeIcon,
  },
  {
    id: "experience",
    title: "30+ Years Combined Industry Experience",
    description:
      "30+ years combined industry experience in dam linings, waterproofing, reservoir lining and water storage solutions.",
    Icon: ShieldCheckIcon,
  },
  {
    id: "value",
    title: "Practical, High-Value Solutions",
    description:
      "Practical, cost-effective solutions designed for long-term performance, leak prevention and peace of mind.",
    Icon: TagIcon,
  },
] as const;

/** Homepage service links — imported from shared sitewide registry. */
const RELATED_SERVICE_LINKS_HOME = RELATED_SERVICE_LINKS.filter((link) =>
  [
    "/dam-liners",
    "/hdpe-dam-lining",
    "/steel-water-storage-tanks",
    "/bitumen-waterproofing",
    "/services",
    "/dam-repair-services",
    "/reservoir-lining",
    "/faq",
  ].includes(link.href),
);

/** Homepage why-choose + related services — below process/projects. */
export function HomeWhyChooseSection() {
  return (
    <section
      className="home-why-choose"
      aria-labelledby="damtech-why-choose-heading"
    >
      <div className="home-why-choose__trust">
        <div className="home-why-choose__trust-inner">
          <header className="home-why-choose__trust-header">
            <p className="home-why-choose__eyebrow">WHY CHOOSE US</p>
            <h2 id="damtech-why-choose-heading" className="home-why-choose__title">
              Experience You Can Trust. Results That Last.
            </h2>
            <span className="home-why-choose__divider" aria-hidden />
            <p className="home-why-choose__intro">
              With years of experience in dam linings, waterproofing and
              reservoir systems, Damtech delivers practical water storage and
              leak-prevention solutions for farms, mines, game lodges and
              commercial properties across South Africa.
            </p>
          </header>

          <ul className="home-why-choose__cards">
            {TRUST_CARDS.map((card) => (
              <li key={card.id} className="home-why-choose__card">
                <span className="home-why-choose__card-icon-wrap" aria-hidden>
                  <card.Icon className="home-why-choose__card-icon" />
                </span>
                <h3 className="home-why-choose__card-title">{card.title}</h3>
                <span className="home-why-choose__card-accent" aria-hidden />
                <p className="home-why-choose__card-text">{card.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="home-why-choose__related">
        <span className="home-why-choose__related-decor" aria-hidden />

        <div className="home-why-choose__related-inner">
          <header className="home-why-choose__related-header">
            <p className="home-why-choose__eyebrow home-why-choose__eyebrow--light">
              RELATED DAMTECH SERVICES
            </p>
            <h2
              id="damtech-related-services-heading"
              className="home-why-choose__title home-why-choose__title--light"
            >
              Explore More of Our Services
            </h2>
            <span
              className="home-why-choose__divider home-why-choose__divider--light"
              aria-hidden
            />
            <p className="home-why-choose__intro home-why-choose__intro--light">
              From dam linings to waterproofing, reservoir lining and water
              storage systems, Damtech provides practical services to help
              protect your water infrastructure and property.
            </p>
          </header>

          <ul className="home-why-choose__links">
            {RELATED_SERVICE_LINKS_HOME.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="home-why-choose__link-card">
                  <span className="home-why-choose__link-icon-wrap" aria-hidden>
                    {item.Icon ? (
                      <item.Icon className="home-why-choose__link-icon" />
                    ) : null}
                  </span>
                  <span className="home-why-choose__link-label">{item.label}</span>
                  <ArrowRightIcon
                    className="home-why-choose__link-arrow"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
