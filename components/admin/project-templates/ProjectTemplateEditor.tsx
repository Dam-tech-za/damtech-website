"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  AdminButton,
  AdminCheckbox,
  AdminErrorState,
  AdminField,
  AdminInput,
  AdminInfoBanner,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { PricingItemCombobox } from "@/components/admin/pricing/PricingItemCombobox";
import { saveProjectTemplateAction } from "@/app/admin/pricing/project-templates/actions";
import {
  clausesToText,
  parseClauses,
  type Clause,
} from "@/lib/project-templates/clauses";
import {
  PROJECT_TEMPLATE_CATEGORY_GROUPS,
  PROJECT_TEMPLATE_FIELD_TYPES,
  PROJECT_TEMPLATE_LINE_ROLES,
  PROJECT_TEMPLATE_QUANTITY_SOURCES,
  type ProjectTemplateWithRelations,
} from "@/lib/project-templates/types";
import type { PricingItemRecord } from "@/lib/pricing/types";
import { ClauseEditor } from "./ClauseEditor";

type Props = {
  template?: ProjectTemplateWithRelations;
  showCost: boolean;
};

let localSeq = 0;
function localKey(prefix: string): string {
  localSeq += 1;
  return `${prefix}-${localSeq}`;
}

type ItemState = {
  key: string;
  pricingItemId: string | null;
  requestedItemCode: string | null;
  resolvedLabel: string | null;
  lineRole: string;
  defaultQuantitySource: string;
  defaultQuantity: string;
  defaultUnit: string;
  isOptional: boolean;
  isSelectedByDefault: boolean;
  notes: string;
};

type FieldState = {
  key: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  isRecommended: boolean;
  optionsText: string;
  unit: string;
  helpText: string;
  quantityTarget: string;
};

