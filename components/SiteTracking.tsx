"use client";

import { useEffect } from "react";
import { captureFirstTouchAttribution } from "@/lib/analytics/attribution-client";
import {
  classifyContactHref,
  contactEventName,
  pushDataLayerEvent,
} from "@/lib/analytics/events";

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
  useEffect(() => {
    captureFirstTouchAttribution();

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const method = classifyContactHref(anchor.getAttribute("href"));
      if (!method) return;
      pushDataLayerEvent(contactEventName(method), {
        contact_method: method,
        link_location: linkLocation(anchor),
        page_path: window.location.pathname,
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
