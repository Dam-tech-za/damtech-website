"use client";

import { useMemo, useState, useTransition } from "react";
import { CustomerSelector } from "@/components/admin/customers/CustomerSelector";
import type { CustomerRecord } from "@/components/admin/customers/CustomerSummaryCard";
import { PricingLibraryDialog } from "@/components/admin/pricing/PricingLibraryDialog";
import { SelectedPricingSource } from "@/components/admin/pricing/SelectedPricingSource";
import {
  AdminButton,
  AdminCheckbox,
  AdminDateInput,
  AdminField,
  AdminFormActions,
  AdminIconButton,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import {
  lineMarginPercent,
  lineMarkupPercent,
  lineTotalExVat,
  recalculateQuoteTotals,
} from "@/lib/quotes/totals";
import type { QuoteLineType } from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";

export type EditableLine = {
  id?: string;
  sortOrder: number;
  lineType: QuoteLineType;
  itemCode: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  costUnitPrice: number | null;
  sellUnitPrice: number;
  discountPercent: number;
  taxCategory: "standard" | "exempt" | "zero";
  sourceMaterialItemId?: string | null;
  sourceLabourItemId?: string | null;
  sourceSupplierPriceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

type QuoteBuilderProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>;
  customers: CustomerRecord[];
  canCreateCustomer: boolean;
  showCost: boolean;
  defaults: {
    title: string;
    customerId: string;
    rfqId: string;
    projectReference: string;
    projectLocation: string;
    serviceRequired: string;
    scopeSummary: string;
    projectDescription: string;
    assumptions: string;
    exclusions: string;
    paymentTerms: string;
    programmeNotes: string;
    warrantyWording: string;
    customerMessage: string;
    internalNotes: string;
    issueDate: string;
    validUntil: string;
    discountAmount: number;
    vatRate: number;
    depositPercent: number;
    contactName: string;
    companyName: string;
    email: string;
    phone: string;
    province: string;
    lines: EditableLine[];
    estimatorConfirmedSuggestions: boolean;
  };
};

function emptyLine(sortOrder: number, lineType: QuoteLineType = "custom"): EditableLine {
  return {
    sortOrder,
    lineType,
    itemCode: "",
    category: "",
    description: lineType === "heading" ? "Section heading" : "",
    quantity: lineType === "heading" || lineType === "note" ? 0 : 1,
    unit: "ea",
    costUnitPrice: null,
    sellUnitPrice: 0,
    discountPercent: 0,
    taxCategory: "standard",
    sourceMaterialItemId: null,
    sourceLabourItemId: null,
    sourceSupplierPriceId: null,
    metadata: null,
  };
}

export function QuoteBuilder({
  mode,
  action,
  customers,
  canCreateCustomer,
  showCost,
  defaults,
}: QuoteBuilderProps) {
  const [lines, setLines] = useState<EditableLine[]>(
    defaults.lines.length ? defaults.lines : [emptyLine(0)],
  );
  const [customerOptions, setCustomerOptions] = useState<CustomerRecord[]>(customers);
  const [discountAmount, setDiscountAmount] = useState(defaults.discountAmount);
  const [vatRate, setVatRate] = useState(defaults.vatRate);
  const [customerId, setCustomerId] = useState(defaults.customerId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pricingLibraryOpen, setPricingLibraryOpen] = useState(false);

  const totals = useMemo(
    () =>
      recalculateQuoteTotals(lines, {
        discountAmount,
        vatRatePercent: vatRate,
      }),
    [lines, discountAmount, vatRate],
  );

  const submitLabel = pending
    ? "Saving…"
    : mode === "create"
      ? "Create draft"
      : "Save quote";

  function updateLine(index: number, patch: Partial<EditableLine>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function moveLine(index: number, direction: -1 | 1) {
    setLines((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next.map((line, i) => ({ ...line, sortOrder: i }));
    });
  }

  function applyCustomerToForm(customer: CustomerRecord) {
    const company = document.querySelector<HTMLInputElement>('[name="companyName"]');
    const contact = document.querySelector<HTMLInputElement>('[name="contactName"]');
    const email = document.querySelector<HTMLInputElement>('[name="email"]');
    const phone = document.querySelector<HTMLInputElement>('[name="phone"]');
    const province = document.querySelector<HTMLInputElement>('[name="province"]');
    if (company) company.value = customer.company_name || customer.name || "";
    if (contact) contact.value = customer.name || "";
    if (email) email.value = customer.email || "";
    if (phone) phone.value = customer.phone || "";
    if (province) province.value = customer.province || "";
  }

  function onCustomerSelect(customer: CustomerRecord | null) {
    setCustomerId(customer?.id ?? "");
    if (!customer) return;
    setCustomerOptions((prev) =>
      prev.some((item) => item.id === customer.id) ? prev : [customer, ...prev],
    );
    applyCustomerToForm(customer);
  }

  function appendLine(line: EditableLine) {
    setLines((prev) => [...prev, { ...line, sortOrder: prev.length }]);
  }

  return (
    <form
      className="admin-quote-builder"
      action={(formData) => {
        formData.set("linesJson", JSON.stringify(lines));
        formData.set("discountAmount", String(discountAmount));
        formData.set("vatRate", String(vatRate));
        formData.set("customerId", customerId);
        startTransition(async () => {
          setError(null);
          const result = await action(formData);
          if (result && !result.ok) setError(result.error);
        });
      }}
    >
      {error ? (
        <p className="admin-flash admin-flash--error admin-quote-builder__flash">{error}</p>
      ) : null}

      <div className="admin-quote-builder__main">
        <AdminPanel title="Customer">
          <CustomerSelector
            customers={customerOptions}
            value={customerId}
            onSelectCustomer={onCustomerSelect}
            canCreateCustomer={canCreateCustomer}
          />
          <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
            <AdminField label="Company">
              <AdminInput name="companyName" defaultValue={defaults.companyName} />
            </AdminField>
            <AdminField label="Contact">
              <AdminInput name="contactName" defaultValue={defaults.contactName} />
            </AdminField>
            <AdminField label="Email">
              <AdminInput name="email" type="email" defaultValue={defaults.email} />
            </AdminField>
            <AdminField label="Phone">
              <AdminInput name="phone" defaultValue={defaults.phone} />
            </AdminField>
            <AdminField label="Province / VAT context">
              <AdminInput name="province" defaultValue={defaults.province} />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel title="Project">
          <div className="admin-form-grid">
            <AdminField label="Quote title" required className="admin-field--full">
              <AdminInput name="title" required defaultValue={defaults.title} />
            </AdminField>
            <AdminField label="RFQ id (optional)">
              <AdminInput name="rfqId" defaultValue={defaults.rfqId} />
            </AdminField>
            <AdminField label="Project reference">
              <AdminInput name="projectReference" defaultValue={defaults.projectReference} />
            </AdminField>
            <AdminField label="Project location">
              <AdminInput name="projectLocation" defaultValue={defaults.projectLocation} />
            </AdminField>
            <AdminField label="Service">
              <AdminInput name="serviceRequired" defaultValue={defaults.serviceRequired} />
            </AdminField>
            <AdminField label="Scope summary" className="admin-field--full">
              <AdminTextarea name="scopeSummary" rows={3} defaultValue={defaults.scopeSummary} />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Line items"
          actions={
            <>
              <AdminButton
                size="sm"
                variant="secondary"
                onClick={() => setPricingLibraryOpen(true)}
              >
                Add from pricing library
              </AdminButton>
              <AdminButton
                size="sm"
                variant="secondary"
                onClick={() => setLines((prev) => [...prev, emptyLine(prev.length, "custom")])}
              >
                Add custom line
              </AdminButton>
              <AdminButton
                size="sm"
                variant="secondary"
                onClick={() => setLines((prev) => [...prev, emptyLine(prev.length, "heading")])}
              >
                Add heading
              </AdminButton>
              <AdminButton
                size="sm"
                variant="secondary"
                onClick={() => setLines((prev) => [...prev, emptyLine(prev.length, "note")])}
              >
                Add note
              </AdminButton>
            </>
          }
        >
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  {showCost ? <th>Cost</th> : null}
                  <th>Sell</th>
                  {showCost ? <th>Mk%</th> : null}
                  {showCost ? <th>Mg%</th> : null}
                  <th>Disc%</th>
                  <th>VAT</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={`${line.id ?? "new"}-${index}`}>
                    <td>
                      <AdminSelect
                        value={line.lineType}
                        onChange={(e) =>
                          updateLine(index, {
                            lineType: e.target.value as QuoteLineType,
                          })
                        }
                      >
                        <option value="material">material</option>
                        <option value="labour">labour</option>
                        <option value="travel">travel</option>
                        <option value="delivery">delivery</option>
                        <option value="subcontractor">subcontractor</option>
                        <option value="custom">custom</option>
                        <option value="item">item</option>
                        <option value="heading">heading</option>
                        <option value="note">note</option>
                      </AdminSelect>
                    </td>
                    <td>
                      <AdminInput
                        value={line.itemCode}
                        onChange={(e) => updateLine(index, { itemCode: e.target.value })}
                      />
                    </td>
                    <td>
                      <AdminInput
                        value={line.description}
                        onChange={(e) =>
                          updateLine(index, { description: e.target.value })
                        }
                        required={line.lineType !== "heading"}
                      />
                      <SelectedPricingSource metadata={line.metadata} compact />
                    </td>
                    <td>
                      <AdminInput
                        type="number"
                        step="0.0001"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(index, { quantity: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <AdminInput
                        value={line.unit}
                        onChange={(e) => updateLine(index, { unit: e.target.value })}
                      />
                    </td>
                    {showCost ? (
                      <td>
                        <AdminInput
                          type="number"
                          step="0.01"
                          value={line.costUnitPrice ?? ""}
                          onChange={(e) =>
                            updateLine(index, {
                              costUnitPrice:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </td>
                    ) : null}
                    <td>
                      <AdminInput
                        type="number"
                        step="0.01"
                        value={line.sellUnitPrice}
                        onChange={(e) =>
                          updateLine(index, {
                            sellUnitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    {showCost ? (
                      <td>{lineMarkupPercent(line).toFixed(1)}</td>
                    ) : null}
                    {showCost ? (
                      <td>{lineMarginPercent(line).toFixed(1)}</td>
                    ) : null}
                    <td>
                      <AdminInput
                        type="number"
                        step="0.1"
                        value={line.discountPercent}
                        onChange={(e) =>
                          updateLine(index, {
                            discountPercent: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <AdminSelect
                        value={line.taxCategory}
                        onChange={(e) =>
                          updateLine(index, {
                            taxCategory: e.target.value as EditableLine["taxCategory"],
                          })
                        }
                      >
                        <option value="standard">standard</option>
                        <option value="exempt">exempt</option>
                        <option value="zero">zero</option>
                      </AdminSelect>
                    </td>
                    <td>{formatZar(lineTotalExVat(line))}</td>
                    <td>
                      <div className="admin-table-actions">
                        <AdminIconButton label="Move up" onClick={() => moveLine(index, -1)}>
                          ↑
                        </AdminIconButton>
                        <AdminIconButton label="Move down" onClick={() => moveLine(index, 1)}>
                          ↓
                        </AdminIconButton>
                        <AdminButton
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setLines((prev) => [
                              ...prev.slice(0, index + 1),
                              { ...line, id: undefined, sortOrder: index + 1 },
                              ...prev.slice(index + 1),
                            ])
                          }
                        >
                          Dup
                        </AdminButton>
                        <AdminIconButton
                          label="Remove line"
                          onClick={() =>
                            setLines((prev) =>
                              prev
                                .filter((_, i) => i !== index)
                                .map((l, i) => ({ ...l, sortOrder: i })),
                            )
                          }
                        >
                          ×
                        </AdminIconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminCheckbox
            name="estimatorConfirmedSuggestions"
            defaultChecked={defaults.estimatorConfirmedSuggestions}
            label="Estimator confirms suggested quantities (calculator output is not final measured quantity)"
            style={{ marginTop: "1rem" }}
          />
        </AdminPanel>

        <AdminPanel title="Dates & terms">
          <div className="admin-form-grid">
            <AdminField label="Issue date" required>
              <AdminDateInput name="issueDate" required defaultValue={defaults.issueDate} />
            </AdminField>
            <AdminField label="Valid until" required>
              <AdminDateInput name="validUntil" required defaultValue={defaults.validUntil} />
            </AdminField>
            <AdminField label="Deposit %">
              <AdminInput
                type="number"
                step="0.1"
                name="depositPercent"
                defaultValue={defaults.depositPercent}
              />
            </AdminField>
            <AdminField label="Assumptions" className="admin-field--full">
              <AdminTextarea name="assumptions" rows={3} defaultValue={defaults.assumptions} />
            </AdminField>
            <AdminField label="Exclusions" className="admin-field--full">
              <AdminTextarea name="exclusions" rows={3} defaultValue={defaults.exclusions} />
            </AdminField>
            <AdminField label="Payment terms" className="admin-field--full">
              <AdminTextarea name="paymentTerms" rows={2} defaultValue={defaults.paymentTerms} />
            </AdminField>
            <AdminField label="Customer message (email)" className="admin-field--full">
              <AdminTextarea
                name="customerMessage"
                rows={2}
                defaultValue={defaults.customerMessage}
              />
            </AdminField>
            <AdminField label="Internal notes" className="admin-field--full">
              <AdminTextarea name="internalNotes" rows={2} defaultValue={defaults.internalNotes} />
            </AdminField>
            <input type="hidden" name="programmeNotes" defaultValue={defaults.programmeNotes} />
            <input type="hidden" name="warrantyWording" defaultValue={defaults.warrantyWording} />
            <input
              type="hidden"
              name="projectDescription"
              defaultValue={defaults.projectDescription}
            />
          </div>
        </AdminPanel>
      </div>

      <aside className="admin-quote-builder__aside">
        <AdminPanel title="Totals" className="admin-quote-builder__totals-panel">
          <div className="admin-form-grid" style={{ marginTop: 0 }}>
            <AdminField label="Header discount (ZAR)">
              <AdminInput
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
            </AdminField>
            <AdminField label="VAT rate %">
              <AdminInput
                type="number"
                step="0.01"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
              />
            </AdminField>
          </div>

          <dl className="admin-quote-totals">
            {showCost ? (
              <>
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
              </>
            ) : null}
            <div>
              <dt>Subtotal ex VAT</dt>
              <dd>{formatZar(totals.subtotalExVat)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>{formatZar(totals.discountAmount)}</dd>
            </div>
            <div>
              <dt>VAT</dt>
              <dd>{formatZar(totals.vatAmount)}</dd>
            </div>
            <div>
              <dt>Total inc VAT</dt>
              <dd>{formatZar(totals.totalIncVat)}</dd>
            </div>
          </dl>

          <AdminFormActions className="admin-quote-builder__aside-actions">
            <AdminButton type="submit" variant="primary" disabled={pending}>
              {submitLabel}
            </AdminButton>
          </AdminFormActions>
        </AdminPanel>
      </aside>

      <AdminFormActions sticky className="admin-quote-builder__mobile-actions">
        {mode === "create" ? (
          <AdminButton variant="secondary" disabled>
            Preview
          </AdminButton>
        ) : (
          <AdminButton href="#" variant="secondary">
            Preview
          </AdminButton>
        )}
        <AdminButton type="submit" variant="primary" disabled={pending}>
          {submitLabel}
        </AdminButton>
      </AdminFormActions>

      <PricingLibraryDialog
        open={pricingLibraryOpen}
        onClose={() => setPricingLibraryOpen(false)}
        onAddLine={appendLine}
        showCost={showCost}
      />
    </form>
  );
}
