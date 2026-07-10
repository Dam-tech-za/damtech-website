"use client";

import Link from "next/link";

type CalculatorHeroActionsProps = {
  selectorId?: string;
};

export function CalculatorHeroActions({
  selectorId = "calculator-selector",
}: CalculatorHeroActionsProps) {
  const scrollToSelector = () => {
    document.getElementById(selectorId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <button
        type="button"
        className="hero-btn-primary w-full sm:w-auto"
        onClick={scrollToSelector}
      >
        Start Calculating
      </button>
      <Link href="/quote" className="hero-btn-secondary w-full sm:w-auto">
        Request a Quote
      </Link>
    </>
  );
}
