"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { HeaderNavItem } from "@/lib/site";
import { SERVICES_DROPDOWN_LINKS } from "@/lib/site";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path strokeLinecap="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function isNavItemActive(item: HeaderNavItem, pathname: string): boolean {
  if (item.type === "link") {
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const childActive = item.children.some(
    (child) =>
      pathname === child.href || pathname.startsWith(`${child.href}/`),
  );
  const hubActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  return childActive || hubActive;
}

type ServicesNavDropdownProps = {
  item: Extract<HeaderNavItem, { type: "dropdown" }>;
  pathname: string;
};

export function ServicesNavDropdown({ item, pathname }: ServicesNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = isNavItemActive(item, pathname);

  const openDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const closeDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="site-header__dropdown">
      <Link
        href={item.href}
        className={`site-header__nav-link site-header__nav-link--dropdown${active ? " site-header__nav-link--active" : ""}`}
        aria-current={active ? "page" : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onMouseEnter={openDropdown}
        onMouseLeave={closeDropdown}
        onFocus={openDropdown}
        onClick={() => setOpen(false)}
      >
        {item.label}
        <ChevronIcon open={open} />
      </Link>

      <div
        className={`site-header__dropdown-panel${open ? " site-header__dropdown-panel--open" : ""}`}
        onMouseEnter={openDropdown}
        onMouseLeave={closeDropdown}
      >
        <div
          id={menuId}
          className={`site-header__dropdown-menu${open ? " site-header__dropdown-menu--open" : ""}`}
          role="menu"
          aria-label="Services"
        >
        <ul className="site-header__dropdown-list">
          <li role="none">
            <Link
              href={item.href}
              role="menuitem"
              className="site-header__dropdown-link site-header__dropdown-link--hub"
              onClick={() => setOpen(false)}
            >
              All Services
            </Link>
          </li>
          {item.children.map((child) => {
            const childActive =
              pathname === child.href ||
              pathname.startsWith(`${child.href}/`);
            return (
              <li key={child.href} role="none">
                <Link
                  href={child.href}
                  role="menuitem"
                  className={`site-header__dropdown-link${childActive ? " site-header__dropdown-link--active" : ""}`}
                  aria-current={childActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    </div>
  );
}

type MobileServicesNavProps = {
  pathname: string;
  onNavigate: () => void;
};

export function MobileServicesNav({ pathname, onNavigate }: MobileServicesNavProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const hubActive =
    pathname === "/services" || pathname.startsWith("/services/");
  const childActive = SERVICES_DROPDOWN_LINKS.some(
    (link) =>
      pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  const active = hubActive || childActive;

  return (
    <li>
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium hover:bg-slate-50 hover:text-water ${
          active ? "text-water" : "text-slate-700"
        }`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        Services
        <ChevronIcon open={expanded} />
      </button>
      {expanded ? (
        <ul id={panelId} className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
          <li>
            <Link
              href="/services"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-water"
              onClick={onNavigate}
            >
              All Services
            </Link>
          </li>
          {SERVICES_DROPDOWN_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-water"
                onClick={onNavigate}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export { isNavItemActive };
