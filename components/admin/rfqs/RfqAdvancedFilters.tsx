"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SERVICE_OPTIONS, PROVINCE_OPTIONS } from "@/lib/form";
import { ENQUIRY_CHANNELS } from "@/lib/rfq/enquiry-channel";
import { RFQ_ASSET_TYPES, MEASUREMENT_METHODS } from "@/lib/rfq/public-schema";
import type { RfqInboxFilters } from "@/lib/admin/rfqs/rfq-inbox-types";
import { enquiryChannelLabel } from "@/lib/rfq/enquiry-channel";

type StaffMember = {
  id: string;
  email: string;
  full_name: string | null;
};

type RfqAdvancedFiltersTriggerProps = {
  filters: RfqInboxFilters;
  staff: StaffMember[];
  advancedCount: number;
};

export function RfqAdvancedFiltersTrigger({
  filters,
  staff,
  advancedCount,
}: RfqAdvancedFiltersTriggerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function applyFilters(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const str = String(value).trim();
      if (str) params.set(key, str);
    }
    router.push(`/admin/rfqs/?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn--md btn--secondary rfq-toolbar__more"
        aria-expanded={open}
        aria-controls="rfq-advanced-filters"
        onClick={() => setOpen(true)}
      >
        More filters{advancedCount > 0 ? ` (${advancedCount})` : ""}
      </button>

      {open ? (
        <div className="admin-drawer" role="presentation">
          <button
            type="button"
            className="admin-drawer__backdrop"
            aria-label="Close filters"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
          <div
            ref={panelRef}
            id="rfq-advanced-filters"
            className="admin-drawer__panel rfq-advanced-filters"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <header className="admin-drawer__header">
              <h2 id={titleId}>Advanced filters</h2>
              <button
                type="button"
                className="btn btn--sm btn--secondary"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
            </header>
            <form
              className="admin-drawer__body rfq-advanced-filters__form"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters(event.currentTarget);
              }}
            >
              <input type="hidden" name="q" value={filters.q ?? ""} />
              <input type="hidden" name="status" value={filters.status ?? ""} />
              <input type="hidden" name="sort" value={filters.sort ?? "submitted_desc"} />

              <fieldset className="rfq-advanced-filters__group">
                <legend>Customer and location</legend>
                <label>
                  Province
                  <select
                    name="province"
                    className="form-input"
                    defaultValue={filters.province ?? ""}
                  >
                    <option value="">All provinces</option>
                    {PROVINCE_OPTIONS.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Source
                  <select
                    name="source"
                    className="form-input"
                    defaultValue={filters.source ?? ""}
                  >
                    <option value="">All sources</option>
                    {ENQUIRY_CHANNELS.map((channel) => (
                      <option key={channel} value={channel}>
                        {enquiryChannelLabel(channel)}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="rfq-advanced-filters__group">
                <legend>Project</legend>
                <label>
                  Service
                  <select
                    name="service"
                    className="form-input"
                    defaultValue={filters.service ?? ""}
                  >
                    <option value="">All services</option>
                    {SERVICE_OPTIONS.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Material preference
                  <input
                    name="materialPreference"
                    className="form-input"
                    defaultValue={filters.materialPreference ?? ""}
                    placeholder="Material preference"
                  />
                </label>
                <label>
                  Asset type
                  <select
                    name="assetType"
                    className="form-input"
                    defaultValue={filters.assetType ?? ""}
                  >
                    <option value="">All asset types</option>
                    {RFQ_ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Measurement method
                  <select
                    name="measurementMethod"
                    className="form-input"
                    defaultValue={filters.measurementMethod ?? ""}
                  >
                    <option value="">Any method</option>
                    {MEASUREMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Measurement status
                  <select
                    name="measurementRequired"
                    className="form-input"
                    defaultValue={filters.measurementRequired ?? ""}
                  >
                    <option value="">Any</option>
                    <option value="1">Site measurement required</option>
                  </select>
                </label>
                <div className="rfq-advanced-filters__row">
                  <label>
                    Min size (m²)
                    <input
                      type="number"
                      name="minMaterialArea"
                      className="form-input"
                      step="any"
                      defaultValue={filters.minMaterialArea ?? ""}
                    />
                  </label>
                  <label>
                    Max size (m²)
                    <input
                      type="number"
                      name="maxMaterialArea"
                      className="form-input"
                      step="any"
                      defaultValue={filters.maxMaterialArea ?? ""}
                    />
                  </label>
                </div>
                <div className="rfq-advanced-filters__row">
                  <label>
                    Min capacity (kL)
                    <input
                      type="number"
                      name="minTankCapacity"
                      className="form-input"
                      step="any"
                      defaultValue={filters.minTankCapacity ?? ""}
                    />
                  </label>
                  <label>
                    Max capacity (kL)
                    <input
                      type="number"
                      name="maxTankCapacity"
                      className="form-input"
                      step="any"
                      defaultValue={filters.maxTankCapacity ?? ""}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="rfq-advanced-filters__group">
                <legend>Workflow</legend>
                <label>
                  Assigned estimator
                  <select
                    name="assigned"
                    className="form-input"
                    defaultValue={filters.assigned ?? ""}
                  >
                    <option value="">Anyone</option>
                    <option value="unassigned">Unassigned</option>
                    {staff.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.full_name || person.email}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rfq-advanced-filters__row">
                  <label>
                    Submitted from
                    <input
                      type="date"
                      name="from"
                      className="form-input"
                      defaultValue={filters.from ?? ""}
                    />
                  </label>
                  <label>
                    Submitted to
                    <input
                      type="date"
                      name="to"
                      className="form-input"
                      defaultValue={filters.to ?? ""}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="rfq-advanced-filters__group">
                <legend>Supporting information</legend>
                <label>
                  Attachments
                  <select
                    name="hasAttachments"
                    className="form-input"
                    defaultValue={filters.hasAttachments ?? ""}
                  >
                    <option value="">Any</option>
                    <option value="1">Has attachments</option>
                    <option value="0">No attachments</option>
                  </select>
                </label>
                <label>
                  Drawings
                  <select
                    name="hasDrawings"
                    className="form-input"
                    defaultValue={filters.hasDrawings ?? ""}
                  >
                    <option value="">Any</option>
                    <option value="1">Has drawings</option>
                  </select>
                </label>
                <label>
                  Calculator data
                  <select
                    name="hasCalculator"
                    className="form-input"
                    defaultValue={filters.hasCalculator ?? ""}
                  >
                    <option value="">Any</option>
                    <option value="1">Has calculator / assets</option>
                    <option value="0">No calculator</option>
                  </select>
                </label>
              </fieldset>

              <footer className="rfq-advanced-filters__footer">
                <button type="submit" className="btn btn--md btn--primary">
                  Apply filters
                </button>
                <button
                  type="button"
                  className="btn btn--md btn--secondary"
                  onClick={() => router.push("/admin/rfqs/")}
                >
                  Clear all
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
