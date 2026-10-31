# Procurement: Xero integration

All Xero access goes through the existing bridge (`lib/operations/xero-bridge.ts` → Supabase edge function `xero-bridge`). No second OAuth app, token store or tenant mapping.

## Available now (bridge v14)

| Need | Bridge tool | Notes |
| --- | --- | --- |
| Supplier bills (ACCPAY) list | `get_invoices` with `kind: "bills"`, optional `contact_name`, `date_from`, `date_to`, `status`, `page` | Returns id, number, contact, contact_id, dates, status, subtotal, tax, total, amount_paid, amount_due, reference. |
| One bill | `get_invoice` | Refresh a linked bill by its Xero id. |
| Supplier contact | `get_contact`, `get_contacts` (exact search) | For `xero_contact_id` on an order. |

Payment status, VAT and totals on a linked bill are copied from these responses only.

## Not available yet: needs the bridge builder

Purchase orders and attachments are not exposed by the bridge. Supplier quotations are **not** Xero `Quotes` (those are sales quotes); they stay as documents in DamTech.

### Prompt for the bridge builder

> Add three read-only tools to the xero-bridge edge function, following the existing tool pattern (tenant handling, caching, error mapping, audit log):
>
> 1. `get_purchase_orders`: args `status?`, `date_from?`, `date_to?`, `contact_id?`, `page?`. Calls `GET /PurchaseOrders`. Returns per order: `id` (PurchaseOrderID), `number`, `reference`, `contact`, `contact_id`, `date`, `delivery_date`, `status`, `subtotal`, `tax`, `total`, `currency`, and `lines` (description, quantity, unit_amount, line_amount, item_code).
> 2. `get_purchase_order`: args `id`. Same shape for one order.
> 3. `list_attachments`: args `entity` (`PurchaseOrders` or `Invoices`), `id`. Returns `file_name`, `mime_type`, `content_length`, `attachment_id`. And `get_attachment`: args `entity`, `id`, `file_name`, returns the file as base64 (max 20 MB).
>
> Purchase orders should be covered by the existing `accounting.invoices.read` scope under Xero's granular scopes; confirm against Xero's scope documentation. Attachments need `accounting.attachments.read`, which means re-consenting the existing connection once (same app, same tenant). Do not add any write tools.

When those exist, the website adds them to `XERO_BRIDGE_READ_TOOLS` and offers "Link Xero purchase order" and "Show Xero attachments" in the order drawer.
