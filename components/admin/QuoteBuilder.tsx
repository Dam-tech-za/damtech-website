"use client";

import { useMemo, useState, useTransition } from "react";
import { CustomerSelector } from "@/components/admin/customers/CustomerSelector";
import type { CustomerRecord } from "@/components/admin/customers/CustomerSummaryCard";
import { PricingLibraryDialog } from "@/components/admin/pricing/PricingLibraryDialog";
import { SelectedPricingSource } from "@/components/admin/pricing/SelectedPricingSource";
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
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Customer</h2>
        </header>
        <CustomerSelector
          customers={customerOptions}
          value={customerId}
          onSelectCustomer={onCustomerSelect}
          canCreateCustomer={canCreateCustomer}
        />
        <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
          <label className="admin-field">
            <span>Company</span>
            <input className="form-input" name="companyName" defaultValue={defaults.companyName} />
          </label>
          <label className="admin-field">
            <span>Contact</span>
            <input className="form-input" name="contactName" defaultValue={defaults.contactName} />
          </label>
          <label className="admin-field">
            <span>Email</span>
            <input className="form-input" name="email" type="email" defaultValue={defaults.email} />
          </label>
          <label className="admin-field">
            <span>Phone</span>
            <input className="form-input" name="phone" defaultValue={defaults.phone} />
          </label>
          <label className="admin-field">
            <span>Province / VAT context</span>
            <input className="form-input" name="province" defaultValue={defaults.province} />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Project</h2>
        </header>
        <div className="admin-form-grid">
          <label className="admin-field admin-field--full">
            <span>Quote title</span>
            <input className="form-input" name="title" required defaultValue={defaults.title} />
          </label>
          <label className="admin-field">
            <span>RFQ id (optional)</span>
            <input className="form-input" name="rfqId" defaultValue={defaults.rfqId} />
          </label>
          <label className="admin-field">
            <span>Project reference</span>
            <input
              className="form-input"
              name="projectReference"
              defaultValue={defaults.projectReference}
            />
          </label>
          <label className="admin-field">
            <span>Project location</span>
            <input
              className="form-input"
              name="projectLocation"
              defaultValue={defaults.projectLocation}
            />
          </label>
          <label className="admin-field">
            <span>Service</span>
            <input
              className="form-input"
              name="serviceRequired"
              defaultValue={defaults.serviceRequired}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Scope summary</span>
            <textarea
              className="form-input"
              name="scopeSummary"
              rows={3}
              defaultValue={defaults.scopeSummary}
            />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <h2>Line items</h2>
          <div className="admin-panel__actions">
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => setPricingLibraryOpen(true)}
            >
              Add from pricing library
            </button>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => setLines((prev) => [...prev, emptyLine(prev.length, "custom")])}
            >
              Add custom line
            </button>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => setLines((prev) => [...prev, emptyLine(prev.length, "heading")])}
            >
              Add heading
            </button>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => setLines((prev) => [...prev, emptyLine(prev.length, "note")])}
            >
              Add note
            </button>
          </div>
        </header>

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
                    <select
                      className="form-input"
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
                    </select>
                  </td>
                  <td>
                    <input
                      className="form-input"
                      value={line.itemCode}
                      onChange={(e) => updateLine(index, { itemCode: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="form-input"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, { description: e.target.value })
                      }
                      required={line.lineType !== "heading"}
                    />
                    <SelectedPricingSource metadata={line.metadata} compact />
                  </td>
                  <td>
                    <input
                      className="form-input"
                      type="number"
                      step="0.0001"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, { quantity: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="form-input"
                      value={line.unit}
                      onChange={(e) => updateLine(index, { unit: e.target.value })}
                    />
                  </td>
                  {showCost ? (
                    <td>
                      <input
                        className="form-input"
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
                    <input
                      className="form-input"
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
                    <input
                      className="form-input"
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
                    <select
                      className="form-input"
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
                    </select>
                  </td>
                  <td>{formatZar(lineTotalExVat(line))}</td>
                  <td>
                    <div className="admin-panel__actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() => moveLine(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() => moveLine(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() =>
                          setLines((prev) => [
                            ...prev.slice(0, index + 1),
                            { ...line, id: undefined, sortOrder: index + 1 },
                            ...prev.slice(index + 1),
                          ])
                        }
                      >
                        Dup
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() =>
                          setLines((prev) =>
                            prev
                              .filter((_, i) => i !== index)
                              .map((l, i) => ({ ...l, sortOrder: i })),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="admin-field" style={{ marginTop: "1rem" }}>
          <span>
            <input
              type="checkbox"
              name="estimatorConfirmedSuggestions"
              defaultChecked={defaults.estimatorConfirmedSuggestions}
            />{" "}
            Estimator confirms suggested quantities (calculator output is not
            final measured quantity)
          </span>
        </label>
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Dates, terms and totals</h2>
        </header>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Issue date</span>
            <input
              className="form-input"
              type="date"
              name="issueDate"
              required
              defaultValue={defaults.issueDate}
            />
          </label>
          <label className="admin-field">
            <span>Valid until</span>
            <input
              className="form-input"
              type="date"
              name="validUntil"
              required
              defaultValue={defaults.validUntil}
            />
          </label>
          <label className="admin-field">
            <span>Header discount (ZAR)</span>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
            />
          </label>
          <label className="admin-field">
            <span>VAT rate %</span>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
            />
          </label>
          <label className="admin-field">
            <span>Deposit %</span>
            <input
              className="form-input"
              type="number"
              step="0.1"
              name="depositPercent"
              defaultValue={defaults.depositPercent}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Assumptions</span>
            <textarea
              className="form-input"
              name="assumptions"
              rows={3}
              defaultValue={defaults.assumptions}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Exclusions</span>
            <textarea
              className="form-input"
              name="exclusions"
              rows={3}
              defaultValue={defaults.exclusions}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Payment terms</span>
            <textarea
              className="form-input"
              name="paymentTerms"
              rows={2}
              defaultValue={defaults.paymentTerms}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Customer message (email)</span>
            <textarea
              className="form-input"
              name="customerMessage"
              rows={2}
              defaultValue={defaults.customerMessage}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Internal notes</span>
            <textarea
              className="form-input"
              name="internalNotes"
              rows={2}
              defaultValue={defaults.internalNotes}
            />
          </label>
          <input type="hidden" name="programmeNotes" defaultValue={defaults.programmeNotes} />
          <input type="hidden" name="warrantyWording" defaultValue={defaults.warrantyWording} />
          <input type="hidden" name="projectDescription" defaultValue={defaults.projectDescription} />
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
      </section>

      <div className="admin-panel__actions">
        <button className="btn btn--md btn--primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create draft" : "Save quote"}
        </button>
      </div>

      <PricingLibraryDialog
        open={pricingLibraryOpen}
        onClose={() => setPricingLibraryOpen(false)}
        onAddLine={appendLine}
        showCost={showCost}
      />
    </form>
  );
}
