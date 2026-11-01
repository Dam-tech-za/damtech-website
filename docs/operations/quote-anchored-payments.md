# Quote-anchored project money

1 Nov 2026. Owner prompt A ("projects are anchored to the quote").

## Rules (lib/operations/project-money.ts, shared by board, project page, quick view and refreshes)

- Project value Q = the primary quote's total (the first number in `xero_quote_numbers`) or a hand-entered value. Invoices never set it. "Use Xero total" became "Use quote total".
- Invoiced = live (AUTHORISED/PAID) invoice totals. Paid = their AmountPaid. Owed now = their AmountDue. Overdue only when something is due and its due date has passed.
- Not yet invoiced = Q − invoiced (not debt). Remaining on quote = Q − paid − credited. % paid = paid / Q.
- Kinds: a kind stored on the invoice link wins (set in Financials; "Auto" = unclassified). Otherwise DEPOSIT / BALANCE / FINAL in the reference, then amounts (first invoice under 95 % of Q = deposit; reaching Q = balance; ≥ 95 % = full).
- Status: paid in full only when paid + credited ≥ Q (never without a Q); balance due when a balance/full/progress invoice is unpaid; deposit invoiced / portion of deposit / deposit paid otherwise. A manual status still overrides.
- Board: payment pill gets a ring marker and tooltip "R… still to invoice" when value is still to invoice; Xero cell tooltip lists the primary quote then each invoice with kind and status.
- Attaching invoices: "Find invoices for this client" lists invoices of the same Xero ContactID as the primary quote (dated on/after it) that are on no project; the user attaches each. Never by name or email.
- "Refresh from Xero" now also re-reads each linked invoice and quote by its Xero id.
- From Xero review: value is only proposed from a quote; accepting a number adds it (a quote becomes primary) instead of replacing.

## Live data found 1 Nov (Xero read-only vs the site's cache)

The invoice cache was last refreshed 29 Oct; the automatic sync is off (`OPS_XERO_SYNC_ENABLED` not set, so the daily cron does nothing).

| Project | Cache | Xero now |
| --- | --- | --- |
| Hire Engineering INV0144 | R71,311.73, R16,311.73 due, AUTHORISED | R55,000.00 PAID, "… - DEPOSIT INVOICE" |
| Clinton INV0143 | R213,625.27, R100,000 due | R113,625.27 PAID, deposit; project value R213,625.27 came from the old invoice and no quote is linked |
| Andre Bothma | no invoice | INV0165 R10,580 PAID, ref QU0237 |
| TMS Redec | INV0145 number only, not linked | INV0145 R114,014.40 PAID, ref QU0288 |
| Francois Joubert | project contact f878…, invoice contact 3ad9… | contact differs; check which Xero contact is right |
