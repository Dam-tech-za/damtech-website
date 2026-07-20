import type { DashboardMetrics } from "@/lib/admin/dashboard/types";
import { AdminPanel } from "@/components/admin/ui";

type ProvisionalPipelineProps = {
  provisional: DashboardMetrics["provisional"];
};

function formatQty(value: number, unit: string): string {
  return `${new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: 0,
  }).format(value)} ${unit}`;
}

export function ProvisionalPipeline({ provisional }: ProvisionalPipelineProps) {
  const cards = [
    {
      label: "HDPE/PVC Area",
      value: formatQty(provisional.linerAreaM2, "m²"),
      empty: provisional.linerAreaM2 <= 0,
      icon: "▦",
    },
    {
      label: "Tank Capacity",
      value: formatQty(provisional.tankCapacityKl, "kL"),
      empty: provisional.tankCapacityKl <= 0,
      icon: "◷",
    },
    {
      label: "Torch-on Area",
      value: formatQty(provisional.torchOnAreaM2, "m²"),
      empty: provisional.torchOnAreaM2 <= 0,
      icon: "▣",
    },
  ];

  return (
    <AdminPanel
      title="Provisional Project Pipeline"
      description="Planning estimates from RFQ assets"
    >
      <div className="dash-info-banner dash-info-banner--muted" role="note">
        These quantities are planning estimates and not confirmed orders.
      </div>
      <div className="dash-provisional-grid">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`dash-provisional-card${card.empty ? " is-empty" : ""}`}
          >
            <span className="dash-provisional-card__icon" aria-hidden>
              {card.icon}
            </span>
            <p className="dash-provisional-card__label">{card.label}</p>
            <p className="dash-provisional-card__value">
              {card.empty ? "No estimate yet" : card.value}
            </p>
            <p className="dash-provisional-card__hint">Provisional estimate</p>
          </article>
        ))}
      </div>
    </AdminPanel>
  );
}
