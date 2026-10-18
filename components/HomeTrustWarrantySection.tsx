import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
} from "@/components/icons/StrokeIcons";
import { SITE_IMAGES } from "@/lib/images";
import { WARRANTY_PUBLIC } from "@/lib/warranty";

const TRUST_CARDS = [
  {
    id: "experience",
    title: "30+ Years Combined Team Experience",
    text: "Decades of hands-on expertise in dam lining, waterproofing and water storage projects.",
  },
  {
    id: "materials",
    title: "HDPE, PVC & Bitumen Systems",
    text: "High-quality materials and proven waterproofing systems for long-term performance.",
  },
  {
    id: "sectors",
    title: "Farms, Mines, Game Lodges & Commercial",
    text: "Serving agricultural, mining, hospitality and commercial water storage applications.",
  },
  {
    id: "nationwide",
    title: "Nationwide Service",
    text: "Project teams and partners available across South Africa.",
  },
  {
    id: "warranty",
    title: "Supplier-Backed Material Warranty",
    text: "Qualifying HDPE, PVC and waterproofing materials where applicable, subject to supplier terms.",
  },
] as const;

const IMAGE_CAPTION_ITEMS = [
  {
    id: "premium",
    label: "Premium Materials",
    detail: "Sourced from trusted local and global suppliers.",
  },
  {
    id: "leak",
    label: "Leak Prevention First",
    detail: "Engineered systems for long-term water retention.",
  },
  {
    id: "install",
    label: "Expert Installation",
    detail: "Skilled teams focused on detail and durability.",
  },
  {
    id: "endure",
    label: "Built to Last",
    detail: "Solutions designed for harsh environments and heavy use.",
  },
] as const;

const INSTALLATION_ALT =
  "Damtech team installing HDPE dam lining for earth dam waterproofing in South Africa";

/** Homepage proof + warranty — editorial numbered list, then photo and warranty panel. */
export function HomeTrustWarrantySection() {
  const installationImage = SITE_IMAGES.homeDamLiner;

  return (
    <section className="dt-proof" aria-labelledby="damtech-trust-heading">
      <div className="site-shell">
        <div className="dt-proof__top">
          <header className="dt-proof__header">
            <p className="dt-eyebrow">TRUSTED. PROVEN. PROTECTING WHAT MATTERS.</p>
            <h2 id="damtech-trust-heading" className="dt-display dt-display--xl">
              Built on Experience. Backed by Quality.
            </h2>
          </header>

          <ol className="dt-proof__list">
            {TRUST_CARDS.map((card, index) => (
              <li key={card.id} className="dt-proof__item">
                <span className="dt-proof__index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="dt-proof__item-title">{card.title}</h3>
                  <p className="dt-proof__item-text">{card.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="dt-proof__warranty">
          <figure className="dt-proof__figure">
            <div className="dt-proof__image-frame">
              <Image
                src={installationImage.image}
                alt={INSTALLATION_ALT}
                fill
                loading="lazy"
                sizes="(max-width: 1023px) 100vw, 58vw"
                placeholder="blur"
                className="dt-cover"
              />
            </div>
            <ul className="dt-proof__captions">
              {IMAGE_CAPTION_ITEMS.map((item) => (
                <li key={item.id} className="dt-proof__caption">
                  <span className="dt-proof__caption-label">{item.label}</span>
                  <span className="dt-proof__caption-detail">{item.detail}</span>
                </li>
              ))}
            </ul>
          </figure>

          <article className="dt-proof__panel">
            <p className="dt-eyebrow dt-eyebrow--cyan">OUR COMMITMENT</p>
            <h3 className="dt-display dt-display--md">{WARRANTY_PUBLIC.title}</h3>
            <p className="dt-proof__panel-text">{WARRANTY_PUBLIC.body}</p>
            <ul className="dt-checklist">
              {WARRANTY_PUBLIC.bullets.map((item) => (
                <li key={item}>
                  <CheckCircleIcon className="dt-checklist__icon" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/quote" className="dt-btn dt-btn--cyan">
              Request Warranty Details
              <ArrowRightIcon className="dt-btn__icon" aria-hidden />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
