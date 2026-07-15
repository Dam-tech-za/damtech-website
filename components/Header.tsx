"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
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

type ScrollHeaderState = {
  visible: boolean;
  scrolled: boolean;
};

const EMPTY_SCROLL: ScrollHeaderState = { visible: true, scrolled: false };

let scrollState: ScrollHeaderState = EMPTY_SCROLL;
const scrollListeners = new Set<() => void>();
let scrollAttached = false;
let lastScrollY = 0;
let scrollAccumulator = 0;
let ticking = false;

function emitScroll() {
  for (const listener of scrollListeners) listener();
}

function attachScrollIfNeeded() {
  if (scrollAttached || typeof window === "undefined") return;
  scrollAttached = true;
  lastScrollY = window.scrollY;
  scrollState = {
    visible: true,
    scrolled: window.scrollY > SCROLLED_AT_PX,
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      if (Math.abs(delta) < 2) {
        ticking = false;
        return;
      }

      let visible = scrollState.visible;
      if (currentY <= REVEAL_AT_TOP_PX) {
        visible = true;
        scrollAccumulator = 0;
      } else if (delta > SCROLL_DELTA) {
        scrollAccumulator =
          scrollAccumulator >= 0 ? scrollAccumulator + delta : delta;
        if (currentY >= HIDE_MIN_Y && scrollAccumulator >= HIDE_AFTER_PX) {
          visible = false;
          scrollAccumulator = 0;
        }
      } else if (delta < -SCROLL_DELTA) {
        scrollAccumulator =
          scrollAccumulator <= 0 ? scrollAccumulator + delta : delta;
        if (Math.abs(scrollAccumulator) >= REVEAL_AFTER_PX) {
          visible = true;
          scrollAccumulator = 0;
        }
      }

      scrollState = {
        visible,
        scrolled: currentY > SCROLLED_AT_PX,
      };
      lastScrollY = currentY;
      ticking = false;
      emitScroll();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}

function subscribeScroll(listener: () => void) {
  attachScrollIfNeeded();
  scrollListeners.add(listener);
  return () => {
    scrollListeners.delete(listener);
  };
}

function getScrollSnapshot(): ScrollHeaderState {
  attachScrollIfNeeded();
  return scrollState;
}

function getServerScrollSnapshot(): ScrollHeaderState {
  return EMPTY_SCROLL;
}

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const { visible, scrolled } = useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getServerScrollSnapshot,
  );

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
          <Link href="/quote/" className="site-header__cta">
            Request a Quote
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
