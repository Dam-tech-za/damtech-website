import { SiteSection } from "@/components/SiteSection";
import {
  SERVICE_HUB_PROCESS_STEPS,
  type ProcessStep,
} from "@/lib/process-steps";

type ProcessStepsSectionProps = {
  steps?: readonly ProcessStep[];
  eyebrow?: string;
  title?: string;
  intro?: string;
  headingId?: string;
  tone?: "default" | "muted";
};

/** Homepage-style numbered process cards for inner pages. */
export function ProcessStepsSection({
  steps = SERVICE_HUB_PROCESS_STEPS,
  eyebrow = "HOW IT WORKS",
  title = "Our Simple Service Process",
  intro = "From your first enquiry to final handover, Damtech keeps the process clear, practical and hassle-free.",
  headingId = "service-process-heading",
  tone = "muted",
}: ProcessStepsSectionProps) {
  return (
    <SiteSection tone={tone} aria-labelledby={headingId}>
      <div className="home-process-projects__process">
        <span className="home-process-projects__decor" aria-hidden />

        <header className="home-process-projects__header">
          <p className="home-process-projects__eyebrow">{eyebrow}</p>
          <h2 id={headingId} className="home-process-projects__title">
            {title}
          </h2>
          <span className="home-process-projects__divider" aria-hidden />
          <p className="home-process-projects__intro">{intro}</p>
        </header>

        <ol className="home-process-projects__steps">
          {steps.map((step) => (
            <li key={step.id} className="home-process-projects__step-item">
              <article className="home-process-projects__step">
                <div className="home-process-projects__step-top">
                  <span className="home-process-projects__step-number" aria-hidden>
                    {step.step}
                  </span>
                  <span className="home-process-projects__step-icon-wrap" aria-hidden>
                    <step.Icon className="home-process-projects__step-icon" />
                  </span>
                </div>
                <h3 className="home-process-projects__step-title">{step.title}</h3>
                <p className="home-process-projects__step-text">{step.description}</p>
                {step.note ? (
                  <p className="home-process-projects__step-note">{step.note}</p>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </SiteSection>
  );
}
