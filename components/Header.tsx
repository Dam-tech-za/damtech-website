"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DamtechLogo } from "@/components/DamtechLogo";
import { MobileNav } from "@/components/MobileNav";
import { isNavItemActive, ServicesNavDropdown } from "@/components/ServicesNavDropdown";
import { HEADER_NAV_ITEMS } from "@/lib/site";

const SCROLL_DELTA = 12;
const REVEAL_AT_TOP_PX = 120;
const SCROLLED_AT_PX = 8;
const HIDE_AFTER_PX = 56;
const REVEAL_AFTER_PX = 28;
const HIDE_MIN_Y = 180;

export function Header() {
  const pathname = usePathname();
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
    setScrolled(window.scrollY > SCROLLED_AT_PX);

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
          scrollAccumulator.current =
            scrollAccumulator.current >= 0
              ? scrollAccumulator.current + delta
              : delta;
          if (currentY >= HIDE_MIN_Y && scrollAccumulator.current >= HIDE_AFTER_PX) {
            setVisible(false);
            scrollAccumulator.current = 0;
          }
        } else if (delta < -SCROLL_DELTA) {
          scrollAccumulator.current =
            scrollAccumulator.current <= 0
              ? scrollAccumulator.current + delta
              : delta;
          if (Math.abs(scrollAccumulator.current) >= REVEAL_AFTER_PX) {
            setVisible(true);
            scrollAccumulator.current = 0;
          }
        }

        setScrolled(currentY > SCROLLED_AT_PX);

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
      className={`site-header fixed inset-x-0 top-0 z-50 border-b transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${scrolled ? "site-header--scrolled" : ""}`}
    >
      <div className="site-shell site-header__inner">
        <Link href="/" className="site-header__brand group">
          <DamtechLogo size={38} className="site-header__logo" />
          <span className="site-header__brand-text">
            <span className="site-header__brand-title">Damtech</span>
            <span className="site-header__brand-subtitle">
              Dam linings &amp; waterproofing
            </span>
          </span>
        </Link>

        <nav className="site-header__nav hidden lg:flex" aria-label="Main">
          {HEADER_NAV_ITEMS.map((item) => {
            if (item.type === "dropdown") {
              return (
                <ServicesNavDropdown
                  key={item.label}
                  item={item}
                  pathname={pathname}
                />
              );
            }

            const active = isNavItemActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-header__nav-link${active ? " site-header__nav-link--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header__actions">
          <Link href="/quote" className="site-header__cta hidden md:inline-flex">
            Request a Free Quote
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
