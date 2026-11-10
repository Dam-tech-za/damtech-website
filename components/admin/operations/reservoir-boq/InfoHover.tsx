import type { ReactNode } from "react";

/** An i icon that shows its content on hover (or keyboard focus). In print the icon is hidden and the content is printed in its place. */
export function InfoHover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="rboq-info" tabIndex={0} aria-label={label}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="rboq-info__icon">
          <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="rboq-info__pop" role="tooltip">
          {children}
        </span>
      </span>
      <span className="rboq-info__print">{children}</span>
    </>
  );
}
