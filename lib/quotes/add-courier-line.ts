import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { upsertCourierQuoteLine } from "@/lib/courier/liner-quote";
import { writeQuoteEvent } from "./events";
import { calculateQuote } from "./calculate-quote";
import { quoteDefaultsFromMetadata } from "./quote-validation";
import { canEditQuote } from "./workflow";
import type { QuoteLineInput, QuoteLineType } from "./types";

export type AddCourierLineResult =
  | { ok: true; quoteId: string; quoteNumber: string; totalIncVat: number; replaced: boolean }
  | { ok: false; error: string };

function lineFromRow(row: Record<string, unknown>): QuoteLineInput {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: String(row.id),
    sortOrder: Number(row.sort_order ?? 0),
    lineType: row.line_type as QuoteLineType,
    itemCode: (row.item_code as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    description: String(row.description ?? ""),
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit ?? "each"),
    costUnitPrice: num(row.cost_unit_price),
    sellUnitPrice: Number(row.sell_unit_price ?? 0),
    discountPercent: Number(row.discount_percent ?? 0),
    taxCategory: ((row.tax_category as string) || "standard") as QuoteLineInput["taxCategory"],
    sourceMaterialItemId: (row.source_material_item_id as string | null) ?? null,
    sourceLabourItemId: (row.source_labour_item_id as string | null) ?? null,
    sourceSupplierPriceId: (row.source_supplier_price_id as string | null) ?? null,
    sourcePricingItemId: (row.source_pricing_item_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

/**
 * Add (or replace) the Liner courier delivery line on a draft quotation and
 * recalculate its totals with the same calculateQuote the quote builder uses.
 * Stored line prices are already excl. VAT, so they are recalculated as such.
 */
export async function addCourierLineToQuote(
  quoteId: string,
  courierLine: Omit<QuoteLineInput, "sortOrder">,
): Promise<AddCourierLineResult> {
  const admin = await assertAdmin({ permission: "manageQuotes" });
  const supabase = await createClient();
  const { data: quote, error } = await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (error || !quote) return { ok: false, error: "Quotation not found." };
  if (!canEditQuote(String(quote.status), admin.profile.role)) {
    return { ok: false, error: `Quotation ${quote.quote_number} is ${quote.status}, so it is locked. Create a revision first.` };
  }
  const { data: rows, error: linesError } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order");
  if (linesError) return { ok: false, error: "Could not read the quotation lines." };

  const existing = (rows ?? []).map((row) => lineFromRow(row as Record<string, unknown>));
  const replaced = existing.some((line) => line.metadata?.source === courierLine.metadata?.source);
  const lines = upsertCourierQuoteLine(existing, courierLine);
  const meta = quoteDefaultsFromMetadata(quote as Record<string, unknown>);
  const totals = calculateQuote(lines, {
    discountAmount: Number(quote.discount_amount ?? 0),
    discountType: meta.discountType,
    discountPercent: meta.discountPercent,
    vatRatePercent: Number(quote.vat_rate ?? 15),
    vatPricingMode: "exclusive",
  });

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      discount_amount: totals.discountAmount,
      subtotal_ex_vat: totals.subtotalExVat,
      net_ex_vat: totals.subtotalExVat - totals.discountAmount,
      vat_amount: totals.vatAmount,
      total_inc_vat: totals.totalIncVat,
      direct_cost: totals.directCost,
      gross_profit: totals.grossProfit,
      gross_margin_percent: totals.grossMarginPercent,
    })
    .eq("id", quoteId);
  if (updateError) return { ok: false, error: "Could not update the quotation totals." };

  // Same as updateDraftQuote: replace the lines with the recalculated set.
  await supabase.from("quote_line_items").delete().eq("quote_id", quoteId);
  const { error: insertError } = await supabase.from("quote_line_items").insert(
    totals.lines.map((line) => ({
      quote_id: quoteId,
      sort_order: line.sortOrder,
      line_type: line.lineType,
      item_code: line.itemCode ?? null,
      category: line.category ?? null,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      cost_unit_price: line.costUnitPrice ?? null,
      sell_unit_price: line.sellUnitPrice,
      discount_percent: line.discountPercent,
      tax_category: line.taxCategory,
      line_total_ex_vat: line.lineTotalExVat,
      metadata: line.metadata ?? null,
      source_material_item_id: line.sourceMaterialItemId ?? null,
      source_labour_item_id: line.sourceLabourItemId ?? null,
      source_supplier_price_id: line.sourceSupplierPriceId ?? null,
      source_pricing_item_id: line.sourcePricingItemId ?? null,
    })),
  );
  if (insertError) {
    console.error("[liner-courier] quote lines not saved:", insertError.message);
    return { ok: false, error: "The totals changed but the lines could not be saved. Open the quotation and save it again." };
  }

  await writeQuoteEvent(supabase, {
    quoteId,
    eventType: "updated",
    actorType: "admin",
    actorUserId: admin.user.id,
    metadata: { source: "liner-courier", replaced },
  });
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "quote_courier_line_added",
    entityType: "quote",
    entityId: quoteId,
    afterData: { description: courierLine.description, sell_unit_price: courierLine.sellUnitPrice, total_inc_vat: totals.totalIncVat },
  });
  return { ok: true, quoteId, quoteNumber: String(quote.quote_number), totalIncVat: totals.totalIncVat, replaced };
}
