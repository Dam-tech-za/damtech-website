import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { SITE_IMAGES } from "@/lib/images";
import { PAGE_SEO } from "@/lib/pages";

const SERVICE_CHIPS = [
  "HDPE Dam Liners",
  "PVC Liners",
  "Steel Tanks",
  "Waterproofing",
  "Leak Prevention",
] as const;

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m0 0-4-4m4 4-4 4" />
    </svg>
  );
}

function FeatureMarker({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden flex-col items-center lg:flex ${className}`}
      aria-hidden
    >
      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/30 bg-[#051220]/50 text-white shadow-[0_0_24px_rgba(0,145,220,0.2)] backdrop-blur-sm">
        <div className="absolute inset-[-5px] rounded-full border border-[#0091dc]/40" />
        {children}
      </div>
      <span className="mt-2.5 max-w-[9rem] text-center text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/90">
        {label}
      </span>
    </div>
  );
}

/**
 * Homepage hero — image as full-bleed background with layered overlays and
 * left-aligned content. Structurally separate from compact inner-page heroes.
 */
export function HomeHero() {
  const { homeHero: image } = SITE_IMAGES;
  const { h1: title } = PAGE_SEO.home;
  const description =
    "We offer a range of earth dam liners, waterproofing and steel water tank solutions to meet the specific needs of our clients across South Africa.";
  const eyebrow = "Earth Dam Liners";

  return (
    <section
      className="relative isolate min-h-[88vh] overflow-hidden bg-[#020a14] text-white lg:min-h-[92vh]"
      aria-label="Hero"
    >
      {/* ── z-0: background image ── */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <div className="relative h-full w-full">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] md:object-[72%_center]"
          />
        </div>
      </div>

      {/* Stronger overlay on mobile for readability */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(to right, rgba(2, 10, 20, 0.92) 0%, rgba(2, 18, 35, 0.78) 100%)",
        }}
      />

      {/* ── z-[1]: gradient overlays (tablet+) ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        aria-hidden
        style={{
          background: `
            linear-gradient(to right,
              rgba(2, 10, 20, 0.96) 0%,
              rgba(2, 10, 20, 0.9) 24%,
              rgba(2, 18, 35, 0.65) 50%,
              rgba(2, 18, 35, 0.25) 75%,
              rgba(2, 18, 35, 0.14) 100%
            )`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-80 md:opacity-100"
        aria-hidden
        style={{
          background: `
            linear-gradient(115deg, rgba(0, 80, 130, 0.15) 0%, transparent 42%),
            linear-gradient(to bottom, rgba(2, 10, 20, 0.5) 0%, transparent 16%),
            linear-gradient(to bottom, transparent 60%, rgba(2, 10, 20, 0.5) 82%, #ffffff 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 22% 48%, rgba(2, 10, 20, 0.55) 0%, transparent 70%)",
        }}
      />

      {/* ── z-[2]: desktop-only feature markers ── */}
      <FeatureMarker label="Dam Safety" className="right-[10%] top-[22%]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
        </svg>
      </FeatureMarker>
      <FeatureMarker label="Water Containment" className="right-[5%] top-[46%]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-3.5 4.5-6 7.8-6 11a6 6 0 1 0 12 0c0-3.2-2.5-6.5-6-11Z" />
        </svg>
      </FeatureMarker>
      <FeatureMarker label="Lining Specialists" className="right-[12%] top-[68%]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 17V11M12 17V7M16 17v-4" />
        </svg>
      </FeatureMarker>

      {/* ── z-[3]: main content ── */}
      <div className="relative z-[3] flex min-h-[88vh] items-center lg:min-h-[92vh]">
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
          <div className="max-w-[42rem] lg:max-w-[47rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200/90 sm:text-[0.8125rem]">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-[clamp(1.875rem,4.8vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-white text-balance">
              {title}
            </h1>

            <p className="mt-5 max-w-[38rem] text-[clamp(1rem,1.8vw,1.125rem)] leading-relaxed text-slate-300">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/quote"
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#0091dc] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_28px_rgba(0,145,220,0.35)] transition hover:bg-[#00a8f0] hover:shadow-[0_12px_32px_rgba(0,145,220,0.42)] sm:w-auto"
              >
                <span>Request a Quote</span>
                <ArrowIcon />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/35 bg-[#051220]/40 px-5 py-3.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition hover:border-[#0091dc]/55 hover:bg-[#0091dc]/15 sm:w-auto"
              >
                <span>Contact Damtech</span>
                <ArrowIcon />
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Services">
              {SERVICE_CHIPS.map((chip) => (
                <li key={chip}>
                  <span className="inline-block rounded-full border border-white/15 bg-[#051220]/45 px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-slate-300 transition-colors hover:border-[#0091dc]/45 hover:text-white sm:text-xs">
                    {chip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
