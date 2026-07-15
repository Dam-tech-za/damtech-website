"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { isNavItemActive, MobileDropdownNav } from "@/components/ServicesNavDropdown";
import { HEADER_NAV_ITEMS } from "@/lib/site";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
      ) : (
        <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pathWhenOpened, setPathWhenOpened] = useState(pathname);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const wasOpen = useRef(false);

  if (pathname !== pathWhenOpened) {
    setPathWhenOpened(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef.current?.focus();
      }
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 text-navy transition hover:border-water hover:text-water"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon open={open} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[var(--header-height)] z-40 bg-navy/30 backdrop-blur-[1px] lg:hidden"
            aria-label="Close menu"
            onClick={close}
          />
          <nav
            id={panelId}
            className="scrollbar-hide fixed inset-x-0 top-[var(--header-height)] z-50 max-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-b border-slate-200 bg-white px-4 py-4 shadow-lg sm:px-6 lg:hidden"
            aria-label="Mobile"
          >
            <ul className="site-container flex flex-col gap-1 !px-0">
              {HEADER_NAV_ITEMS.map((item) => {
                if (item.type === "dropdown") {
                  return (
                    <MobileDropdownNav
                      key={item.label}
                      item={item}
                      pathname={pathname}
                      onNavigate={close}
                    />
                  );
                }

                const active = isNavItemActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-3 text-base font-medium hover:bg-slate-50 hover:text-water ${
                        active ? "text-water" : "text-slate-700"
                      }`}
                      aria-current={active ? "page" : undefined}
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="site-container mt-3 border-t border-slate-100 pt-4 !px-0">
              <Link
                href="/quote/"
                className="btn-primary w-full text-center"
                onClick={close}
              >
                Request a Free Quote
              </Link>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
