import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons/StrokeIcons";
import { SITE_IMAGES } from "@/lib/images";
import { phoneTel, siteConfig } from "@/lib/site";
import {
  CTA_REASSURANCE_ITEMS,
  CTA_TRUST_STRIP_ITEMS,
} from "@/lib/cta-content";

/** Closing enquiry block — oversized headline, three-photo collage, reassurance row. */
export function HomeFinalCtaSection() {
  const mainImage = SITE_IMAGES.damLiners;
  const tankImage = SITE_IMAGES.steelReservoirHome;
  const waterproofingImage = SITE_IMAGES.bitumen;

  return (
    <section className="dt-cta" aria-labelledby="damtech-final-quote-heading">
      <div className="site-shell">
        <div className="dt-cta__grid">
          <div className="dt-cta__copy">
            <p className="dt-eyebrow">READY TO GET STARTED?</p>
            <h2 id="damtech-final-quote-heading" className="dt-display dt-display--hero">
              Request a FREE Quote
            </h2>
            <p className="dt-cta__intro">
              Whether you need dam linings, waterproofing, steel water tanks or
              maintenance, our team is ready to help with a practical, tailored
              solution for farms, mines, game lodges and commercial properties
              across South Africa.
            </p>

            <div className="dt-cta__actions">
              <Link
                href="/quote"
                className="dt-btn dt-btn--blue dt-btn--lg"
                aria-label="Request a Damtech quote for dam linings, waterproofing or steel water tanks"
              >
                Request a Quote
                <ArrowRightIcon className="dt-btn__icon" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="dt-btn dt-btn--outline dt-btn--lg"
                aria-label="Contact Damtech about dam linings, waterproofing, steel water tanks or maintenance"
              >
                Contact Damtech
              </Link>
            </div>
            <a href={`tel:${phoneTel}`} className="dt-cta__phone">
              <PhoneIcon className="dt-cta__phone-icon" aria-hidden />
              {siteConfig.phone}
            </a>
          </div>

          <div className="dt-cta__collage" aria-label="Damtech services image collage">
            <figure className="dt-cta__photo dt-cta__photo--main">
              <Image
                src={mainImage.image}
                alt="HDPE dam lining and water storage project by Damtech"
                fill
                loading="lazy"
                sizes="(max-width: 1023px) 92vw, 34vw"
                placeholder="blur"
                className="dt-cover"
              />
            </figure>
            <figure className="dt-cta__photo dt-cta__photo--top">
              <Image
                src={tankImage.image}
                alt={tankImage.alt}
                fill
                loading="lazy"
                sizes="(max-width: 1023px) 45vw, 18vw"
                placeholder="blur"
                className="dt-cover"
              />
            </figure>
            <figure className="dt-cta__photo dt-cta__photo--bottom">
              <Image
                src={waterproofingImage.image}
                alt="Bitumen torch-on waterproofing work for leak prevention"
                fill
                loading="lazy"
                sizes="(max-width: 1023px) 45vw, 18vw"
                placeholder="blur"
                className="dt-cover"
              />
            </figure>
          </div>
        </div>

        <ul className="dt-cta__reassurance" aria-label="Quote reassurance points">
          {CTA_REASSURANCE_ITEMS.map((item) => (
            <li key={item.id} className="dt-cta__reassurance-item">
              <strong className="dt-cta__reassurance-title">{item.title}</strong>
              <span className="dt-cta__reassurance-text">{item.text}</span>
            </li>
          ))}
        </ul>

        <ul className="dt-cta__trust" aria-label="Damtech trust information">
          {CTA_TRUST_STRIP_ITEMS.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
