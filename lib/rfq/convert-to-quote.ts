import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { suggestLineItemsFromCalculator } from "./calculator";
import {
  suggestQuoteLinesFromAssets,
  suggestionsHavePriceGaps,
} from "./quote-suggestions";
import type { CalculatorPayload } from "./schema";
import { getQuoteSettings } from "@/lib/quotes/settings";
import {
  addDaysToIsoDate,
  recalculateQuoteTotals,
  todayIsoDateJohannesburg,
} from "@/lib/quotes/totals";
import { writeQuoteEvent } from "@/lib/quotes/events";
import type { QuoteLineInput } from "@/lib/quotes/types";

export type ConvertRfqResult =
  | { ok: true; quoteId: string; quoteNumber: string }
  | {
      ok: false;
      error: string;
      code?:
        | "already_converted"
        | "forbidden"
        | "not_found"
        | "validation"
        | "price_gaps";
    };

/**
 * Protected RFQ → draft quote conversion.
 * Snapshots customer/RFQ/assets/calculations; generates editable suggestions only.
 */
export async function convertRfqToQuote(
  rfqId: string,
  options: {
    forceSecondQuote?: boolean;
    allowUnconfirmed?: boolean;
    acknowledgeSiteMeasurement?: boolean;
    allowPriceGaps?: boolean;
  } = {},
): Promise<ConvertRfqResult> {
  try {
    const admin = await assertAdmin({ permission: "manageQuotes" });
    const supabase = await createClient();

    const { data: rfq, error } = await supabase
      .from("rfqs")
      .select("*")
      .eq("id", rfqId)
      .maybeSingle();

    if (error || !rfq) {
      return { ok: false, error: "RFQ not found.", code: "not_found" };
    }

    if (rfq.status === "converted" && rfq.converted_quote_id && !options.forceSecondQuote) {
      return {
        ok: false,
        error: "RFQ already converted. Use explicit second-quote action if needed.",
        code: "already_converted",
      };
    }

    if (!rfq.customer_id) {
      return {
        ok: false,
        error: "RFQ has no linked customer.",
        code: "validation",
      };
    }

    if (!rfq.assigned_to) {
      return {
        ok: false,
        error: "Assign an estimator before converting.",
        code: "validation",
      };
    }

    const { data: assets } = await supabase
      .from("rfq_assets")
      .select("*")
      .eq("rfq_id", rfq.id)
      .order("asset_sequence");

    const assetRows = assets ?? [];
    if (!assetRows.length && !rfq.calculator_type) {
      return {
        ok: false,
        error: "RFQ has no assets or calculator data to quote.",
        code: "validation",
      };
    }

    if (assetRows.length && !options.allowUnconfirmed) {
      const unconfirmed = assetRows.filter(
        (a) =>
          !a.estimator_confirmed &&
          a.measurement_status !== "confirmed_for_quote",
      );
      if (unconfirmed.length) {
        return {
          ok: false,
          error: `${unconfirmed.length} asset(s) not confirmed for quotation. Confirm or explicitly override.`,
          code: "validation",
        };
      }
    }

    const needsMeasurement =
      rfq.site_measurement_required ||
      assetRows.some(
        (a) =>
          a.measurement_status === "site_measurement_required" ||
          a.measurement_method === "site_measurement_required",
      );
    if (needsMeasurement && !options.acknowledgeSiteMeasurement) {
      return {
        ok: false,
        error:
          "Site measurement still required. Acknowledge to proceed, or resolve measurement first.",
        code: "validation",
      };
    }

    const travelKm =
      Number(rfq.measurement_travel_km) ||
      Number((rfq as { travel_distance_km?: number }).travel_distance_km) ||
      null;

    let lineInputs: QuoteLineInput[];
    let priceGaps = false;

    if (assetRows.length) {
      const suggestions = suggestQuoteLinesFromAssets(assetRows, {
        travelKm,
        trips: 1,
        includeSiteEstablishment: true,
      });
      priceGaps = suggestionsHavePriceGaps(suggestions);
      const gapPayload = suggestions
        .filter((s) => s.priceRequired && s.sellUnitPrice <= 0)
        .map((s) => ({
          itemCode: s.itemCode,
          description: s.description,
          flag: "PRICE REQUIRED",
        }));
      // Draft conversion proceeds with flagged gaps; quote approval must resolve them.
      if (gapPayload.length && assetRows[0]) {
        await supabase
          .from("rfq_assets")
          .update({ price_gaps: gapPayload })
          .eq("id", assetRows[0].id);
      }

      lineInputs = suggestions.map((item) => ({
        sortOrder: item.sortOrder,
        lineType: item.lineType,
        itemCode: item.itemCode,
        description: item.priceRequired
          ? `${item.description} — PRICE REQUIRED`
          : item.description,
        quantity: item.quantity,
        unit: item.unit,
        costUnitPrice: item.costUnitPrice,
        sellUnitPrice: item.sellUnitPrice,
        discountPercent: item.discountPercent,
        taxCategory: item.taxCategory,
        metadata: {
          ...item.metadata,
          sourceAssetIds: item.sourceAssetIds,
          suggestionGroup: item.suggestionGroup,
          priceRequired: item.priceRequired,
          fromRfqSuggestions: true,
        },
      }));
    } else {
      const calculator: CalculatorPayload | null =
        rfq.calculator_type && rfq.calculator_input && rfq.calculator_result
          ? {
              calculatorType: rfq.calculator_type,
              inputs: rfq.calculator_input as Record<string, unknown>,
              results: rfq.calculator_result as Record<string, unknown>,
            }
          : null;
      const suggestions = suggestLineItemsFromCalculator(calculator);
      lineInputs = suggestions.map((item, index) => ({
        sortOrder: index,
        lineType:
          item.kind === "material"
            ? "material"
            : item.kind === "labour"
              ? "labour"
              : item.kind === "travel"
                ? "travel"
                : item.kind === "delivery"
                  ? "delivery"
                  : "custom",
        itemCode: item.code ?? null,
        description: `${item.description} — planning estimate (confirm before send)`,
        quantity: item.quantity,
        unit: item.unit,
        costUnitPrice: item.unitCost ?? null,
        sellUnitPrice: item.unitSell ?? 0,
        discountPercent: 0,
        taxCategory: item.taxable ? "standard" : "exempt",
        metadata: {
          source: item.source,
          requiresEstimatorConfirmation: true,
          priceRequired: !(item.unitSell && item.unitSell > 0),
        },
      }));
      priceGaps = lineInputs.some(
        (l) => (l.metadata as { priceRequired?: boolean })?.priceRequired,
      );
    }

    const service = createServiceRoleClient();
    const { data: quoteNumber, error: numberError } = await service.rpc(
      "next_quote_number",
    );

    if (numberError || typeof quoteNumber !== "string") {
      return { ok: false, error: "Unable to allocate quote number." };
    }

    const settings = await getQuoteSettings();
    const issueDate = todayIsoDateJohannesburg();
    const validityDays = settings?.default_validity_days ?? 30;
    const validUntil = addDaysToIsoDate(issueDate, validityDays);
    const vatRate = Number(settings?.default_vat_rate ?? 15);
    const totals = recalculateQuoteTotals(lineInputs, {
      discountAmount: 0,
      vatRatePercent: vatRate,
    });

    const customerSnapshot = await loadCustomerSnapshot(supabase, rfq.customer_id);
    const calcSnapshots = await loadCalculationSnapshots(
      supabase,
      assetRows.map((a) => a.id),
    );

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        revision_number: options.forceSecondQuote ? 1 : 0,
        status: "draft",
        customer_id: rfq.customer_id,
        rfq_id: rfq.id,
        title: `${rfq.service_required ?? "Project"} — ${rfq.rfq_number}`,
        contact_name: rfq.contact_name,
        company_name: rfq.company_name,
        email: rfq.email,
        phone: rfq.phone,
        province: rfq.province,
        project_location: rfq.project_location,
        service_required: rfq.service_required,
        project_description: rfq.project_description,
        scope_summary: rfq.project_description,
        assumptions:
          settings?.default_assumptions ??
          "Web calculator and RFQ quantities are planning estimates only — confirm measured quantities before approval.",
        exclusions: settings?.default_exclusions ?? null,
        payment_terms: settings?.default_payment_terms ?? null,
        calculator_type: rfq.calculator_type,
        calculator_input: rfq.calculator_input,
        calculator_result: rfq.calculator_result,
        line_items: [],
        currency: "ZAR",
        issue_date: issueDate,
        valid_until: validUntil,
        validity_days: validityDays,
        expires_at: `${validUntil}T23:59:59+02:00`,
        subtotal_ex_vat: totals.subtotalExVat,
        discount_amount: totals.discountAmount,
        net_ex_vat: totals.subtotalExVat - totals.discountAmount,
        vat_rate: totals.vatRate,
        vat_amount: totals.vatAmount,
        total_inc_vat: totals.totalIncVat,
        direct_cost: totals.directCost,
        gross_profit: totals.grossProfit,
        gross_margin_percent: totals.grossMarginPercent,
        calculation_snapshot: {
          fromRfq: true,
          assetCount: assetRows.length,
          assets: assetRows.map((a) => ({
            id: a.id,
            name: a.asset_name,
            type: a.asset_type,
            measurement_status: a.measurement_status,
            confirmed_material_area_m2: a.confirmed_material_area_m2,
            confirmed_installation_area_m2: a.confirmed_installation_area_m2,
            confirmed_capacity_kl: a.confirmed_capacity_kl,
            calculated_outputs: a.calculated_outputs,
          })),
          customerSnapshot,
          calculationSnapshots: calcSnapshots,
          priceGapsFlagged: priceGaps,
          siteMeasurementAcknowledged: Boolean(options.acknowledgeSiteMeasurement),
          estimatorConfirmationRequired: true,
          serverRecalculated: true,
          at: new Date().toISOString(),
        },
        created_by: admin.user.id,
        assigned_to: rfq.assigned_to ?? admin.user.id,
        is_latest_revision: true,
      })
      .select("id, quote_number")
      .single();

    if (quoteError || !quote) {
      console.error("[rfq] convert quote insert failed:", quoteError?.message);
      return { ok: false, error: "Unable to create draft quote." };
    }

    if (totals.lines.length) {
      await supabase.from("quote_line_items").insert(
        totals.lines.map((line) => ({
          quote_id: quote.id,
          sort_order: line.sortOrder,
          line_type: line.lineType,
          item_code: line.itemCode,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          cost_unit_price: line.costUnitPrice,
          sell_unit_price: line.sellUnitPrice,
          discount_percent: line.discountPercent,
          tax_category: line.taxCategory,
          line_total_ex_vat: line.lineTotalExVat,
          metadata: line.metadata,
        })),
      );
    }

    await supabase
      .from("rfqs")
      .update({
        status: "converted",
        converted_quote_id: quote.id,
        reviewed_at: rfq.reviewed_at ?? new Date().toISOString(),
      })
      .eq("id", rfq.id);

    await supabase.from("rfq_events").insert({
      rfq_id: rfq.id,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: "converted_to_quote",
      message: `Converted to draft quote ${quote.quote_number}`,
      metadata: {
        quote_id: quote.id,
        force_second: Boolean(options.forceSecondQuote),
        price_gaps: priceGaps,
      },
    });

    await writeQuoteEvent(supabase, {
      quoteId: quote.id,
      eventType: "created_from_rfq",
      actorType: "admin",
      actorUserId: admin.user.id,
      metadata: { rfq_id: rfq.id },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_converted_to_quote",
      entityType: "rfq",
      entityId: rfq.id,
      afterData: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
      },
    });

    return { ok: true, quoteId: quote.id, quoteNumber: quote.quote_number };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message, code: "forbidden" };
    }
    console.error("[rfq] convert unexpected:", error);
    return { ok: false, error: "Unable to convert RFQ." };
  }
}

async function loadCustomerSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
) {
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();
  return data;
}

async function loadCalculationSnapshots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assetIds: string[],
) {
  if (!assetIds.length) return [];
  const { data } = await supabase
    .from("rfq_asset_calculations")
    .select("*")
    .in("rfq_asset_id", assetIds)
    .order("calculated_at", { ascending: false });
  return data ?? [];
}
