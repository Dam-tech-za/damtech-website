import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  MapPinIcon,
  MessageIcon,
  ShieldCheckIcon,
} from "@/components/icons/StrokeIcons";
import {
  CTA_REASSURANCE_ITEMS,
  CTA_TRUST_STRIP_ITEMS,
} from "@/lib/cta-content";

const REASSURANCE_ICONS = {
  "no-obligation": FileTextIcon,
  "expert-advice": MessageIcon,
  "fast-response": ClockIcon,
  "quality-assured": CheckCircleIcon,
} as const;

const TRUST_ICONS = {
  warranty: ShieldCheckIcon,
  clients: BuildingIcon,
  "south-africa": MapPinIcon,
} as const;

type CTAProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
};

/** Sitewide final CTA — homepage design language, compact single-column layout. */
export function CTA({
  title = "Request a FREE Quote",
  description = "Whether you need dam linings, waterproofing, steel water tanks or maintenance, our team is ready to help with a practical, tailored solution for farms, mines, game lodges and commercial properties across South Africa.",
  eyebrow = "READY TO GET STARTED?",
}: CTAProps) {
  return (
    <section
      className="home-final-cta home-final-cta--inner"
      aria-labelledby="page-final-cta-heading"
    >
      <div className="home-final-cta__inner">
        <div className="home-final-cta__card home-final-cta__card--inner">
          <div className="home-final-cta__eyebrow-wrap">
            <p className="home-final-cta__eyebrow">{eyebrow}</p>
            <span className="home-final-cta__eyebrow-accent" aria-hidden />
          </div>

          <h2 id="page-final-cta-heading" className="home-final-cta__title">
            {title}
          </h2>

          <p className="home-final-cta__intro">{description}</p>

          <div className="home-final-cta__actions">
            <Link
              href="/quote"
              className="btn-primary home-final-cta__btn"
              aria-label="Request a Damtech quote for dam linings, waterproofing or steel water tanks"
            >
              Request a Quote
              <ArrowRightIcon className="home-final-cta__btn-icon" aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="btn-secondary home-final-cta__btn"
              aria-label="Contact Damtech about dam linings, waterproofing, steel water tanks or maintenance"
            >
              Contact Damtech
            </Link>
          </div>

          <ul
            className="home-final-cta__reassurance"
            aria-label="Quote reassurance points"
          >
            {CTA_REASSURANCE_ITEMS.map((item, index) => {
              const Icon = REASSURANCE_ICONS[item.id];
              return (
                <Fragment key={item.id}>
                  {index > 0 ? (
                    <li
                      className="home-final-cta__reassurance-divider"
                      aria-hidden
                    />
                  ) : null}
                  <li className="home-final-cta__reassurance-item">
                    <span
                      className="home-final-cta__reassurance-icon-wrap"
                      aria-hidden
                    >
                      <Icon className="home-final-cta__reassurance-icon" />
                    </span>
                    <span className="home-final-cta__reassurance-copy">
                      <strong className="home-final-cta__reassurance-title">
                        {item.title}
                      </strong>
                      <span className="home-final-cta__reassurance-text">
                        {item.text}
                      </span>
                    </span>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>

        <div
          className="home-final-cta__trust-strip"
          aria-label="Damtech trust information"
        >
          <ul className="home-final-cta__trust-items">
            {CTA_TRUST_STRIP_ITEMS.map((item) => {
              const Icon = TRUST_ICONS[item.id];
              return (
                <li key={item.id} className="home-final-cta__trust-item">
                  <span className="home-final-cta__trust-icon-wrap" aria-hidden>
                    <Icon className="home-final-cta__trust-icon" />
                  </span>
                  <span className="home-final-cta__trust-text">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
