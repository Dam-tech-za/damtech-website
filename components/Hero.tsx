import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { SiteImage } from "@/lib/images";

type HeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
  image?: Pick<SiteImage, "src" | "alt" | "width" | "height">;
  /** Render primary + secondary CTAs below intro (default true). */
  showActions?: boolean;
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
}: HeroProps) {
  const actions = children ?? (showActions ? <HeroActions /> : null);

  return (
    <section
      className={`hero-section relative isolate overflow-hidden bg-gradient-to-br from-navy via-slate-800 to-water text-white ${
        compact ? "py-14 sm:py-16 lg:py-20" : "py-16 sm:py-20 lg:py-24"
      }`}
    >
      {image ? (
        <div className="absolute inset-0 z-0" aria-hidden>
          <div className="relative h-full w-full">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-navy/75" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #38bdf8 0%, transparent 45%), radial-gradient(circle at 80% 0%, #4ade80 0%, transparent 35%)",
          }}
        />
      )}

      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200 sm:text-sm">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`hero-title max-w-4xl font-bold tracking-tight text-balance text-white ${
            eyebrow ? "mt-3" : "mt-0"
          }`}
        >
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
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
