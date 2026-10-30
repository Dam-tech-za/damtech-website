"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureFirstTouchAttribution } from "@/lib/analytics/attribution-client";
import {
  classifyContactHref,
  contactEventName,
  pushDataLayerEvent,
} from "@/lib/analytics/events";
import {
  META_STANDARD_EVENTS,
  trackMetaEvent,
  trackMetaPageView,
} from "@/lib/analytics/meta-pixel";

/** Where on the page a contact link sits — helps compare header, sticky bar and in-page CTAs. */
function linkLocation(anchor: HTMLAnchorElement): string {
  const explicit = anchor.closest<HTMLElement>("[data-track-location]");
  if (explicit?.dataset.trackLocation) return explicit.dataset.trackLocation;
  if (anchor.closest("header")) return "header";
  if (anchor.closest("footer")) return "footer";
  if (anchor.closest("main")) return "content";
  return "other";
}

/**
 * Public-site measurement: records first-touch attribution for lead forms and
 * pushes click-to-call, WhatsApp and email clicks to the GTM dataLayer.
 * Mounted once in the public chrome (never on admin routes).
 */
export function SiteTracking() {
  const pathname = usePathname();
  const skipInitialPageView = useRef(true);

  useEffect(() => {
    captureFirstTouchAttribution();

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const method = classifyContactHref(anchor.getAttribute("href"));
      if (!method) return;
      const location = linkLocation(anchor);
      pushDataLayerEvent(contactEventName(method), {
        contact_method: method,
        link_location: location,
        page_path: window.location.pathname,
      });
      trackMetaEvent(META_STANDARD_EVENTS.contact, {
        content_name: method,
        content_category: location,
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (skipInitialPageView.current) {
      skipInitialPageView.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname]);

  return null;
}
