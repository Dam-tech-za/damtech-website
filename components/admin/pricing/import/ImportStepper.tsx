"use client";

import type { ImportStepId } from "./types";

type StepState = "current" | "completed" | "upcoming" | "error";

const STEPS: Array<{ id: ImportStepId; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "preview", label: "Preview" },
  { id: "import", label: "Import" },
  { id: "complete", label: "Complete" },
];

type ImportStepperProps = {
  current: ImportStepId;
  errorStep?: ImportStepId | null;
};

export function ImportStepper({ current, errorStep }: ImportStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  function stateFor(index: number, id: ImportStepId): StepState {
    if (errorStep === id) return "error";
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "upcoming";
  }

  return (
    <nav className="imp-stepper" aria-label="Import progress">
      <ol className="imp-stepper__list">
        {STEPS.map((step, index) => {
          const state = stateFor(index, step.id);
          return (
            <li
              key={step.id}
              className={`imp-stepper__item imp-stepper__item--${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="imp-stepper__dot" aria-hidden>
                {state === "completed" ? "✓" : state === "error" ? "!" : index + 1}
              </span>
              <span className="imp-stepper__text">
                <span className="imp-stepper__label">{step.label}</span>
              </span>
              {index < STEPS.length - 1 ? (
                <span className="imp-stepper__bar" aria-hidden />
              ) : null}
              <span className="sr-only">
                {step.label}: {state}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
