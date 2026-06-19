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
};

/** Compact inner-page hero. Homepage uses `HomeHero` instead. */
export function Hero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
  image,
}: HeroProps) {
  return (
    <section
      className={`relative isolate overflow-hidden bg-gradient-to-br from-navy via-slate-800 to-water text-white ${
        compact ? "py-12 sm:py-14" : "py-16 sm:py-20"
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
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-200">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
          {description}
        </p>
        {children ? (
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        ) : null}
      </div>
    </section>
  );
}

export function HeroActions() {
  return (
    <>
      <Link href="/quote" className="btn-primary">
        Request a Quote
      </Link>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Contact Damtech
      </Link>
    </>
  );
}
