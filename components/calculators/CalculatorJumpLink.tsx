"use client";

import type { ReactNode } from "react";
import { CALCULATORS_HUB_PATH } from "@/lib/calculator-links";

type CalculatorJumpLinkProps = {
  calculatorId: string;
  children: ReactNode;
  className?: string;
  /** Render as heading-level link (e.g. H2). */
  asHeading?: boolean;
};

/** Selects a calculator and scrolls to its input panel (same-page or hub deep link). */
export function CalculatorJumpLink({
  calculatorId,
  children,
  className,
  asHeading = false,
}: CalculatorJumpLinkProps) {
  const href = `${CALCULATORS_HUB_PATH}#${calculatorId}`;

  const activate = () => {
    const onHub =
      typeof window !== "undefined" &&
      window.location.pathname.replace(/\/$/, "") ===
        CALCULATORS_HUB_PATH.replace(/\/$/, "");

    if (onHub) {
      const nextHash = `#${calculatorId}`;
      if (window.location.hash !== nextHash) {
        window.location.hash = calculatorId;
      } else {
        window.dispatchEvent(
          new CustomEvent("damtech:select-calculator", {
            detail: { id: calculatorId, scroll: true },
          }),
        );
      }
      return;
    }

    window.location.assign(href);
  };

  if (asHeading) {
    return (
      <a
        href={href}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          activate();
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        activate();
      }}
    >
      {children}
    </a>
  );
}
