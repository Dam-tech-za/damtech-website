import Link from "next/link";
import { CTA_REASSURANCE_ITEMS } from "@/lib/cta-content";
import { phoneTel, siteConfig } from "@/lib/site";
import { CheckCircleIcon } from "@/components/icons/StrokeIcons";

/** Homepage-style trust sidebar for quote and contact forms. */
export function QuoteTrustPanel() {
  return (
    <aside className="site-trust-panel">
      <div className="home-final-cta__card home-final-cta__card--inline site-trust-panel__card">
        <h3 className="home-final-cta__title home-final-cta__title--inline">
          Why request a quote?
        </h3>
        <ul className="site-trust-panel__list">
          {CTA_REASSURANCE_ITEMS.map((item) => (
            <li key={item.id} className="site-trust-panel__item">
              <CheckCircleIcon
                className="site-trust-panel__icon"
                aria-hidden
              />
              <span>
                <strong>{item.title}.</strong> {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="home-why-choose__card site-trust-panel__card">
        <h3 className="home-why-choose__card-title">What to include</h3>
        <span className="home-why-choose__card-accent" aria-hidden />
        <ul className="site-trust-panel__bullets">
          <li>Dam or tank dimensions (or approximate surface area)</li>
          <li>Current condition — new build, leak repair or re-lining</li>
          <li>Intended use — livestock, irrigation, mining or domestic</li>
          <li>Site access and preferred installation timeframe</li>
        </ul>
      </div>

      <div className="home-why-choose__card site-trust-panel__card">
        <h3 className="home-why-choose__card-title">Prefer to talk?</h3>
        <span className="home-why-choose__card-accent" aria-hidden />
        <p className="home-why-choose__card-text">
          Call{" "}
          <a href={`tel:${phoneTel}`} className="font-semibold text-water">
            {siteConfig.phone}
          </a>{" "}
          or email{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="font-semibold text-water"
          >
            {siteConfig.email}
          </a>
          .
        </p>
        <Link href="/contact" className="btn-secondary mt-4 inline-flex text-sm">
          Contact page
        </Link>
      </div>
    </aside>
  );
}
