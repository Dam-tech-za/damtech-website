"use client";

import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
} from "@/components/admin/ui";
import type { ReadinessSection, ValidationIssue } from "@/lib/quotes/quote-validation";
import type { DiscountType, SaveStatus, VatPricingMode } from "@/lib/quotes/quote-builder-types";
import type { QuoteStatus, QuoteTotals } from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";

type QuoteSummaryPanelProps = {
  status: QuoteStatus;
  customerName: string;
  projectTitle: string;
  totals: QuoteTotals & { lineDiscountTotal?: number; netExVat?: number };
  showCost: boolean;
  discountType: DiscountType;
  discountValue: number;
  vatPricingMode: VatPricingMode;
  vatRate: number;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: number) => void;
  onVatModeChange: (mode: VatPricingMode) => void;
  onVatRateChange: (rate: number) => void;
  sections: ReadinessSection[];
  blockers: ValidationIssue[];
  saveStatus: SaveStatus;
  savedAt?: string | null;
  onSaveDraft: () => void;
  onPreview: () => void;
  onSend: () => void;
  savePending: boolean;
  canSend?: boolean;
  sendDisabled?: boolean;
};

function ChecklistIcon({ status }: { status: ReadinessSection["status"] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": true,
  } as const;
  if (status === "complete") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="7" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.3" />
        <path
          d="M5 8.2 7 10l4-4.2"
          stroke="#16a34a"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "warning") {
    return (
      <svg {...common}>
        <path
          d="M8 2 15 14H1L8 2Z"
          fill="#fef3c7"
          stroke="#d97706"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M8 6.5v3.2" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.6" r="0.8" fill="#d97706" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6.5" stroke="#94a3b8" strokeWidth="1.3" />
    </svg>
  );
}

function saveStatusLabel(status: SaveStatus, savedAt?: string | null): string {
  switch (status) {
    case "idle":
      return "";
    case "unsaved":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "saved":
      return savedAt ? `Saved at ${savedAt}` : "Saved";
    case "error":
      return "Save failed";
  }
}

export function QuoteSummaryPanel({
  status,
  customerName,
  projectTitle,
  totals,
  showCost,
  discountType,
  discountValue,
  vatPricingMode,
  vatRate,
  onDiscountTypeChange,
  onDiscountValueChange,
  onVatModeChange,
  onVatRateChange,
  sections,
  blockers,
  saveStatus,
  savedAt,
  onSaveDraft,
  onPreview,
  onSend,
  savePending,
  canSend = true,
  sendDisabled = false,
}: QuoteSummaryPanelProps) {
  const hasBlockers = blockers.some((b) => b.level === "error");

  return (
    <aside className="admin-quote-builder__aside">
      <AdminPanel title="Quote Summary" className="admin-quote-builder__totals-panel">
        {/* Status & context */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <AdminStatusBadge status={status} domain="quote" />
          {customerName ? <span>{customerName}</span> : null}
        </div>
        {projectTitle ? (
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--admin-text-muted)" }}>
            {projectTitle}
          </p>
        ) : null}

        {/* Financial totals */}
        <dl className="admin-quote-totals">
          <div>
            <dt>Subtotal ex VAT</dt>
            <dd>{formatZar(totals.subtotalExVat)}</dd>
          </div>
          {(totals as { lineDiscountTotal?: number }).lineDiscountTotal ? (
            <div>
              <dt>Line discounts</dt>
              <dd>{formatZar((totals as { lineDiscountTotal: number }).lineDiscountTotal)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Quote discount</dt>
            <dd>{formatZar(totals.discountAmount)}</dd>
          </div>
          {(totals as { netExVat?: number }).netExVat != null ? (
            <div>
              <dt>Net ex VAT</dt>
              <dd>{formatZar((totals as { netExVat: number }).netExVat)}</dd>
            </div>
          ) : null}
          <div>
            <dt>VAT</dt>
            <dd>{formatZar(totals.vatAmount)}</dd>
          </div>
          <div>
            <dt>Total inc VAT</dt>
            <dd style={{ fontSize: "1.125rem" }}>{formatZar(totals.totalIncVat)}</dd>
          </div>
        </dl>

        {/* Internal profitability */}
        {showCost ? (
          <details className="quote-summary__profitability">
            <summary>Internal Profitability</summary>
            <dl className="admin-quote-totals" style={{ marginTop: "0.5rem" }}>
              <div>
                <dt>Direct cost</dt>
                <dd>{formatZar(totals.directCost)}</dd>
              </div>
              <div>
                <dt>Gross profit</dt>
                <dd>{formatZar(totals.grossProfit)}</dd>
              </div>
              <div>
                <dt>Gross margin</dt>
                <dd>{totals.grossMarginPercent.toFixed(1)}%</dd>
              </div>
            </dl>
          </details>
        ) : null}

        {/* Pricing settings */}
        <details className="quote-summary__pricing-settings">
          <summary>Pricing settings</summary>
          <div className="admin-form-grid" style={{ marginTop: "0.5rem" }}>
            <AdminField label="Discount type">
              <AdminSelect
                value={discountType}
                onChange={(e) => onDiscountTypeChange(e.target.value as DiscountType)}
              >
                <option value="none">None</option>
                <option value="amount">Fixed amount</option>
                <option value="percent">Percentage</option>
              </AdminSelect>
            </AdminField>
            {discountType !== "none" ? (
              <AdminField label={discountType === "percent" ? "Discount %" : "Discount (ZAR)"}>
                <AdminInput
                  type="number"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => onDiscountValueChange(Number(e.target.value))}
                />
              </AdminField>
            ) : null}
            <AdminField label="Unit prices">
              <AdminSelect
                value={vatPricingMode}
                onChange={(e) => onVatModeChange(e.target.value as VatPricingMode)}
              >
                <option value="exclusive">Exclude VAT</option>
                <option value="inclusive">Include VAT</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="VAT rate %">
              <AdminInput
                type="number"
                step="0.01"
                value={vatRate}
                onChange={(e) => onVatRateChange(Number(e.target.value))}
              />
            </AdminField>
          </div>
        </details>

        {/* Validation checklist */}
        <ul className="quote-summary__checklist">
          {sections.map((s) => (
            <li
              key={s.id}
              className={`quote-summary__checklist-item quote-summary__checklist-item--${s.status}`}
            >
              <ChecklistIcon status={s.status} />
              {s.label}
            </li>
          ))}
        </ul>

        {/* Save status */}
        {saveStatus !== "idle" ? (
          <p className="quote-summary__save-status" aria-live="polite">
            {saveStatusLabel(saveStatus, savedAt)}
          </p>
        ) : null}

        {/* Actions */}
        <div className="admin-form-actions">
          <AdminButton
            type="button"
            variant="primary"
            onClick={onSaveDraft}
            disabled={savePending}
          >
            {savePending ? "Saving…" : "Save Draft"}
          </AdminButton>
          <AdminButton type="button" variant="secondary" onClick={onPreview}>
            Preview
          </AdminButton>
          {canSend ? (
            <AdminButton
              type="button"
              variant="secondary"
              onClick={onSend}
              disabled={sendDisabled || hasBlockers}
            >
              Send
            </AdminButton>
          ) : null}
        </div>
      </AdminPanel>
    </aside>
  );
}
