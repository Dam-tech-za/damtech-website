"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { phoneTel, whatsAppUrl } from "@/lib/site";

/** Fixed mobile action bar — call, WhatsApp, quote. */
export function MobileStickyCta() {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-200 ease-out sm:px-3 lg:hidden ${
        footerVisible
          ? "pointer-events-none translate-y-full"
          : "translate-y-0"
      }`}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-hidden={footerVisible}
      aria-label="Quick contact"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <a
          href={`tel:${phoneTel}`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-navy sm:text-sm"
        >
          Call
        </a>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-green-200 bg-green-50 px-2 text-xs font-semibold text-green-800 sm:text-sm"
        >
          WhatsApp
        </a>
        <Link
          href="/quote"
          className="btn-primary flex min-h-11 flex-[1.2] items-center justify-center px-2 text-xs sm:text-sm"
        >
          Request Quote
        </Link>
      </div>
    </div>
  );
}
