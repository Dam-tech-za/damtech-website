import Link from "next/link";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";

const TRUST_CARDS = [
  {
    id: "local",
    title: "Locally Owned",
    description:
      "Proudly based in South Africa, with practical understanding of local site conditions, climate and client requirements.",
  },
  {
    id: "experience",
    title: "30+ Years Combined Team Experience",
    description:
      "The Damtech team brings more than 30 years of combined experience across dam linings, waterproofing, reservoir lining and water storage solutions.",
  },
  {
    id: "value",
    title: "Practical, High-Value Solutions",
    description:
      "Practical, cost-effective solutions designed for long-term performance, leak prevention and peace of mind.",
  },
] as const;

/** Homepage service links — imported from shared sitewide registry. */
const RELATED_SERVICE_LINKS_HOME = RELATED_SERVICE_LINKS.filter((link) =>
  [
    "/dam-liners",
    "/hdpe-dam-lining",
    "/steel-water-storage-tanks",
    "/waterproofing",
    "/services",
    "/dam-repair-services",
    "/reservoir-lining",
    "/faq",
  ].includes(link.href),
);

/** Homepage why-choose statements + typographic service index on vivid blue. */
export function HomeWhyChooseSection() {
  return (
    <>
      <section className="dt-why" aria-labelledby="damtech-why-choose-heading">
        <div className="site-shell">
          <header className="dt-split-header">
            <div>
              <p className="dt-eyebrow">WHY CHOOSE US</p>
              <h2 id="damtech-why-choose-heading" className="dt-display dt-display--xl">
                Experience You Can Trust. Results That Last.
              </h2>
            </div>
            <p className="dt-lede">
              With years of experience in dam linings, waterproofing and
              reservoir systems, Damtech delivers practical water storage and
              leak-prevention solutions for farms, mines, game lodges and
              commercial properties across South Africa.
            </p>
          </header>

          <ul className="dt-why__cards">
            {TRUST_CARDS.map((card) => (
              <li key={card.id} className="dt-why__card">
                <h3 className="dt-why__title">{card.title}</h3>
                <p className="dt-why__text">{card.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="dt-index"
        aria-labelledby="damtech-related-services-heading"
      >
        <div className="site-shell dt-index__inner">
          <header className="dt-index__header">
            <p className="dt-eyebrow dt-eyebrow--light">RELATED DAMTECH SERVICES</p>
            <h2
              id="damtech-related-services-heading"
              className="dt-display dt-display--lg"
            >
              Explore More of Our Services
            </h2>
            <p className="dt-index__intro">
              From dam linings to waterproofing, reservoir lining and water
              storage systems, Damtech provides practical services to help
              protect your water infrastructure and property.
            </p>
          </header>

          <ul className="dt-index__links">
            {RELATED_SERVICE_LINKS_HOME.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="dt-index__link">
                  <span>{item.label}</span>
                  <ArrowRightIcon className="dt-index__arrow" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
