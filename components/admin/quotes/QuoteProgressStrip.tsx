"use client";

import type { ReadinessSection } from "@/lib/quotes/quote-validation";

type QuoteProgressStripProps = {
  sections: ReadinessSection[];
};

const STATUS_ICON: Record<ReadinessSection["status"], string> = {
  complete: "✓",
  incomplete: "○",
  warning: "!",
};

function scrollToSection(id: ReadinessSection["id"]) {
  document.getElementById(`quote-section-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function QuoteProgressStrip({ sections }: QuoteProgressStripProps) {
  return (
    <nav className="quote-progress-strip" aria-label="Quote readiness">
      <ol className="quote-progress-strip__list">
        {sections.map((section, index) => (
          <li key={section.id} className="quote-progress-strip__item">
            {index > 0 ? (
              <span className="quote-progress-strip__sep" aria-hidden>
                |
              </span>
            ) : null}
            <button
              type="button"
              className={`quote-progress-strip__link quote-progress-strip__link--${section.status}`}
              onClick={() => scrollToSection(section.id)}
              aria-label={`${section.label}: ${section.status}`}
            >
              <span className="quote-progress-strip__icon" aria-hidden>
                {STATUS_ICON[section.status]}
              </span>
              <span className="quote-progress-strip__label">{section.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