export function ProjectTemplateEditor({ template, showCost }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(template?.code ?? "");
  const [name, setName] = useState(template?.name ?? "");
  const [shortDescription, setShortDescription] = useState(
    template?.shortDescription ?? "",
  );
  const [projectCategory, setProjectCategory] = useState(
    template?.projectCategory ?? "",
  );
  const [defaultMaterialType, setDefaultMaterialType] = useState(
    template?.defaultMaterialType ?? "",
  );
  const [defaultServiceType, setDefaultServiceType] = useState(
    template?.defaultServiceType ?? "",
  );
  const [defaultQuoteTitle, setDefaultQuoteTitle] = useState(
    template?.defaultQuoteTitle ?? "",
  );
  const [defaultProjectDescription, setDefaultProjectDescription] = useState(
    template?.defaultProjectDescription ?? "",
  );
  const [customerMessage, setCustomerMessage] = useState(
    template?.defaultCustomerMessage ?? "",
  );
  const [internalNotes, setInternalNotes] = useState(
    template?.defaultInternalNotes ?? "",
  );
  const [warrantyText, setWarrantyText] = useState(
    template?.defaultWarrantyText ?? "",
  );
  const [validityDays, setValidityDays] = useState(
    template?.defaultValidityDays != null
      ? String(template.defaultValidityDays)
      : "30",
  );
  const [leadTimeText, setLeadTimeText] = useState(
    template?.defaultLeadTimeText ?? "",
  );
  const [durationText, setDurationText] = useState(
    template?.defaultDurationText ?? "",
  );
  const [technicalGuidance, setTechnicalGuidance] = useState(
    template?.technicalGuidance ?? "",
  );
  const [requiredInformation, setRequiredInformation] = useState(
    template?.requiredInformation ?? "",
  );
  const [recommendedInformation, setRecommendedInformation] = useState(
    template?.recommendedInformation ?? "",
  );
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(
    template?.sortOrder != null ? String(template.sortOrder) : "0",
  );
  const [changeSummary, setChangeSummary] = useState("");

  const [scopeClauses, setScopeClauses] = useState<Clause[]>(() =>
    parseClauses(template?.defaultScope),
  );
  const [assumptionClauses, setAssumptionClauses] = useState<Clause[]>(() =>
    parseClauses(template?.defaultAssumptions),
  );
  const [exclusionClauses, setExclusionClauses] = useState<Clause[]>(() =>
    parseClauses(template?.defaultExclusions),
  );

  const [items, setItems] = useState<ItemState[]>(() =>
    (template?.items ?? []).map((i) => ({
      key: localKey("item"),
      pricingItemId: i.pricingItemId,
      requestedItemCode: i.requestedItemCode,
      resolvedLabel: i.resolvedName
        ? `${i.resolvedItemCode} · ${i.resolvedName}`
        : i.requestedItemCode
          ? `${i.requestedItemCode} (unresolved)`
          : null,
      lineRole: i.lineRole,
      defaultQuantitySource: i.defaultQuantitySource,
      defaultQuantity: i.defaultQuantity != null ? String(i.defaultQuantity) : "",
      defaultUnit: i.defaultUnit ?? i.resolvedUnit ?? "",
      isOptional: i.isOptional,
      isSelectedByDefault: i.isSelectedByDefault,
      notes: i.notes ?? "",
    })),
  );

  const [fields, setFields] = useState<FieldState[]>(() =>
    (template?.fields ?? []).map((f) => ({
      key: localKey("field"),
      fieldKey: f.fieldKey,
      label: f.label,
      fieldType: f.fieldType,
      isRequired: f.isRequired,
      isRecommended: f.isRecommended,
      optionsText: f.options.join(", "),
      unit: f.unit ?? "",
      helpText: f.helpText ?? "",
      quantityTarget: f.quantityTarget ?? "",
    })),
  );

  const unresolvedCount = useMemo(
    () => items.filter((i) => !i.pricingItemId && i.requestedItemCode).length,
    [items],
  );

  function updateItem(key: string, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function moveItem(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [it] = next.splice(index, 1);
      next.splice(target, 0, it);
      return next;
    });
  }
  function assignPricingItem(key: string, item: PricingItemRecord) {
    updateItem(key, {
      pricingItemId: item.id,
      requestedItemCode: item.itemCode,
      resolvedLabel: `${item.itemCode} · ${item.quoteDescription || item.name}`,
      defaultUnit: item.quoteUnit,
    });
  }

  function updateField(key: string, patch: Partial<FieldState>) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  function handleSave() {
    setError(null);
    const payload = {
      id: template?.id,
      code: code.trim(),
      name: name.trim(),
      shortDescription: shortDescription.trim() || null,
      projectCategory: projectCategory.trim() || null,
      defaultMaterialType: defaultMaterialType.trim() || null,
      defaultServiceType: defaultServiceType.trim() || null,
      defaultQuoteTitle: defaultQuoteTitle.trim() || null,
      defaultProjectDescription: defaultProjectDescription.trim() || null,
      defaultScope: clausesToText(scopeClauses) || null,
      defaultAssumptions: clausesToText(assumptionClauses) || null,
      defaultExclusions: clausesToText(exclusionClauses) || null,
      defaultCustomerMessage: customerMessage.trim() || null,
      defaultInternalNotes: internalNotes.trim() || null,
      defaultWarrantyText: warrantyText.trim() || null,
      defaultValidityDays: validityDays.trim() ? Number(validityDays) : null,
      defaultLeadTimeText: leadTimeText.trim() || null,
      defaultDurationText: durationText.trim() || null,
      technicalGuidance: technicalGuidance.trim() || null,
      requiredInformation: requiredInformation.trim() || null,
      recommendedInformation: recommendedInformation.trim() || null,
      isActive,
      sortOrder: Number(sortOrder) || 0,
      changeSummary: changeSummary.trim() || null,
      items: items.map((i, index) => ({
        pricingItemId: i.pricingItemId,
        requestedItemCode: i.requestedItemCode,
        lineRole: i.lineRole,
        defaultQuantitySource: i.defaultQuantitySource,
        defaultQuantity: i.defaultQuantity.trim() ? Number(i.defaultQuantity) : null,
        defaultUnit: i.defaultUnit.trim() || null,
        descriptionOverride: null,
        isOptional: i.isOptional,
        isSelectedByDefault: i.isSelectedByDefault,
        sortOrder: index,
        notes: i.notes.trim() || null,
      })),
      sections: [],
      fields: fields
        .filter((f) => f.fieldKey.trim() && f.label.trim())
        .map((f, index) => ({
          fieldKey: f.fieldKey.trim(),
          label: f.label.trim(),
          fieldType: f.fieldType,
          isRequired: f.isRequired,
          isRecommended: f.isRecommended,
          options: f.optionsText
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
          unit: f.unit.trim() || null,
          helpText: f.helpText.trim() || null,
          quantityTarget: f.quantityTarget.trim() || null,
          sortOrder: index,
        })),
    };

    if (!payload.code || !payload.name) {
      setError("Code and name are required.");
      return;
    }

    startTransition(async () => {
      const result = await saveProjectTemplateAction(payload);
      if (result.ok) {
        router.push(`/admin/pricing/project-templates/${result.id}/`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="admin-stack--page pt-editor">
      {error ? (
        <AdminErrorState title="Could not save template" message={error} />
      ) : null}

      <AdminPanel title="Basic information">
        <div className="admin-form-grid">
          <AdminField label="Code" required>
            <AdminInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PT-HDPE-NEW"
            />
          </AdminField>
          <AdminField label="Template name" required>
            <AdminInput value={name} onChange={(e) => setName(e.target.value)} />
          </AdminField>
          <AdminField label="Project category">
            <AdminSelect
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)}
            >
              <option value="">Select category…</option>
              {PROJECT_TEMPLATE_CATEGORY_GROUPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {projectCategory &&
              !PROJECT_TEMPLATE_CATEGORY_GROUPS.includes(
                projectCategory as (typeof PROJECT_TEMPLATE_CATEGORY_GROUPS)[number],
              ) ? (
                <option value={projectCategory}>{projectCategory}</option>
              ) : null}
            </AdminSelect>
          </AdminField>
          <AdminField label="Default material type">
            <AdminInput
              value={defaultMaterialType}
              onChange={(e) => setDefaultMaterialType(e.target.value)}
            />
          </AdminField>
          <AdminField label="Default service type">
            <AdminInput
              value={defaultServiceType}
              onChange={(e) => setDefaultServiceType(e.target.value)}
            />
          </AdminField>
          <AdminField label="Sort order">
            <AdminInput
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </AdminField>
        </div>
        <AdminField label="Short description">
          <AdminTextarea
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </AdminField>
        <AdminCheckbox
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          label="Active (available for quotes)"
        />
      </AdminPanel>

      <AdminPanel title="Default project description">
        <AdminField label="Quote title">
          <AdminInput
            value={defaultQuoteTitle}
            onChange={(e) => setDefaultQuoteTitle(e.target.value)}
          />
        </AdminField>
        <AdminField label="Project description">
          <AdminTextarea
            rows={4}
            value={defaultProjectDescription}
            onChange={(e) => setDefaultProjectDescription(e.target.value)}
          />
        </AdminField>
      </AdminPanel>

      <AdminPanel
        title="Suggested quote items"
        description={
          unresolvedCount
            ? `${unresolvedCount} item code(s) are not yet linked to the catalogue.`
            : undefined
        }
      >
        <ul className="pt-item-list">
          {items.map((item, index) => (
            <li key={item.key} className="pt-item-row">
              <div className="pt-item-row__picker">
                {item.resolvedLabel ? (
                  <div className="pt-item-row__resolved">
                    <span
                      className={
                        item.pricingItemId
                          ? "pt-item-row__label"
                          : "pt-item-row__label pt-item-row__label--unresolved"
                      }
                    >
                      {item.resolvedLabel}
                    </span>
                    <AdminButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateItem(item.key, {
                          pricingItemId: null,
                          resolvedLabel: null,
                        })
                      }
                    >
                      Change
                    </AdminButton>
                  </div>
                ) : (
                  <PricingItemCombobox
                    showCost={showCost}
                    ariaLabel={`Search catalogue for item ${index + 1}`}
                    onSelect={(picked) => assignPricingItem(item.key, picked)}
                    onCustomText={(text) =>
                      updateItem(item.key, {
                        requestedItemCode: text,
                        resolvedLabel: `${text} (unresolved)`,
                      })
                    }
                  />
                )}
              </div>
              <div className="pt-item-row__controls">
                <AdminSelect
                  aria-label="Line role"
                  value={item.lineRole}
                  onChange={(e) => updateItem(item.key, { lineRole: e.target.value })}
                >
                  {PROJECT_TEMPLATE_LINE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  aria-label="Quantity source"
                  value={item.defaultQuantitySource}
                  onChange={(e) =>
                    updateItem(item.key, { defaultQuantitySource: e.target.value })
                  }
                >
                  {PROJECT_TEMPLATE_QUANTITY_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  type="number"
                  aria-label="Default quantity"
                  placeholder="Qty"
                  value={item.defaultQuantity}
                  onChange={(e) =>
                    updateItem(item.key, { defaultQuantity: e.target.value })
                  }
                />
                <AdminInput
                  aria-label="Unit"
                  placeholder="Unit"
                  value={item.defaultUnit}
                  onChange={(e) => updateItem(item.key, { defaultUnit: e.target.value })}
                />
              </div>
              <div className="pt-item-row__flags">
                <AdminCheckbox
                  checked={item.isOptional}
                  onChange={(e) => updateItem(item.key, { isOptional: e.target.checked })}
                  label="Optional"
                />
                <AdminCheckbox
                  checked={item.isSelectedByDefault}
                  onChange={(e) =>
                    updateItem(item.key, { isSelectedByDefault: e.target.checked })
                  }
                  label="Default"
                />
                <AdminButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => moveItem(index, -1)}
                  aria-label="Move up"
                >
                  ↑
                </AdminButton>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => moveItem(index, 1)}
                  aria-label="Move down"
                >
                  ↓
                </AdminButton>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setItems((prev) => prev.filter((x) => x.key !== item.key))
                  }
                  aria-label="Remove item"
                >
                  ✕
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
        <AdminButton
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              {
                key: localKey("item"),
                pricingItemId: null,
                requestedItemCode: null,
                resolvedLabel: null,
                lineRole: "other",
                defaultQuantitySource: "manual",
                defaultQuantity: "",
                defaultUnit: "",
                isOptional: false,
                isSelectedByDefault: true,
                notes: "",
              },
            ])
          }
        >
          + Add suggested item
        </AdminButton>
      </AdminPanel>

      <AdminPanel title="Scope">
        <ClauseEditor label="Scope" clauses={scopeClauses} onChange={setScopeClauses} />
      </AdminPanel>
      <AdminPanel title="Assumptions">
        <ClauseEditor
          label="Assumptions"
          clauses={assumptionClauses}
          onChange={setAssumptionClauses}
        />
      </AdminPanel>
      <AdminPanel title="Exclusions">
        <ClauseEditor
          label="Exclusions"
          clauses={exclusionClauses}
          onChange={setExclusionClauses}
        />
      </AdminPanel>

      <AdminPanel title="Customer message">
        <AdminTextarea
          rows={4}
          value={customerMessage}
          onChange={(e) => setCustomerMessage(e.target.value)}
        />
      </AdminPanel>

      <AdminPanel title="Internal notes">
        <AdminInfoBanner tone="warning">
          <strong>Internal — not shown to customers.</strong> These notes never
          appear on customer PDFs or public quote links.
        </AdminInfoBanner>
        <AdminTextarea
          rows={4}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
      </AdminPanel>

      <AdminPanel title="Warranty and terms">
        <AdminField label="Warranty text">
          <AdminTextarea
            rows={3}
            value={warrantyText}
            onChange={(e) => setWarrantyText(e.target.value)}
          />
        </AdminField>
        <div className="admin-form-grid">
          <AdminField label="Default validity (days)">
            <AdminInput
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
            />
          </AdminField>
          <AdminField label="Lead time">
            <AdminInput
              value={leadTimeText}
              onChange={(e) => setLeadTimeText(e.target.value)}
            />
          </AdminField>
          <AdminField label="Duration">
            <AdminInput
              value={durationText}
              onChange={(e) => setDurationText(e.target.value)}
            />
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Required project information"
        description="Fields shown when this template is selected on a quote."
      >
        <ul className="pt-field-list">
          {fields.map((field) => (
            <li key={field.key} className="pt-field-row">
              <AdminInput
                aria-label="Field key"
                placeholder="field_key"
                value={field.fieldKey}
                onChange={(e) => updateField(field.key, { fieldKey: e.target.value })}
              />
              <AdminInput
                aria-label="Field label"
                placeholder="Label"
                value={field.label}
                onChange={(e) => updateField(field.key, { label: e.target.value })}
              />
              <AdminSelect
                aria-label="Field type"
                value={field.fieldType}
                onChange={(e) => updateField(field.key, { fieldType: e.target.value })}
              >
                {PROJECT_TEMPLATE_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </AdminSelect>
              <AdminInput
                aria-label="Unit"
                placeholder="Unit"
                value={field.unit}
                onChange={(e) => updateField(field.key, { unit: e.target.value })}
              />
              <AdminCheckbox
                checked={field.isRequired}
                onChange={(e) => updateField(field.key, { isRequired: e.target.checked })}
                label="Required"
              />
              <AdminCheckbox
                checked={field.isRecommended}
                onChange={(e) =>
                  updateField(field.key, { isRecommended: e.target.checked })
                }
                label="Recommended"
              />
              <AdminButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setFields((prev) => prev.filter((x) => x.key !== field.key))}
                aria-label="Remove field"
              >
                ✕
              </AdminButton>
            </li>
          ))}
        </ul>
        <AdminButton
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            setFields((prev) => [
              ...prev,
              {
                key: localKey("field"),
                fieldKey: "",
                label: "",
                fieldType: "text",
                isRequired: false,
                isRecommended: false,
                optionsText: "",
                unit: "",
                helpText: "",
                quantityTarget: "",
              },
            ])
          }
        >
          + Add field
        </AdminButton>
      </AdminPanel>

      <AdminPanel title="Advanced settings">
        <AdminField label="Technical guidance">
          <AdminTextarea
            rows={3}
            value={technicalGuidance}
            onChange={(e) => setTechnicalGuidance(e.target.value)}
          />
        </AdminField>
        <AdminField label="Required information (notes)">
          <AdminTextarea
            rows={3}
            value={requiredInformation}
            onChange={(e) => setRequiredInformation(e.target.value)}
          />
        </AdminField>
        <AdminField label="Recommended information (notes)">
          <AdminTextarea
            rows={3}
            value={recommendedInformation}
            onChange={(e) => setRecommendedInformation(e.target.value)}
          />
        </AdminField>
        <AdminField label="Change summary (for version history)">
          <AdminInput
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Describe what changed"
          />
        </AdminField>
      </AdminPanel>

      <div className="admin-form-actions admin-form-actions--sticky">
        <AdminButton
          href="/admin/pricing/project-templates/"
          variant="secondary"
          type="button"
        >
          Cancel
        </AdminButton>
        <AdminButton
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={pending}
        >
          {pending ? "Saving…" : template ? "Save changes" : "Create template"}
        </AdminButton>
      </div>
    </div>
  );
}
