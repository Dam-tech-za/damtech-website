"use client";

import { useSyncExternalStore } from "react";

export const RFQ_SUCCESS_STORAGE_KEY = "damtech.rfqSuccess";

type StoredSuccess = { rfqNumber?: string; uploadToken?: string };

/** Keep the private upload token out of the URL (and out of analytics page URLs). */
export function rememberRfqSuccess(rfqNumber: string, uploadToken: string) {
  try {
    window.sessionStorage.setItem(
      RFQ_SUCCESS_STORAGE_KEY,
      JSON.stringify({ rfqNumber, uploadToken } satisfies StoredSuccess),
    );
  } catch {
    // Storage blocked — the confirmation email still carries the upload link.
  }
}

function readStoredToken(rfqNumber: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(RFQ_SUCCESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSuccess;
    return parsed.rfqNumber === rfqNumber && parsed.uploadToken ? parsed.uploadToken : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

/**
 * "Upload photos or drawings" button on the quote success page. The token is read
 * from sessionStorage (set by the form before navigating). A plain <a> forces a full
 * page load, so the upload page — where analytics is disabled — never inherits a
 * client-side analytics session that would record the tokenised URL.
 */
export function QuoteSuccessUpload({
  rfqNumber,
  legacyToken,
}: {
  rfqNumber: string;
  /** Older links included ?upload= in the URL; still honoured. */
  legacyToken?: string;
}) {
  const token = useSyncExternalStore(
    noopSubscribe,
    () => legacyToken || readStoredToken(rfqNumber),
    () => legacyToken || null,
  );

  if (!token || token === "spam") return null;

  return (
    <p>
      <a
        className="btn btn--md btn--primary"
        href={`/quote/${encodeURIComponent(rfqNumber)}/upload/?token=${encodeURIComponent(token)}`}
      >
        Upload photos or drawings
      </a>
    </p>
  );
}
