"use client";

import type { ReadinessSection } from "@/lib/quotes/quote-validation";

type QuoteProgressStripProps = {
  sections: ReadinessSection[];
};

function scrollToSection(id: ReadinessSection["id"]) {
  document.getElementById(`quote-section-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function StepIcon({
  status,
  index,
}: {
  status: ReadinessSection["status"];
  index: number;
}) {
  if (status === "complete") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none">
        <path
          d="M5 12.5l4 4 10-10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "warning") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none">
        <path
          d="M12 3l9 16H3L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return <span className="quote-stepper__num">{index + 1}</span>;
}

export function QuoteProgressStrip({ sections }: QuoteProgressStripProps) {
  const currentIndex = (() => {
    const idx = sections.findIndex((s) => s.status !== "complete");
    return idx === -1 ? sections.length - 1 : idx;
  })();
  const current = sections[currentIndex];

  return (
    <nav className="quote-stepper" aria-label="Quote progress">
      <ol className="quote-stepper__list">
        {sections.map((section, index) => {
          const isCurrent = index === currentIndex;
          return (
            <li
              key={section.id}
              className={`quote-stepper__item quote-stepper__item--${section.status}${
                isCurrent ? " is-current" : ""
              }`}
            >
              <button
                type="button"
                className="quote-stepper__button"
                onClick={() => scrollToSection(section.id)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${index + 1} of ${sections.length}: ${section.label} (${section.status})`}
              >
                <span className="quote-stepper__marker" aria-hidden>
                  <StepIcon status={section.status} index={index} />
                </span>
                <span className="quote-stepper__text">{section.label}</span>
              </button>
              {index < sections.length - 1 ? (
                <span className="quote-stepper__connector" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="quote-stepper__mobile" aria-hidden>
        Step {currentIndex + 1} of {sections.length} — {current?.label}
      </p>
    </nav>
  );
}
