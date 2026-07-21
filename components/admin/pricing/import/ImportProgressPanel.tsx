"use client";

const STAGES = [
  "Creating inventory items",
  "Creating price versions",
  "Linking suppliers",
  "Synchronising quote inventory",
  "Writing audit records",
];

export function ImportProgressPanel({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="admin-stack" aria-live="polite">
      <p className="admin-help-text">Importing… please keep this tab open.</p>
      <ul className="imp-analysis__list">
        {STAGES.map((label, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={label}
              className={`imp-analysis__step${done ? " imp-analysis__step--done" : ""}${
                active ? " imp-analysis__step--active" : ""
              }`}
            >
              <span className="imp-analysis__tick" aria-hidden>
                {done ? "✓" : active ? "•" : ""}
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
