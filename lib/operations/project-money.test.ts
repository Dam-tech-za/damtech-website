import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyInvoices, projectMoney, type MoneyInvoice } from "./project-money.ts";

const TODAY = "2026-11-01";
const inv = (p: Partial<MoneyInvoice>): MoneyInvoice => ({
  invoice_number: "INV1",
  reference: null,
  kind: "unclassified",
  xero_status: "AUTHORISED",
  total_incl_vat: 0,
  amount_paid: 0,
  amount_due: 0,
  invoice_date: "2026-10-21",
  due_date: "2026-10-28",
  ...p,
});

const HIRE_Q = 71311.73;
const hireDeposit = inv({
  invoice_number: "INV0144",
  reference: "Hire Engineering - 69 kL reservoir with roof, Modimolle (Nylstroom) farm - DEPOSIT INVOICE",
  xero_status: "PAID",
  total_incl_vat: 55000,
  amount_paid: 55000,
  amount_due: 0,
});

describe("Hire Engineering (quote QU0321, deposit INV0144)", () => {
  it("shows the deposit as a deposit, not as full payment", () => {
    const m = projectMoney([hireDeposit], HIRE_Q, TODAY);
    assert.equal(m.invoiced, 55000);
    assert.equal(m.paid, 55000);
    assert.equal(m.due, 0);
    assert.equal(m.notYetInvoiced, 16311.73);
    assert.equal(m.remainingOnQuote, 16311.73);
    assert.equal(m.pctPaid, 77);
    assert.equal(m.overdue, false);
    assert.equal(m.label, "deposit_paid");
    assert.equal(m.kinds[0].kind, "deposit");
  });
  it("balance raised and overdue → balance due; paid → paid in full", () => {
    const balance = inv({ invoice_number: "INV0200", reference: "QU0321 - BALANCE INVOICE", invoice_date: "2026-11-10", due_date: "2026-10-31", total_incl_vat: 16311.73, amount_due: 16311.73 });
    const m = projectMoney([hireDeposit, balance], HIRE_Q, TODAY);
    assert.equal(m.invoiced, HIRE_Q);
    assert.equal(m.notYetInvoiced, 0);
    assert.equal(m.due, 16311.73);
    assert.equal(m.overdue, true);
    assert.equal(m.label, "balance_due");
    const paid = projectMoney([hireDeposit, { ...balance, xero_status: "PAID", amount_paid: 16311.73, amount_due: 0 }], HIRE_Q, TODAY);
    assert.equal(paid.label, "paid_in_full");
    assert.equal(paid.pctPaid, 100);
  });
});

describe("rules", () => {
  it("never treats the un-invoiced balance as owed", () => {
    const m = projectMoney([hireDeposit], HIRE_Q, TODAY);
    assert.equal(m.due, 0);
    assert.ok(m.notYetInvoiced! > 0);
  });
  it("ignores draft and voided invoices", () => {
    const m = projectMoney([inv({ xero_status: "VOIDED", total_incl_vat: 100 }), inv({ xero_status: "DRAFT", total_incl_vat: 50 })], 100, TODAY);
    assert.equal(m.invoiced, 0);
    assert.equal(m.label, null);
  });
  it("a deposit alone is never paid in full, even without a quote", () => {
    const m = projectMoney([hireDeposit], null, TODAY);
    assert.notEqual(m.label, "paid_in_full");
  });
  it("a single full invoice paid → paid in full", () => {
    const m = projectMoney([inv({ total_incl_vat: 56606.8, amount_paid: 56606.8, xero_status: "PAID", reference: "RFQ-2026-00065" })], 56606.8, TODAY);
    assert.equal(m.kinds[0].kind, "full");
    assert.equal(m.label, "paid_in_full");
  });
  it("issued but unpaid deposit → deposit invoiced; part paid → portion of deposit", () => {
    const d = inv({ reference: "X - DEPOSIT INVOICE", total_incl_vat: 80, amount_due: 80 });
    assert.equal(projectMoney([d], 100, TODAY).label, "deposit_invoiced");
    assert.equal(projectMoney([{ ...d, amount_paid: 30, amount_due: 50 }], 100, TODAY).label, "portion_of_deposit_paid");
  });
  it("overdue only when something is due and the date has passed", () => {
    assert.equal(projectMoney([inv({ total_incl_vat: 80, amount_due: 80, due_date: "2026-11-05" })], 100, TODAY).overdue, false);
    assert.equal(projectMoney([inv({ total_incl_vat: 80, amount_due: 80, due_date: "2026-10-05" })], 100, TODAY).overdue, true);
  });
  it("a kind chosen by a person wins over the guess", () => {
    const k = classifyInvoices([inv({ kind: "progress", reference: "DEPOSIT", total_incl_vat: 10 })], 100);
    assert.deepEqual(k[0], { kind: "progress", chosen: true });
  });
});
