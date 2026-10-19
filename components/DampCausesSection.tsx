import Image from "next/image";
import Link from "next/link";
import { SITE_IMAGES } from "@/lib/images";
import { whatsAppUrl } from "@/lib/site";

const DAMP_SIGNS = [
  "Peeling or bubbling paint",
  "A tide mark low on the wall",
  "Black mould in corners",
  "White salt (efflorescence)",
  "Musty smell, swollen skirtings",
] as const;

/**
 * Explanatory diagrams for the residential waterproofing page: interior
 * (rising/penetrating) damp first, then foundation leak points. Kept short:
 * the diagrams carry the detail, the copy points to an assessment.
 */
export function DampCausesSection({ quoteHref }: { quoteHref: string }) {
  const interior = SITE_IMAGES.risingDampCauses;
  const foundation = SITE_IMAGES.foundationLeakPoints;

  return (
    <section className="site-section damp-causes" aria-labelledby="damp-causes-heading">
      <div className="site-section__inner">
        <header className="page-section-header page-section-header--center damp-causes__header">
          <p className="page-section-header__eyebrow">Damp walls explained</p>
          <h2 id="damp-causes-heading" className="page-section-header__title">
            What causes rising damp and damp walls?
          </h2>
          <p className="page-section-header__intro">
            Damp is a symptom. Paint keeps peeling until the water getting into
            the wall is stopped, so we find the cause before we quote.
          </p>
        </header>

        <ul className="damp-causes__signs" aria-label="Common signs of damp">
          {DAMP_SIGNS.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>

        <figure className="damp-causes__figure">
          <a
            href={interior.path}
            className="damp-causes__zoom"
            target="_blank"
            rel="noopener"
          >
            <Image
              src={interior.image}
              alt={interior.alt}
              sizes="(max-width: 1180px) 100vw, 1100px"
              placeholder="blur"
              className="damp-causes__image"
            />
            <span className="damp-causes__zoom-hint" aria-hidden>
              Tap to enlarge
            </span>
          </a>
          <figcaption>
            <h3 className="damp-causes__caption-title">
              Rising damp and penetrating damp inside the house
            </h3>
            <p>
              Most damp walls in South African homes come from a failed or
              bridged damp-proof course (DPC), garden soil or paving built up
              above it, poor drainage against the wall, or rain getting in
              through cracked plaster and window sills.
            </p>
          </figcaption>
        </figure>

        <figure className="damp-causes__figure">
          <a
            href={foundation.path}
            className="damp-causes__zoom"
            target="_blank"
            rel="noopener"
          >
            <Image
              src={foundation.image}
              alt={foundation.alt}
              sizes="(max-width: 1180px) 100vw, 1100px"
              placeholder="blur"
              className="damp-causes__image"
            />
            <span className="damp-causes__zoom-hint" aria-hidden>
              Tap to enlarge
            </span>
          </a>
          <figcaption>
            <h3 className="damp-causes__caption-title">
              Foundation and below-ground leaks
            </h3>
            <p>
              Below ground, water pushes through cracks, mortar joints, pipe
              entries and the floor-to-wall joint wherever the waterproofing
              membrane is missing or damaged. See{" "}
              <Link href="/foundation-waterproofing/">
                foundation waterproofing and damp-proofing
              </Link>
              .
            </p>
          </figcaption>
        </figure>

        <div className="damp-causes__cta">
          <p>Seeing any of these at home? Send us a photo and we will tell you what we think is causing it. Site assessments are free in Betty&apos;s Bay.</p>
          <div className="damp-causes__actions">
            <Link href={quoteHref} className="dt-btn dt-btn--blue">
              Request a damp-proofing quote
            </Link>
            <a
              href={whatsAppUrl}
              className="dt-btn dt-btn--outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp a photo of the wall
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
