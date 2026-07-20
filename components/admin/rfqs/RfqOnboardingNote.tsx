"use client";

import { useState } from "react";

const STORAGE_KEY = "damtech-rfq-onboarding-dismissed";

export function RfqOnboardingNote() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== "1";
  });

  if (!visible) return null;

  return (
    <aside className="rfq-onboarding-note" role="note">
      <p>
        Simple website enquiries and calculator-prepared RFQs both appear in this
        inbox.
      </p>
      <button
        type="button"
        className="rfq-onboarding-note__dismiss"
        aria-label="Dismiss note"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
      >
        Dismiss
      </button>
    </aside>
  );
}
