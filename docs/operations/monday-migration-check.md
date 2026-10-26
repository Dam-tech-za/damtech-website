# Monday → Operations: data check against Xero (26 Oct 2026)

Sources: the Monday boards "Projects – Won Jobs" (7 items) and "Material Orders & Collections" (4 items), read 26 Oct. Xero sales invoices from 1 Sep 2026 and contact search, read-only through Claude's Xero connector. **Not imported yet.** The dry run is `scripts/ops-monday-import.ts <export.json>`. The export itself stays outside the repo because it holds phone numbers and emails.

## Jobs

| Job | Monday stage → new | Monday value / balance | Xero (invoice: total, paid, due, status) | Match | Xero contact (used as customer name) |
|---|---|---|---|---|---|
| Hire Engineering – 69 kL reservoir, Modimolle | Planning & materials → Planning | R71,311.73 / R16,311.73 | INV0144: R71,311.73, R55,000 paid, R16,311.73 due 28 Oct, AUTHORISED | ✓ | Hire Engineering |
| Clinton – 1.0mm HDPE relining, Lanseria | Planning & materials → Planning | R213,625.27 / R100,000 | INV0143: R213,625.27, R113,625.27 paid, R100,000 due 27 Oct, AUTHORISED | ✓ | Clinton |
| TMS Redec – Lindley reservoir relining | Planning & materials → Planning | R142,518.01 / R142,518.01 | No invoice yet. QU0288 is still SENT in Xero (Monday note) | — | TMS Redec |
| Francois Joubert (PPCF) – 2 × HDPE dams | Planning & materials → Planning | R198,176.28 / R39,635.26 | INV0137 (ref 000527 / QU0294): R198,176.28, R158,541.02 paid, R39,635.26 due 31 Oct | ✓ | Francois Joubert PPCF Boerdery |
| Boscobel Trading – 97 kL reservoir | Planning & materials → Planning | R56,606.80 / R0 | INV0153 (ref RFQ-2026-00065): R56,606.80, PAID 22 Oct | ✓ | Boscobel Trading Pty Ltd |
| Pexmart – 116 kL reservoir, Boksburg | Final invoice → **Handover (confirm)** | R91,655 / R18,331 | INV0139 R56,235 (R11,247 due) + INV0140 R35,420 (R7,084 due), both due 31 Oct | ✓ (two invoices sum to the value) | Pexmart |
| Kingdom Pumps – torch-on lining | Final invoice → **Handover (confirm)** | R96,795.50 / R0 | INV0142: R96,795.50, R91,045.50 paid + R5,750 credit note, PAID 22 Oct | ✓ total. **Monday's next action "collect the R5,750 balance" is out of date** | Kingdom Pumps & Plant Hire |

All six invoiced jobs agree with Xero on total and balance. Quote numbers (QU0251–QU0337) can't be checked through the read-only connector, because it has no quotes tool. The first baseline sync through the bridge links them, and any number that doesn't exist shows as a project with no linked quote.

How the sync will link these invoices: INV0137, INV0139, INV0140 and INV0142 name the quote in their reference. INV0143, INV0144 and INV0153 don't, so they're linked by the invoice numbers carried over from Monday (`xero_invoice_numbers`).

## Supplier orders

| Order | Job | Monday status → new | Notes |
|---|---|---|---|
| Youngman plates 6.2 m × 2.3 m | Hire Engineering | Ordered → Ordered | Delivery or collection to confirm |
| Gundle GG26834, 1.0mm HDPE | Francois Joubert | Collected / delivered → Received | Customer collected at Gundle yard |
| Gundle quote, ~1,480 m² HDPE | Clinton | Quote requested → Quote requested | |
| Fibertex SO4010749, F25 geotextile | Francois Joubert | Ordered → Ordered | Monday cost R7,020 doesn't say whether VAT is included. It's kept as a note, not as cost excl. VAT |

## For a person to confirm after import

1. Pexmart and Kingdom Pumps: is the work finished? If so, mark them Completed. Pexmart still has R18,331 due.
2. TMS Redec: mark QU0288 Accepted in Xero once Callie confirms the 1.5 mm revision.
3. Boscobel: set a real next-action date. Monday had none, so the import uses the import date.
4. Fibertex cost: confirm whether R7,020 includes VAT.
