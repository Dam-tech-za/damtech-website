"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DamtechLogo } from "@/components/DamtechLogo";
import { MobileNav } from "@/components/MobileNav";
import { HEADER_NAV_LINKS, siteConfig } from "@/lib/site";

const SCROLL_DELTA = 10;
const REVEAL_AT_TOP_PX = 72;

export function Header() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY <= REVEAL_AT_TOP_PX) {
          setVisible(true);
        } else if (delta > SCROLL_DELTA) {
          setVisible(false);
        } else if (delta < -SCROLL_DELTA) {
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 border-b border-white/35 bg-white/60 shadow-[0_8px_32px_rgba(15,39,68,0.06)] backdrop-blur-xl transition-transform duration-300 ease-out supports-[backdrop-filter]:bg-white/50 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="site-container relative flex items-center justify-between gap-4 py-3.5 lg:gap-6 lg:py-4">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <DamtechLogo size={40} className="block shrink-0 translate-y-0.5" />
          <span className="flex min-w-0 flex-col justify-center leading-tight">
            <span className="block truncate text-lg font-bold tracking-tight text-navy">
              {siteConfig.name}
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
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
              className="whitespace-nowrap text-sm font-medium text-slate-700 transition hover:text-water"
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
