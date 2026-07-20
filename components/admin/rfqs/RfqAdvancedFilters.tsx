"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SERVICE_OPTIONS, PROVINCE_OPTIONS } from "@/lib/form";
import { ENQUIRY_CHANNELS } from "@/lib/rfq/enquiry-channel";
import { RFQ_ASSET_TYPES, MEASUREMENT_METHODS } from "@/lib/rfq/public-schema";
import type { RfqInboxFilters } from "@/lib/admin/rfqs/rfq-inbox-types";
import { enquiryChannelLabel } from "@/lib/rfq/enquiry-channel";
import {
  AdminButton,
  AdminDateInput,
  AdminField,
  AdminFilterDrawer,
  AdminInput,
  AdminSelect,
} from "@/components/admin/ui";

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
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function applyFilters(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const str = String(value).trim();
      if (str) params.set(key, str);
    }
    router.push(`/admin/rfqs/?${params.toString()}`);
    closeDrawer();
  }

  return (
    <>
      <AdminButton
        ref={triggerRef}
        type="button"
        variant="secondary"
        aria-expanded={open}
        aria-controls="rfq-advanced-filters"
        onClick={() => setOpen(true)}
      >
        More filters{advancedCount > 0 ? ` (${advancedCount})` : ""}
      </AdminButton>

      <AdminFilterDrawer
        open={open}
        title="Advanced filters"
        onClose={closeDrawer}
        footer={
          <>
            <AdminButton type="submit" form="rfq-advanced-filters-form" variant="primary">
              Apply filters
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/rfqs/")}
            >
              Clear all
            </AdminButton>
          </>
        }
      >
        <form
          id="rfq-advanced-filters-form"
          className="admin-advanced-filters__form"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters(event.currentTarget);
          }}
        >
          <input type="hidden" name="q" value={filters.q ?? ""} />
          <input type="hidden" name="status" value={filters.status ?? ""} />
          <input type="hidden" name="sort" value={filters.sort ?? "submitted_desc"} />

          <fieldset className="admin-advanced-filters__group">
            <legend>Customer and location</legend>
            <AdminField label="Province">
              <AdminSelect name="province" defaultValue={filters.province ?? ""}>
                <option value="">All provinces</option>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Source">
              <AdminSelect name="source" defaultValue={filters.source ?? ""}>
                <option value="">All sources</option>
                {ENQUIRY_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {enquiryChannelLabel(channel)}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </fieldset>

          <fieldset className="admin-advanced-filters__group">
            <legend>Project</legend>
            <AdminField label="Service">
              <AdminSelect name="service" defaultValue={filters.service ?? ""}>
                <option value="">All services</option>
                {SERVICE_OPTIONS.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Material preference">
              <AdminInput
                name="materialPreference"
                defaultValue={filters.materialPreference ?? ""}
                placeholder="Material preference"
              />
            </AdminField>
            <AdminField label="Asset type">
              <AdminSelect name="assetType" defaultValue={filters.assetType ?? ""}>
                <option value="">All asset types</option>
                {RFQ_ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Measurement method">
              <AdminSelect
                name="measurementMethod"
                defaultValue={filters.measurementMethod ?? ""}
              >
                <option value="">Any method</option>
                {MEASUREMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.replace(/_/g, " ")}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Measurement status">
              <AdminSelect
                name="measurementRequired"
                defaultValue={filters.measurementRequired ?? ""}
              >
                <option value="">Any</option>
                <option value="1">Site measurement required</option>
              </AdminSelect>
            </AdminField>
            <div className="admin-advanced-filters__row">
              <AdminField label="Min size (m²)">
                <AdminInput
                  type="number"
                  name="minMaterialArea"
                  step="any"
                  defaultValue={filters.minMaterialArea ?? ""}
                />
              </AdminField>
              <AdminField label="Max size (m²)">
                <AdminInput
                  type="number"
                  name="maxMaterialArea"
                  step="any"
                  defaultValue={filters.maxMaterialArea ?? ""}
                />
              </AdminField>
            </div>
            <div className="admin-advanced-filters__row">
              <AdminField label="Min capacity (kL)">
                <AdminInput
                  type="number"
                  name="minTankCapacity"
                  step="any"
                  defaultValue={filters.minTankCapacity ?? ""}
                />
              </AdminField>
              <AdminField label="Max capacity (kL)">
                <AdminInput
                  type="number"
                  name="maxTankCapacity"
                  step="any"
                  defaultValue={filters.maxTankCapacity ?? ""}
                />
              </AdminField>
            </div>
          </fieldset>

          <fieldset className="admin-advanced-filters__group">
            <legend>Workflow</legend>
            <AdminField label="Assigned estimator">
              <AdminSelect name="assigned" defaultValue={filters.assigned ?? ""}>
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <div className="admin-advanced-filters__row">
              <AdminField label="Submitted from">
                <AdminDateInput name="from" defaultValue={filters.from ?? ""} />
              </AdminField>
              <AdminField label="Submitted to">
                <AdminDateInput name="to" defaultValue={filters.to ?? ""} />
              </AdminField>
            </div>
          </fieldset>

          <fieldset className="admin-advanced-filters__group">
            <legend>Supporting information</legend>
            <AdminField label="Attachments">
              <AdminSelect
                name="hasAttachments"
                defaultValue={filters.hasAttachments ?? ""}
              >
                <option value="">Any</option>
                <option value="1">Has attachments</option>
                <option value="0">No attachments</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Drawings">
              <AdminSelect name="hasDrawings" defaultValue={filters.hasDrawings ?? ""}>
                <option value="">Any</option>
                <option value="1">Has drawings</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Calculator data">
              <AdminSelect
                name="hasCalculator"
                defaultValue={filters.hasCalculator ?? ""}
              >
                <option value="">Any</option>
                <option value="1">Has calculator / assets</option>
                <option value="0">No calculator</option>
              </AdminSelect>
            </AdminField>
          </fieldset>
        </form>
      </AdminFilterDrawer>
    </>
  );
}
