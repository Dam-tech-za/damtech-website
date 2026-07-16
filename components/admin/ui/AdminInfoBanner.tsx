import type { ReactNode } from "react";

type AdminInfoBannerProps = {
  children: ReactNode;
  tone?: "info" | "warning" | "muted";
};

export function AdminInfoBanner({
  children,
  tone = "info",
}: AdminInfoBannerProps) {
  return (
    <div className={`admin-info-banner admin-info-banner--${tone}`} role="note">
      <span className="admin-info-banner__icon" aria-hidden>
        i
      </span>
      <div>{children}</div>
    </div>
  );
}
