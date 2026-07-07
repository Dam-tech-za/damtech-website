import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { BreadcrumbItem } from "@/lib/seo";
import type { SiteImage } from "@/lib/images";

type HeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
  image?: Pick<SiteImage, "image" | "alt">;
  /** Render primary + secondary CTAs below intro (default true). */
  showActions?: boolean;
  breadcrumbs?: BreadcrumbItem[];
};

/** Compact inner-page hero. Homepage uses `HomeHero` instead. */
export function Hero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
  image,
  showActions = true,
  breadcrumbs,
}: HeroProps) {
  const actions = children ?? (showActions ? <HeroActions /> : null);

  return (
    <section
      className={`hero-section relative isolate -mt-[var(--header-height)] overflow-hidden text-white ${
        compact
          ? "pt-[calc(var(--header-height)+2.5rem)] pb-14 sm:pt-[calc(var(--header-height)+3rem)] sm:pb-16 lg:pt-[calc(var(--header-height)+3.5rem)] lg:pb-20"
          : "pt-[calc(var(--header-height)+3rem)] pb-16 sm:pt-[calc(var(--header-height)+3.5rem)] sm:pb-20 lg:pt-[calc(var(--header-height)+4rem)] lg:pb-24"
      }`}
    >
      {image ? (
        <div className="absolute inset-0 z-0" aria-hidden>
          <div className="relative h-full w-full">
            <Image
              src={image.image}
              alt={image.alt}
              fill
              priority
              fetchPriority="high"
              placeholder="blur"
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="hero-section__image-overlay absolute inset-0" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--color-accent-blue-light) 0%, transparent 45%), radial-gradient(circle at 80% 0%, var(--color-accent-blue) 0%, transparent 35%)",
          }}
        />
      )}

      <div className="relative z-[1] site-container">
        {breadcrumbs && breadcrumbs.length > 1 ? (
          <Breadcrumbs items={breadcrumbs} variant="dark" className="mb-4" />
        ) : null}
        {eyebrow ? <p className="text-kicker">{eyebrow}</p> : null}
        <h1
          className={`hero-title max-w-4xl text-balance text-white ${
            eyebrow ? "mt-3" : "mt-0"
          }`}
        >
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg" style={{ color: "var(--color-body-gray)" }}>
          {description}
        </p>
        {actions ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {actions}
          </div>
        ) : null}
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
