import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { BreadcrumbItem } from "@/lib/seo";
import type { SiteImage } from "@/lib/images";

type HeroTone = "cream" | "blue" | "ink";

type HeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
  /** Real project photograph: renders the full-bleed photo composition. */
  image?: Pick<SiteImage, "image" | "alt">;
  /** CSS object-position for the photo (framing only; the file is untouched). */
  imagePosition?: string;
  /** Colour-block tone when there is no photograph. Defaults to cream. */
  tone?: HeroTone;
  /** Optional right-hand panel (enquiry card, key facts) beside the headline. */
  aside?: ReactNode;
  /** Render primary + secondary CTAs below intro (default true). */
  showActions?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  /** ISO date (YYYY-MM-DD) of the last content change, shown as "Last updated". */
  updated?: string;
};

function formatUpdatedDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00+02:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

/**
 * Inner-page hero. Homepage uses `HomeHero` instead.
 * - With `image`: full-bleed photograph, headline anchored bottom-left.
 * - Without: a confident colour block (cream, vivid blue or ink) with oversized type.
 */
export function Hero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
  image,
  imagePosition,
  tone = "cream",
  aside,
  showActions = true,
  breadcrumbs,
  updated,
}: HeroProps) {
  const actions = children ?? (showActions ? <HeroActions /> : null);
  const variant = image ? "photo" : tone;
  const onDark = variant !== "cream";

  return (
    <section
      className={`dt-page-hero dt-page-hero--${variant}${compact ? " dt-page-hero--compact" : ""}${
        aside ? " dt-page-hero--with-aside" : ""
      }`}
    >
      {image ? (
        <div className="dt-page-hero__media" aria-hidden>
          <Image
            src={image.image}
            alt={image.alt}
            fill
            priority
            fetchPriority="high"
            placeholder="blur"
            className="dt-cover"
            style={imagePosition ? { objectPosition: imagePosition } : undefined}
            sizes="100vw"
          />
          <div className="dt-page-hero__scrim" />
        </div>
      ) : null}

      <div className="dt-page-hero__inner site-shell">
        <div className="dt-page-hero__copy">
          {breadcrumbs && breadcrumbs.length > 1 ? (
            <Breadcrumbs
              items={breadcrumbs}
              variant={onDark ? "dark" : "light"}
              className="dt-page-hero__crumbs"
            />
          ) : null}
          {eyebrow ? <p className="dt-page-hero__eyebrow">{eyebrow}</p> : null}
          <h1 className="dt-page-hero__title">{title}</h1>
          <p className="dt-page-hero__description">{description}</p>
          {updated ? (
            <p className="dt-page-hero__updated">
              Last updated{" "}
              <time dateTime={updated}>{formatUpdatedDate(updated)}</time>
            </p>
          ) : null}
          {actions ? <div className="dt-page-hero__actions">{actions}</div> : null}
        </div>
        {aside ? <div className="dt-page-hero__aside">{aside}</div> : null}
      </div>
    </section>
  );
}

export function HeroActions() {
  return (
    <>
      <Link href="/quote" className="hero-btn-primary w-full sm:w-auto">
        Request a Quote
      </Link>
      <Link href="/contact" className="hero-btn-secondary w-full sm:w-auto">
        Contact Damtech
      </Link>
    </>
  );
}
