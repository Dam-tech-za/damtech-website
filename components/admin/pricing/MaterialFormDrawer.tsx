"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminDialog,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { upsertMaterialAction } from "@/app/admin/pricing/actions";

const MATERIAL_CATEGORIES = [
  "HDPE geomembrane",
  "PVC liner",
  "Dortom liner",
  "Geotextile",
  "Torch-on membrane",
  "Liquid waterproofing",
  "Cementitious waterproofing",
  "Accessories",
  "Welding consumables",
  "Miscellaneous",
];

type MaterialFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  canSeeCost: boolean;
};

export function MaterialFormDrawer({ open, onClose, canSeeCost }: MaterialFormDrawerProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    await upsertMaterialAction(formData);
    setPending(false);
    onClose();
  }

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Add material"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" form="material-form" variant="primary" disabled={pending}>
            {pending ? "Saving…" : "Save material"}
          </AdminButton>
        </>
      }
    >
      <form id="material-form" className="admin-stack" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <AdminField label="Item code" required>
            <AdminInput name="item_code" required />
          </AdminField>
          <AdminField label="Category" required>
            <AdminSelect name="category" required defaultValue="">
              <option value="" disabled>
                Select category
              </option>
              {MATERIAL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Name" required className="admin-field--full">
            <AdminInput name="name" required />
          </AdminField>
          <AdminField label="Quote description" className="admin-field--full">
            <AdminTextarea name="description" rows={2} />
          </AdminField>
          <AdminField label="Purchase unit">
            <AdminSelect name="purchase_unit" defaultValue="roll">
              <option value="roll">roll</option>
              <option value="pail">pail</option>
              <option value="bag">bag</option>
              <option value="m²">m²</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Quote unit">
            <AdminSelect name="unit" defaultValue="m²">
              <option value="m²">m²</option>
              <option value="roll">roll</option>
              <option value="each">each</option>
              <option value="kg">kg</option>
              <option value="litre">litre</option>
            </AdminSelect>
          </AdminField>
          {canSeeCost ? (
            <AdminField label="Default cost (per quote unit)">
              <AdminInput name="default_cost" type="number" step="0.01" />
            </AdminField>
          ) : null}
          <AdminField label="Default sell price">
            <AdminInput name="default_sell_price" type="number" step="0.01" />
          </AdminField>
          <AdminField label="Overlap %">
            <AdminInput name="overlap_percent" type="number" step="0.01" defaultValue="0" />
          </AdminField>
          <AdminField label="Waste %">
            <AdminInput name="waste_percent" type="number" step="0.01" defaultValue="10" />
          </AdminField>
        </div>
      </form>
    </AdminDialog>
  );
}
