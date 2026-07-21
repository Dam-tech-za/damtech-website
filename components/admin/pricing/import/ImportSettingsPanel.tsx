"use client";

import { useState } from "react";
import { AdminButton, AdminField, AdminSelect } from "@/components/admin/ui";
import type { ImportSettings } from "./types";

type ImportSettingsPanelProps = {
  settings: ImportSettings;
  onChange: (settings: ImportSettings) => void;
};

export function ImportSettingsPanel({ settings, onChange }: ImportSettingsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const set = <K extends keyof ImportSettings>(key: K, value: ImportSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="admin-stack" style={{ display: "grid", gap: "0.85rem" }}>
      <div className="admin-form-grid" style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
        <AdminField label="Import mode">
          <AdminSelect
            value={settings.importMode}
            onChange={(e) => set("importMode", e.target.value as ImportSettings["importMode"])}
          >
            <option value="valid_rows_only">Valid rows only</option>
            <option value="all_or_nothing">All or nothing</option>
          </AdminSelect>
        </AdminField>
        <AdminField label="Duplicate default">
          <AdminSelect
            value={settings.duplicateMode}
            onChange={(e) => set("duplicateMode", e.target.value as ImportSettings["duplicateMode"])}
          >
            <option value="skip">Skip existing</option>
            <option value="update_fields">Update details + new price</option>
            <option value="add_price">Add price version</option>
            <option value="reactivate">Reactivate archived</option>
          </AdminSelect>
        </AdminField>
      </div>

      <AdminButton type="button" size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
        {expanded ? "Hide advanced options" : "Advanced options"}
      </AdminButton>

      {expanded ? (
        <div className="admin-form-grid" style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
          <AdminField label="New prices">
            <AdminSelect
              value={settings.newPrices}
              onChange={(e) => set("newPrices", e.target.value as ImportSettings["newPrices"])}
            >
              <option value="current">Set as current</option>
              <option value="future">Add as future price</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Unknown suppliers">
            <AdminSelect
              value={settings.unknownSuppliers}
              onChange={(e) =>
                set("unknownSuppliers", e.target.value as ImportSettings["unknownSuppliers"])
              }
            >
              <option value="leave">Leave unassigned</option>
              <option value="create">Create supplier records</option>
              <option value="review">Review individually</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Manual-confirmation rows">
            <AdminSelect
              value={settings.manualConfirmation}
              onChange={(e) =>
                set("manualConfirmation", e.target.value as ImportSettings["manualConfirmation"])
              }
            >
              <option value="active_warning">Import as active with warning</option>
              <option value="inactive">Import as inactive</option>
              <option value="exclude">Exclude</option>
            </AdminSelect>
          </AdminField>
        </div>
      ) : null}
    </div>
  );
}
