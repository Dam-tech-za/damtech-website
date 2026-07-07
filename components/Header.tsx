"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DamtechLogo } from "@/components/DamtechLogo";
import { MobileNav } from "@/components/MobileNav";
import { HEADER_NAV_LINKS, siteConfig } from "@/lib/site";

const SCROLL_DELTA = 12;
const REVEAL_AT_TOP_PX = 120;
const SOLID_AT_PX = 8;
const HIDE_AFTER_PX = 56;
const REVEAL_AFTER_PX = 28;
const HIDE_MIN_Y = 180;

export function Header() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setHeaderHeightVar = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`,
      );
    };

    setHeaderHeightVar();

    const resizeObserver = new ResizeObserver(setHeaderHeightVar);
    resizeObserver.observe(header);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setScrolled(window.scrollY > SOLID_AT_PX);

    const onScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        if (Math.abs(delta) < 2) {
          ticking.current = false;
          return;
        }

        if (currentY <= REVEAL_AT_TOP_PX) {
          setVisible(true);
          scrollAccumulator.current = 0;
        } else if (delta > SCROLL_DELTA) {
          // Accumulate downward scroll before hiding to prevent flicker.
          scrollAccumulator.current =
            scrollAccumulator.current >= 0
              ? scrollAccumulator.current + delta
              : delta;
          if (currentY >= HIDE_MIN_Y && scrollAccumulator.current >= HIDE_AFTER_PX) {
            setVisible(false);
            scrollAccumulator.current = 0;
          }
        } else if (delta < -SCROLL_DELTA) {
          // Accumulate upward scroll before revealing to prevent flicker.
          scrollAccumulator.current =
            scrollAccumulator.current <= 0
              ? scrollAccumulator.current + delta
              : delta;
          if (Math.abs(scrollAccumulator.current) >= REVEAL_AFTER_PX) {
            setVisible(true);
            scrollAccumulator.current = 0;
          }
        }

        setScrolled(currentY > SOLID_AT_PX);

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`site-header fixed inset-x-0 top-0 z-50 backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl transition-[transform,opacity,background-color,box-shadow,border-color] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      } ${
        scrolled
          ? "border-b bg-[color:var(--header-bg-scrolled)] shadow-[var(--header-shadow-scrolled)] border-[color:var(--header-border-scrolled)]"
          : "border-b bg-[color:var(--header-bg-top)] shadow-[var(--header-shadow-top)] border-[color:var(--header-border-top)]"
      }`}
    >
      <div className="site-container relative flex h-[var(--site-header-height)] items-center justify-between gap-4 lg:gap-6">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <DamtechLogo size={36} className="block shrink-0" />
          <span className="flex min-w-0 flex-col justify-center leading-tight">
            <span className="block truncate text-lg font-bold tracking-tight text-navy">
              {siteConfig.name}
            </span>
            <span className="hidden text-xs text-slate-600 sm:block">
              Dam liners &amp; waterproofing
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-5 lg:flex lg:flex-1 lg:justify-center xl:gap-6"
          aria-label="Main"
        >
          {HEADER_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-navy transition hover:text-water"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/quote" className="btn-primary hidden text-sm sm:inline-flex">
            Request a Free Quote
          </Link>
          <MobileNav links={HEADER_NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
