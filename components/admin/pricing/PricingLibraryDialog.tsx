"use client";

import { useState } from "react";
import type { EditableLine } from "@/components/admin/QuoteBuilder";
import { MaterialPicker } from "./MaterialPicker";
import { LabourPicker } from "./LabourPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddLine: (line: EditableLine) => void;
  showCost: boolean;
};

export function PricingLibraryDialog({ open, onClose, onAddLine, showCost }: Props) {
  const [tab, setTab] = useState<"material" | "labour">("material");

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(3, 25, 38, 0.6)",
        padding: "1.5rem",
        overflowY: "auto",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="admin-panel"
        style={{ maxWidth: "1200px", margin: "2rem auto" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pricing library"
      >
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h3>Add from pricing library</h3>
            <p className="admin-empty__hint">Pick a material or labour source, then snapshot it into the quote line.</p>
          </div>
          <div className="admin-panel__actions">
            <button
              type="button"
              className={tab === "material" ? "btn btn--md btn--primary" : "btn btn--md btn--secondary"}
              onClick={() => setTab("material")}
            >
              Material
            </button>
            <button
              type="button"
              className={tab === "labour" ? "btn btn--md btn--primary" : "btn btn--md btn--secondary"}
              onClick={() => setTab("labour")}
            >
              Labour
            </button>
            <button type="button" className="btn btn--md btn--secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        {tab === "material" ? (
          <MaterialPicker
            showCost={showCost}
            onAddLine={onAddLine}
            onCancel={onClose}
          />
        ) : (
          <LabourPicker
            showCost={showCost}
            onAddLine={onAddLine}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
