import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { suggestQuoteLinesFromAssets } from "@/lib/rfq/quote-suggestions";
import type { EditableLine } from "./quote-builder-types";

export type RfqSearchResult = {
  id: string;
  rfqNumber: string;
  contactName: string | null;
  companyName: string | null;
  serviceRequired: string | null;
  projectLocation: string | null;
  customerId: string | null;
  status: string;
};

export type RfqImportPreview = {
  rfqId: string;
  rfqNumber: string;
  customerId: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  province: string;
  vatNumber: string | null;
  title: string;
  projectReference: string;
  projectLocation: string;
  serviceRequired: string;
  projectDescription: string;
  approximateProjectSize: string | null;
  suggestedLines: EditableLine[];
  hasCalculatorSuggestions: boolean;
  customerMismatch?: boolean;
};

function mapSuggestionToEditableLine(
  line: ReturnType<typeof suggestQuoteLinesFromAssets>[number],
): EditableLine {
  return {
    sortOrder: line.sortOrder,
    lineType: line.lineType,
    itemCode: line.itemCode ?? "",
    category: line.category ?? "",
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    costUnitPrice: line.costUnitPrice ?? null,
    sellUnitPrice: line.sellUnitPrice,
    discountPercent: line.discountPercent,
    taxCategory: line.taxCategory,
    metadata: {
      ...(line.metadata ?? {}),
      source: "rfq_suggestion",
      priceRequired: line.priceRequired,
      suggestionGroup: line.suggestionGroup,
    },
  };
}

export async function searchRfqsForImport(
  query: string,
): Promise<{ ok: true; results: RfqSearchResult[] } | { ok: false; error: string }> {
  try {
    await assertAdmin({ permission: "manageQuotes" });
    const supabase = await createClient();
    const q = query.trim();
    if (!q) return { ok: true, results: [] };

    const { data, error } = await supabase
      .from("rfqs")
      .select(
        "id, rfq_number, contact_name, company_name, service_required, project_location, customer_id, status",
      )
      .or(
        `rfq_number.ilike.%${q}%,contact_name.ilike.%${q}%,company_name.ilike.%${q}%,project_location.ilike.%${q}%,service_required.ilike.%${q}%`,
      )
      .order("submitted_at", { ascending: false })
      .limit(20);

    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      results: (data ?? []).map((row) => ({
        id: row.id,
        rfqNumber: row.rfq_number,
        contactName: row.contact_name,
        companyName: row.company_name,
        serviceRequired: row.service_required,
        projectLocation: row.project_location,
        customerId: row.customer_id,
        status: row.status,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to search RFQs.",
    };
  }
}

export async function buildRfqImportPreview(
  rfqId: string,
  options: { currentCustomerId?: string } = {},
): Promise<{ ok: true; preview: RfqImportPreview } | { ok: false; error: string }> {
  try {
    await assertAdmin({ permission: "manageQuotes" });
    const supabase = await createClient();

    const { data: rfq, error } = await supabase
      .from("rfqs")
      .select("*")
      .eq("id", rfqId)
      .maybeSingle();

    if (error || !rfq) {
      return { ok: false, error: "RFQ not found." };
    }

    if (!rfq.customer_id) {
      return { ok: false, error: "RFQ has no linked customer." };
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("vat_number")
      .eq("id", rfq.customer_id)
      .maybeSingle();

    const { data: assets } = await supabase
      .from("rfq_assets")
      .select("*")
      .eq("rfq_id", rfq.id)
      .order("asset_sequence");

    const suggestions = suggestQuoteLinesFromAssets(assets ?? [], {
      travelKm:
        Number(rfq.measurement_travel_km) ||
        Number(rfq.travel_km) ||
        undefined,
    });

    const location = rfq.project_location ?? rfq.province ?? "";
    const titleParts = [rfq.service_required, location].filter(Boolean);
    const title =
      titleParts.length > 0
        ? `${titleParts.join(" — ")}`
        : `Quotation — ${rfq.rfq_number}`;

    const preview: RfqImportPreview = {
      rfqId: rfq.id,
      rfqNumber: rfq.rfq_number,
      customerId: rfq.customer_id,
      contactName: rfq.contact_name ?? "",
      companyName: rfq.company_name ?? "",
      email: rfq.email ?? "",
      phone: rfq.phone ?? "",
      province: rfq.province ?? "",
      vatNumber: customer?.vat_number ?? null,
      title,
      projectReference: rfq.rfq_number,
      projectLocation: rfq.project_location ?? "",
      serviceRequired: rfq.service_required ?? "",
      projectDescription: rfq.project_description ?? "",
      approximateProjectSize:
        rfq.approximate_project_size_text ??
        (rfq.approximate_project_size != null
          ? String(rfq.approximate_project_size)
          : null),
      suggestedLines: suggestions.map(mapSuggestionToEditableLine),
      hasCalculatorSuggestions: suggestions.length > 0,
      customerMismatch: Boolean(
        options.currentCustomerId &&
          options.currentCustomerId !== rfq.customer_id,
      ),
    };

    return { ok: true, preview };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load RFQ preview.",
    };
  }
}
