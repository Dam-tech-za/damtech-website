/** Board stages for saved liner courier quotes (pure, so it can be tested). */

export const LINER_QUOTE_STAGES = ["quoted", "brief", "rated", "draft"] as const;
export type LinerQuoteStage = (typeof LINER_QUOTE_STAGES)[number];

export const LINER_QUOTE_STAGE_LABELS: Record<LinerQuoteStage, string> = {
  quoted: "On a quotation",
  brief: "Formal quote asked",
  rated: "Rated",
  draft: "Draft",
};

export const LINER_QUOTE_STAGE_TONES: Record<LinerQuoteStage, string> = {
  quoted: "green",
  brief: "purple",
  rated: "blue",
  draft: "grey",
};

export type LinerQuoteStageInput = {
  quote_id: string | null;
  chosen_amount: number | string | null;
  formal_quote_status: string;
  courier_rates: unknown[] | null;
};

export function linerQuoteStage(row: LinerQuoteStageInput): LinerQuoteStage {
  if (row.quote_id && row.chosen_amount != null) return "quoted";
  if (row.formal_quote_status === "brief_copied" || row.formal_quote_status === "portal_opened" || row.formal_quote_status === "api_submitted") {
    return "brief";
  }
  if (Array.isArray(row.courier_rates) && row.courier_rates.length > 0) return "rated";
  return "draft";
}

export function groupLinerQuotes<T extends LinerQuoteStageInput>(rows: T[]) {
  return LINER_QUOTE_STAGES.map((stage) => ({
    id: stage,
    label: LINER_QUOTE_STAGE_LABELS[stage],
    tone: LINER_QUOTE_STAGE_TONES[stage],
    rows: rows.filter((row) => linerQuoteStage(row) === stage),
  }));
}

/** Search over reference, customer, city and phone. */
export function matchesLinerQuoteSearch(
  row: { reference: string | null; customer_name: string | null; delivery_address: Record<string, string> | null },
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const a = row.delivery_address ?? {};
  return [row.reference, row.customer_name, a.city, a.suburb, a.phone, a.companyName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

/** A saved row of public.liner_courier_quotes, as the admin page reads it. */
export type LinerCourierHistoryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  reference: string | null;
  customer_name: string | null;
  shape: "circular" | "rectangular";
  inputs: Record<string, unknown>;
  area_m2: number;
  gsm: number;
  quantity: number;
  weight_kg: number;
  parcel_length_cm: number;
  parcel_width_cm: number;
  parcel_height_cm: number;
  parcel_source: "folded" | "catalogue_rule" | "manual";
  depot: string;
  delivery_address: Record<string, string>;
  declared_value: number | null;
  courier_rates: import("./types.ts").CourierRate[] | null;
  rated_at: string | null;
  chosen_service_name: string | null;
  chosen_amount: number | null;
  formal_quote_status: string;
  rfq_id: string | null;
  quote_id: string | null;
  notes: string | null;
  quotes?: { quote_number: string } | null;
  rfqs?: { rfq_number: string } | null;
};

export const LINER_DEPOT_LABELS: Record<string, string> = { pretoria: "Pretoria", "bettys-bay": "Betty's Bay" };

/** The packed parcel saved on a row. */
export function savedParcel(row: Pick<LinerCourierHistoryRow, "parcel_length_cm" | "parcel_width_cm" | "parcel_height_cm" | "weight_kg">) {
  return {
    lengthCm: Number(row.parcel_length_cm),
    widthCm: Number(row.parcel_width_cm),
    heightCm: Number(row.parcel_height_cm),
    weightKg: Number(row.weight_kg),
  };
}

/** The courier job saved on a row, for briefs and WhatsApp text. */
export function savedJob(row: LinerCourierHistoryRow): import("./liner-quote.ts").LinerCourierJob {
  const a = row.delivery_address ?? {};
  const colour = typeof row.inputs?.colour === "string" && row.inputs.colour ? ` (${row.inputs.colour})` : "";
  return {
    reference: row.reference ?? "",
    customerName: a.customerName ?? row.customer_name ?? "",
    companyName: a.companyName ?? "",
    phone: a.phone ?? "",
    email: a.email ?? "",
    street: a.street ?? "",
    suburb: a.suburb ?? "",
    city: a.city ?? "",
    province: a.province ?? "",
    postalCode: a.postalCode ?? "",
    description: `${row.quantity > 1 ? `${row.quantity} x ` : ""}${row.gsm} gsm PVC liner${colour}, ${Number(row.area_m2)} m2 made up`,
    declaredValue: Number(row.declared_value ?? 0),
    notes: row.notes ?? "",
  };
}

/** Short size line, e.g. "Round tank 5 m, 3 rows" or "Rectangular 4 × 3 × 1.5 m". */
export function savedSizeLabel(row: Pick<LinerCourierHistoryRow, "shape" | "inputs">): string {
  const i = row.inputs ?? {};
  const s = (key: string) => (typeof i[key] === "string" ? (i[key] as string) : "");
  if (row.shape === "circular") {
    const height = s("rows") === "custom" || s("heightMode") === "height" ? `${s("wallHeight")} m wall` : `${s("rows") || "?"} rows`;
    return `Round tank ${s("diameter") || "?"} m, ${height}`;
  }
  return `Rectangular ${s("length") || "?"} × ${s("width") || "?"} × ${s("depth") || "?"} m`;
}
