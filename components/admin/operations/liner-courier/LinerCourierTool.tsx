"use client";

import { useMemo, useState, useTransition } from "react";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { AdminTextarea } from "@/components/admin/ui/AdminTextarea";
import { AdminPanel } from "@/components/admin/ui/AdminPanel";
import {
  catalogueRuleParcel,
  circularLinerArea,
  DEFAULT_BULK_FACTOR,
  DEFAULT_MAX_EDGE_CM,
  foldLinerParcel,
  linedWallHeightForRows,
  listedHeightForRows,
  rectangularLinerArea,
  volumetricWeightKg,
} from "@/lib/courier/liner-pack";
import {
  buildCourierQuoteBrief,
  buildCourierQuoteLine,
  buildWhatsAppSummary,
  COURIER_PORTAL_URL,
  declaredValueFor,
  formatRand,
  quoteLineCopyText,
  rateExVat,
  SA_PROVINCES,
  whatsAppLink,
  type LinerCourierJob,
} from "@/lib/courier/liner-quote";
import type { CourierRate } from "@/lib/courier/types";
import {
  addCourierToQuoteAction,
  courierRatesForParcelAction,
  findRfqOrQuoteAction,
  recordFormalQuoteAction,
  saveLinerCourierDraftAction,
  type LinkedRecord,
  type LinerRatesRequest,
  type ParcelSource,
} from "@/app/admin/operations/liner-courier/actions";

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
  parcel_source: ParcelSource;
  depot: string;
  delivery_address: Record<string, string>;
  declared_value: number | null;
  courier_rates: CourierRate[] | null;
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

type Props = {
  depots: { id: string; label: string }[];
  courierReady: boolean;
  canEditQuotes: boolean;
  history: LinerCourierHistoryRow[];
};

/** Every input as text, so fields stay editable while half-typed. */
type Form = {
  shape: "circular" | "rectangular";
  diameter: string;
  heightMode: "rows" | "height";
  rows: string;
  wallHeight: string;
  foldOver: string;
  waste: string;
  length: string;
  width: string;
  depth: string;
  slope: string;
  anchor: string;
  overlap: string;
  gsm: string;
  customGsm: string;
  colour: string;
  quantity: string;
  parcelSource: ParcelSource;
  maxEdge: string;
  bulk: string;
  manualL: string;
  manualW: string;
  manualH: string;
  manualKg: string;
  reference: string;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  depot: string;
  declaredValue: string;
  notes: string;
  markup: string;
  sellExVat: string;
};

const EMPTY: Form = {
  shape: "circular",
  diameter: "5",
  heightMode: "rows",
  rows: "3",
  wallHeight: "2.186",
  foldOver: "0.30",
  waste: "5",
  length: "4",
  width: "3",
  depth: "1.5",
  slope: "0",
  anchor: "0",
  overlap: "5",
  gsm: "550",
  customGsm: "",
  colour: "",
  quantity: "1",
  parcelSource: "folded",
  maxEdge: String(DEFAULT_MAX_EDGE_CM),
  bulk: String(DEFAULT_BULK_FACTOR),
  manualL: "",
  manualW: "",
  manualH: "",
  manualKg: "",
  reference: "",
  customerName: "",
  companyName: "",
  phone: "",
  email: "",
  street: "",
  suburb: "",
  city: "",
  province: "Gauteng",
  postalCode: "",
  depot: "auto",
  declaredValue: "",
  notes: "",
  markup: "0",
  sellExVat: "",
};

const num = (value: string) => Number(String(value).replace(",", "."));
const DEPOT_NAMES: Record<string, string> = { pretoria: "Pretoria", "bettys-bay": "Betty's Bay" };

function formatDay(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function LinerCourierTool({ depots, courierReady, canEditQuotes, history }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [rates, setRates] = useState<CourierRate[]>([]);
  const [rateMeta, setRateMeta] = useState<{ depotLabel: string; collection: string; ratedAt: string } | null>(null);
  const [service, setService] = useState("");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [linked, setLinked] = useState<LinkedRecord | null>(null);
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<LinkedRecord[]>([]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    // A changed job means the old rates no longer apply.
    if (!["markup", "sellExVat", "reference", "notes"].includes(key)) {
      setRates([]);
      setService("");
    }
  };

  const gsm = form.gsm === "other" ? num(form.customGsm) : num(form.gsm);
  const quantity = Math.min(20, Math.max(1, Math.floor(num(form.quantity)) || 1));
  const derivedHeight = linedWallHeightForRows(num(form.rows) || 0);
  const wallHeight = form.heightMode === "rows" ? derivedHeight : num(form.wallHeight);

  const areaResult = useMemo(() => {
    if (form.shape === "circular") {
      return circularLinerArea({
        diameterM: num(form.diameter),
        wallHeightM: wallHeight,
        foldOverM: num(form.foldOver),
        wastePercent: num(form.waste),
      });
    }
    return rectangularLinerArea({
      lengthM: num(form.length),
      widthM: num(form.width),
      depthM: num(form.depth),
      sideSlopeZH: num(form.slope),
      foldOverM: num(form.foldOver),
      anchorRunoutM: num(form.anchor),
      overlapPercent: num(form.overlap),
      wastePercent: num(form.waste),
    });
  }, [form.shape, form.diameter, wallHeight, form.foldOver, form.waste, form.length, form.width, form.depth, form.slope, form.anchor, form.overlap]);

  const area = areaResult.ok ? areaResult.area : null;
  const gsmOk = Number.isFinite(gsm) && gsm >= 100 && gsm <= 3000;

  const folded = useMemo(() => {
    if (!area || !gsmOk) return null;
    return foldLinerParcel(
      { flatLengthM: area.flatLengthM, flatWidthM: area.flatWidthM, areaM2: area.materialAreaM2, gsm },
      { maxEdgeCm: num(form.maxEdge) || DEFAULT_MAX_EDGE_CM, bulkFactor: num(form.bulk) || DEFAULT_BULK_FACTOR },
    );
  }, [area, gsm, gsmOk, form.maxEdge, form.bulk]);
  const rule = area && gsmOk ? catalogueRuleParcel(area.materialAreaM2, gsm) : null;

  const manual = {
    lengthCm: num(form.manualL),
    widthCm: num(form.manualW),
    heightCm: num(form.manualH),
    weightKg: num(form.manualKg),
  };
  const manualOk = Object.values(manual).every((n) => Number.isFinite(n) && n > 0);
  const parcel =
    form.parcelSource === "manual"
      ? manualOk
        ? manual
        : null
      : form.parcelSource === "catalogue_rule"
        ? rule
        : folded
          ? { lengthCm: folded.lengthCm, widthCm: folded.widthCm, heightCm: folded.heightCm, weightKg: folded.weightKg }
          : null;

  const job: LinerCourierJob = {
    reference: form.reference,
    customerName: form.customerName,
    companyName: form.companyName,
    phone: form.phone,
    email: form.email,
    street: form.street,
    suburb: form.suburb,
    city: form.city,
    province: form.province,
    postalCode: form.postalCode,
    description: area
      ? `${quantity > 1 ? `${quantity} x ` : ""}${gsm} gsm PVC liner${form.colour ? ` (${form.colour})` : ""}, ${area.materialAreaM2} m2 made up`
      : "Made-up PVC liner",
    declaredValue: num(form.declaredValue) || 0,
    notes: form.notes,
  };
  const declared = declaredValueFor(job.declaredValue);
  const chosen = rates.find((rate) => rate.serviceCode === service) ?? null;
  const depotLabel = rateMeta?.depotLabel ?? (form.depot === "auto" ? (form.province === "Western Cape" && depots.some((d) => d.id === "bettys-bay") ? "Betty's Bay" : "Pretoria") : DEPOT_NAMES[form.depot] ?? form.depot);

  const summary =
    area && parcel
      ? buildWhatsAppSummary({ areaM2: area.materialAreaM2, gsm, parcel, quantity, depotLabel, city: form.city || "customer", rate: chosen })
      : "";

  const quoteLine =
    chosen && parcel
      ? buildCourierQuoteLine(
          {
            rate: chosen,
            parcel,
            quantity,
            depotLabel,
            city: form.city || "customer",
            markupPercent: num(form.markup) || 0,
            sellExVat: form.sellExVat.trim() ? num(form.sellExVat) : null,
          },
          0,
        )
      : null;

  const request = (): LinerRatesRequest | null => {
    if (!area || !parcel || !gsmOk) return null;
    return {
      historyId,
      job,
      depot: form.depot === "pretoria" || form.depot === "bettys-bay" ? form.depot : "auto",
      parcel,
      quantity,
      shape: form.shape,
      inputs: { ...form, wallHeightUsed: wallHeight },
      areaM2: area.materialAreaM2,
      gsm,
      parcelSource: form.parcelSource,
      rfqId: linked?.rfqId ?? null,
      quoteId: linked?.quoteId ?? null,
    };
  };

  const getRates = () => {
    const req = request();
    if (!req) {
      setMessage({ ok: false, text: "Finish the liner size, fabric and parcel first." });
      return;
    }
    startTransition(async () => {
      const result = await courierRatesForParcelAction(req);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok && result.rates) {
        setRates(result.rates);
        setService(result.rates[0]?.serviceCode ?? "");
        setRateMeta({ depotLabel: result.depotLabel ?? depotLabel, collection: result.collection ?? "", ratedAt: result.ratedAt ?? "" });
        if (result.historyId) setHistoryId(result.historyId);
      }
    });
  };

  const saveDraft = () => {
    const req = request();
    if (!req) {
      setMessage({ ok: false, text: "Finish the liner size, fabric and parcel first." });
      return;
    }
    startTransition(async () => {
      const result = await saveLinerCourierDraftAction(req);
      setMessage({ ok: result.ok, text: result.message });
      if (result.historyId) setHistoryId(result.historyId);
    });
  };

  const brief = () =>
    area && parcel
      ? buildCourierQuoteBrief({
          areaM2: area.materialAreaM2,
          gsm,
          parcel,
          quantity,
          depotLabel,
          city: form.city,
          rate: chosen,
          job,
          collection: rateMeta?.collection || `${depotLabel} depot`,
        })
      : "";

  const formalQuote = (openPortal: boolean) => {
    const text = brief();
    if (!text) {
      setMessage({ ok: false, text: "Finish the liner and address first." });
      return;
    }
    // Open the tab straight from the click so the browser does not block it.
    if (openPortal) window.open(COURIER_PORTAL_URL, "_blank", "noopener");
    startTransition(async () => {
      const copied = await copy(text);
      const status = openPortal ? "portal_opened" : "brief_copied";
      const saved = historyId ? await recordFormalQuoteAction({ historyId, status, reference: form.reference }) : null;
      setMessage({
        ok: copied,
        text: `${copied ? "Quote brief copied." : "Could not copy: select the brief below and copy it."}${openPortal ? " The Courier Guy portal opened in a new tab: paste the brief there or into an email to your account manager." : ""}${saved ? ` ${saved.message}` : " (Get a rate first to keep this in history.)"}`,
      });
    });
  };

  const addToQuote = () => {
    if (!chosen || !parcel || !linked?.quoteId) return;
    if (!window.confirm(`Put ${chosen.serviceName} on quotation ${linked.number} as a delivery line? Any earlier courier line from this tool is replaced.`)) return;
    startTransition(async () => {
      const result = await addCourierToQuoteAction({
        quoteId: linked.quoteId!,
        historyId,
        rate: chosen,
        parcel,
        quantity,
        depotLabel,
        city: form.city || "customer",
        markupPercent: num(form.markup) || 0,
        sellExVat: form.sellExVat.trim() ? num(form.sellExVat) : null,
      });
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  const findLinked = () => {
    startTransition(async () => {
      const result = await findRfqOrQuoteAction(lookup);
      setFound(result.records ?? []);
      if (!result.ok) setMessage({ ok: false, text: result.message });
    });
  };

  const applyLinked = (record: LinkedRecord) => {
    setLinked(record);
    setFound([]);
    setForm((previous) => {
      const next = { ...previous };
      for (const [key, value] of Object.entries(record.prefill)) {
        if (typeof value !== "string" || !value) continue;
        if (key === "province" && !(SA_PROVINCES as readonly string[]).includes(value)) continue;
        if (key in next) (next as Record<string, unknown>)[key] = value;
      }
      return next;
    });
  };

  const reopen = (row: LinerCourierHistoryRow) => {
    const inputs = (row.inputs ?? {}) as Partial<Form>;
    const address = row.delivery_address ?? {};
    setForm({
      ...EMPTY,
      ...Object.fromEntries(Object.entries(inputs).filter(([key, value]) => key in EMPTY && typeof value === "string")),
      shape: row.shape,
      customerName: address.customerName ?? "",
      companyName: address.companyName ?? "",
      phone: address.phone ?? "",
      email: address.email ?? "",
      street: address.street ?? "",
      suburb: address.suburb ?? "",
      city: address.city ?? "",
      province: address.province ?? "Gauteng",
      postalCode: address.postalCode ?? "",
      reference: row.reference ?? "",
      notes: row.notes ?? "",
    } as Form);
    setHistoryId(row.id);
    setRates([]);
    setService("");
    setRateMeta(null);
    setLinked(
      row.quote_id || row.rfq_id
        ? {
            kind: row.quote_id ? "quote" : "rfq",
            id: row.quote_id ?? row.rfq_id ?? "",
            number: row.quotes?.quote_number ?? row.rfqs?.rfq_number ?? "linked",
            status: "",
            rfqId: row.rfq_id,
            quoteId: row.quote_id,
            editable: Boolean(row.quote_id),
            prefill: {},
          }
        : null,
    );
    setMessage({ ok: true, text: "Reopened. Rates are old, so get a fresh rate." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const field = (key: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <label key={key}>
      <span>{label}</span>
      <AdminInput value={String(form[key])} onChange={(event) => set(key, event.target.value as never)} {...props} />
    </label>
  );
  const metres = { type: "number", inputMode: "decimal", min: "0", step: "0.01" };

  return (
    <div className="lc-tool">
      <div className="lc-tool__main">
        <AdminPanel title="Link an enquiry or quotation" description="Optional. Fills in the customer and lets you put the rate straight on a draft quotation.">
          <div className="lc-row">
            <AdminInput
              value={lookup}
              placeholder="RFQ or quote number"
              onChange={(event) => setLookup(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  findLinked();
                }
              }}
              aria-label="RFQ or quote number"
            />
            <button type="button" className="admin-btn admin-btn--secondary" disabled={pending} onClick={findLinked}>
              Find
            </button>
          </div>
          {found.length > 0 ? (
            <ul className="lc-list">
              {found.map((record) => (
                <li key={`${record.kind}-${record.id}`}>
                  <span>
                    <strong>{record.kind === "quote" ? "Quotation" : "Enquiry"} {record.number}</strong>{" "}
                    <span className="admin-muted">
                      {record.status} · {record.prefill.customerName || record.prefill.companyName || "no name"}
                    </span>
                  </span>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => applyLinked(record)}>
                    Use
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {linked ? (
            <p className="lc-linked">
              Linked to {linked.kind === "quote" ? "quotation" : "enquiry"}{" "}
              <a href={linked.kind === "quote" ? `/admin/quotes/${linked.quoteId}/` : `/admin/rfqs/${linked.rfqId}/`}>{linked.number}</a>
              {linked.kind === "quote" && !linked.editable ? " (locked: create a revision to add lines)" : ""}{" "}
              <button type="button" className="admin-btn admin-btn--link" onClick={() => setLinked(null)}>
                Unlink
              </button>
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Liner">
          <div className="lc-segment" role="radiogroup" aria-label="Shape">
            {(["circular", "rectangular"] as const).map((shape) => (
              <label key={shape} className={form.shape === shape ? "is-active" : ""}>
                <input type="radio" name="shape" checked={form.shape === shape} onChange={() => set("shape", shape)} />
                {shape === "circular" ? "Circular (steel tank)" : "Rectangular (pond, trough, dam)"}
              </label>
            ))}
          </div>
          {form.shape === "circular" ? (
            <div className="ops-track-form">
              {field("diameter", "Diameter (m)", metres)}
              <label>
                <span>Wall height from</span>
                <AdminSelect value={form.heightMode} onChange={(event) => set("heightMode", event.target.value as Form["heightMode"])}>
                  <option value="rows">Tank rows (762 mm)</option>
                  <option value="height">Height in metres</option>
                </AdminSelect>
              </label>
              {form.heightMode === "rows" ? (
                <label>
                  <span>Rows</span>
                  <AdminSelect value={form.rows} onChange={(event) => set("rows", event.target.value)}>
                    {["2", "3", "4"].map((rows) => (
                      <option key={rows} value={rows}>
                        {rows} rows ({listedHeightForRows(Number(rows))} m listed)
                      </option>
                    ))}
                  </AdminSelect>
                </label>
              ) : (
                field("wallHeight", "Lined wall height (m)", metres)
              )}
              {field("foldOver", "Fold-over (m)", metres)}
              {field("waste", "Waste %", { type: "number", min: "0", step: "0.5" })}
              {form.heightMode === "rows" ? (
                <p className="ops-track-form__wide admin-help-text">
                  {form.rows} rows: lined wall {derivedHeight} m (each 762 mm row overlaps the one below by 50 mm), as the catalogue prices use.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="ops-track-form">
              {field("length", "Length (m)", metres)}
              {field("width", "Width (m)", metres)}
              {field("depth", "Depth / wall height (m)", metres)}
              {field("slope", "Side slope (z : 1, 0 = vertical)", { ...metres, step: "0.1" })}
              {field("foldOver", "Fold-over / upstand (m)", metres)}
              {field("anchor", "Anchor run-out (m)", metres)}
              {field("overlap", "Overlap %", { type: "number", min: "0", step: "0.5" })}
              {field("waste", "Waste %", { type: "number", min: "0", step: "0.5" })}
              <p className="ops-track-form__wide admin-help-text">
                Earth dams: use the side slope and an anchor run-out (the RFQ dam calculator uses 1.2 m). Ponds and troughs: vertical walls, fold-over only.
              </p>
            </div>
          )}
          <div className="ops-track-form">
            <label>
              <span>Fabric</span>
              <AdminSelect value={form.gsm} onChange={(event) => set("gsm", event.target.value)}>
                <option value="550">550 gsm PVC</option>
                <option value="800">800 gsm PVC</option>
                <option value="other">Other gsm</option>
              </AdminSelect>
            </label>
            {form.gsm === "other" ? field("customGsm", "gsm", { type: "number", min: "100", step: "10" }) : null}
            {field("colour", "Colour / note (parcel description)")}
            {field("quantity", "Quantity", { type: "number", min: "1", max: "20", step: "1" })}
          </div>
        </AdminPanel>

        <AdminPanel title="Deliver to">
          <div className="ops-track-form">
            {field("reference", "Reference (RFQ / quote / WhatsApp)")}
            {field("customerName", "Customer name", { required: true })}
            {field("companyName", "Company (optional)")}
            {field("phone", "Phone", { type: "tel", required: true })}
            {field("email", "Email", { type: "email" })}
            <label className="ops-track-form__wide">
              <span>Street address</span>
              <AdminInput value={form.street} onChange={(event) => set("street", event.target.value)} required />
            </label>
            {field("suburb", "Suburb")}
            {field("city", "City / town")}
            <label>
              <span>Province</span>
              <AdminSelect value={form.province} onChange={(event) => set("province", event.target.value)}>
                {SA_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </AdminSelect>
            </label>
            {field("postalCode", "Postal code", { inputMode: "numeric", maxLength: 4 })}
            <label>
              <span>Collect from</span>
              <AdminSelect value={form.depot} onChange={(event) => set("depot", event.target.value)}>
                <option value="auto">Nearest to the customer</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.label}
                  </option>
                ))}
              </AdminSelect>
            </label>
            {field("declaredValue", "Declared value (R)", { type: "number", min: "0", step: "1" })}
            {declared.capped ? (
              <p className="ops-track-form__wide admin-action-message admin-action-message--error" role="alert">
                The Courier Guy refuses a declared value above R30 000, so R30 000 is sent. Cover above that needs separate insurance.
              </p>
            ) : null}
            <label className="ops-track-form__wide">
              <span>Delivery notes</span>
              <AdminTextarea value={form.notes} rows={2} onChange={(event) => set("notes", event.target.value)} />
            </label>
          </div>
        </AdminPanel>
      </div>

      <div className="lc-tool__side">
        <AdminPanel title="Size and parcel">
          {!areaResult.ok ? (
            <p className="admin-action-message admin-action-message--error">{areaResult.error}</p>
          ) : !gsmOk ? (
            <p className="admin-action-message admin-action-message--error">Enter the fabric weight in gsm.</p>
          ) : area ? (
            <>
              <dl className="lc-facts">
                {area.parts.map((part) => (
                  <div key={part.label}>
                    <dt>{part.label}</dt>
                    <dd>{part.areaM2} m²</dd>
                  </div>
                ))}
                <div>
                  <dt>Installation area</dt>
                  <dd>{area.installationAreaM2} m²</dd>
                </div>
                <div className="lc-facts__strong">
                  <dt>Made-up liner area</dt>
                  <dd>{area.materialAreaM2} m²</dd>
                </div>
                <div className="lc-facts__strong">
                  <dt>Weight, each</dt>
                  <dd>{folded?.weightKg} kg</dd>
                </div>
              </dl>
              <p className="admin-help-text">
                {form.shape === "circular"
                  ? `Floor π·D²/4 + wall π·D·(H + fold-over), then +${area.wastePercentApplied}% waste once (the catalogue prices already use 5%, so it is not added twice). Weight = area × gsm ÷ 1000.`
                  : `Floor + four walls + fold-over/run-out round the top, then +${area.overlapPercentApplied}% overlap and +${area.wastePercentApplied}% waste. Weight = area × gsm ÷ 1000.`}
              </p>

              <fieldset className="lc-parcel">
                <legend>Parcel to quote</legend>
                <label>
                  <input type="radio" checked={form.parcelSource === "folded"} onChange={() => set("parcelSource", "folded")} />
                  <span>
                    <strong>Folded</strong> {folded ? `${folded.lengthCm} × ${folded.widthCm} × ${folded.heightCm} cm` : "—"}
                  </span>
                </label>
                <label>
                  <input type="radio" checked={form.parcelSource === "catalogue_rule"} onChange={() => set("parcelSource", "catalogue_rule")} />
                  <span>
                    <strong>Online-checkout rule</strong> {rule ? `${rule.lengthCm} × ${rule.widthCm} × ${rule.heightCm} cm` : "—"}
                  </span>
                </label>
                <label>
                  <input type="radio" checked={form.parcelSource === "manual"} onChange={() => set("parcelSource", "manual")} />
                  <span>
                    <strong>My own size</strong>
                  </span>
                </label>
              </fieldset>
              {folded && form.parcelSource === "folded" ? (
                <>
                  <p className="admin-help-text">{folded.note}</p>
                  <div className="ops-track-form">
                    {field("maxEdge", "Longest side max (cm)", { type: "number", min: "30", step: "5" })}
                    {field("bulk", "Looseness (× solid)", { type: "number", min: "1", step: "0.1" })}
                  </div>
                </>
              ) : null}
              {form.parcelSource === "manual" ? (
                <div className="ops-track-form">
                  {field("manualL", "Length (cm)", { type: "number", min: "1", step: "1", placeholder: String(folded?.lengthCm ?? "") })}
                  {field("manualW", "Width (cm)", { type: "number", min: "1", step: "1", placeholder: String(folded?.widthCm ?? "") })}
                  {field("manualH", "Height (cm)", { type: "number", min: "1", step: "1", placeholder: String(folded?.heightCm ?? "") })}
                  {field("manualKg", "Weight (kg)", { type: "number", min: "0.1", step: "0.1", placeholder: String(folded?.weightKg ?? "") })}
                </div>
              ) : null}
              {parcel ? (
                <dl className="lc-facts">
                  <div>
                    <dt>Parcels</dt>
                    <dd>
                      {quantity} × {parcel.lengthCm}×{parcel.widthCm}×{parcel.heightCm} cm
                    </dd>
                  </div>
                  <div>
                    <dt>Volumetric weight, each (÷5000)</dt>
                    <dd>{volumetricWeightKg(parcel)} kg</dd>
                  </div>
                  <div>
                    <dt>Collect from</dt>
                    <dd>{depotLabel}</dd>
                  </div>
                </dl>
              ) : (
                <p className="admin-empty__hint">Enter all four parcel figures.</p>
              )}
              {summary ? (
                <div className="lc-summary">
                  <p>{summary}</p>
                  <div className="lc-row">
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={async () => setMessage({ ok: await copy(summary), text: "Summary copied." })}
                    >
                      Copy summary
                    </button>
                    {form.phone ? (
                      <a className="admin-btn admin-btn--ghost" href={whatsAppLink(form.phone, summary)} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Courier Guy rate">
          <div className="lc-row">
            <button type="button" className="admin-btn admin-btn--primary" disabled={pending || !courierReady || !parcel} onClick={getRates}>
              {pending ? "Working…" : "Get Courier Guy rate"}
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" disabled={pending || !parcel} onClick={saveDraft}>
              Save draft
            </button>
          </div>
          {message ? (
            <p className={`admin-action-message admin-action-message--${message.ok ? "success" : "error"}`} role={message.ok ? "status" : "alert"}>
              {message.text}
            </p>
          ) : null}
          {rates.length > 0 ? (
            <fieldset className="ops-courier__rates">
              <legend>Services (nothing booked)</legend>
              {rates.map((rate) => {
                const ex = rateExVat(rate);
                return (
                  <label key={rate.serviceCode}>
                    <input type="radio" name="lc_service" checked={service === rate.serviceCode} onChange={() => setService(rate.serviceCode)} />
                    <span>
                      <strong>{rate.serviceName}</strong> ({rate.serviceCode})
                      {rate.deliveryTo ? ` · by ${formatDay(rate.deliveryTo)}` : ""}
                      <br />
                      <span className="admin-muted">
                        {formatRand(ex.exVat)} excl. VAT{ex.stated ? "" : " (worked out at 15%)"}
                      </span>
                    </span>
                    <span className="ops-courier__price">{formatRand(rate.rate)}</span>
                  </label>
                );
              })}
            </fieldset>
          ) : null}
        </AdminPanel>

        <AdminPanel
          title="Formal Courier Guy quote"
          description="The Courier Guy API has rates and bookings but no quote request we could confirm, so this does not send anything to them. Copy the brief, then paste it into the portal or an email to your account manager."
        >
          <div className="lc-row">
            <button type="button" className="admin-btn admin-btn--secondary" disabled={pending || !parcel} onClick={() => formalQuote(false)}>
              Copy quote brief
            </button>
            <button type="button" className="admin-btn admin-btn--secondary" disabled={pending || !parcel} onClick={() => formalQuote(true)}>
              Open portal with brief
            </button>
          </div>
          {parcel && area ? <pre className="lc-brief">{brief()}</pre> : null}
        </AdminPanel>

        <AdminPanel title="Add transport to quotation">
          <div className="ops-track-form">
            {field("markup", "Markup on cost %", { type: "number", min: "0", step: "1" })}
            {field("sellExVat", "Or sell excl. VAT (R)", { type: "number", min: "0", step: "0.01" })}
          </div>
          {quoteLine ? (
            <dl className="lc-facts">
              <div>
                <dt>Cost (courier, excl. VAT)</dt>
                <dd>{formatRand(quoteLine.costUnitPrice ?? 0)}</dd>
              </div>
              <div className="lc-facts__strong">
                <dt>Sell excl. VAT</dt>
                <dd>{formatRand(quoteLine.sellUnitPrice)}</dd>
              </div>
            </dl>
          ) : (
            <p className="admin-empty__hint">Get a rate and choose a service first.</p>
          )}
          <div className="lc-row">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={pending || !quoteLine || !linked?.quoteId || !linked.editable || !canEditQuotes}
              onClick={addToQuote}
            >
              Add to quotation{linked?.kind === "quote" ? ` ${linked.number}` : ""}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={!quoteLine}
              onClick={async () => quoteLine && setMessage({ ok: await copy(quoteLineCopyText(quoteLine)), text: "Amount and description copied." })}
            >
              Copy amount + description
            </button>
          </div>
          {!linked?.quoteId ? (
            <p className="admin-help-text">No quotation linked: link one above to add a delivery line, or copy the amount for WhatsApp.</p>
          ) : null}
        </AdminPanel>
      </div>

      <AdminPanel title="Recent liner courier quotes" className="lc-tool__history">
        {history.length === 0 ? (
          <p className="admin-empty__hint">None yet. Each rate you get is kept here.</p>
        ) : (
          <div className="admin-table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Liner</th>
                  <th>Parcel</th>
                  <th>Rate</th>
                  <th>Formal quote</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const cheapest = row.courier_rates?.[0];
                  return (
                    <tr key={row.id}>
                      <td>{new Date(row.updated_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" })}</td>
                      <td>
                        {row.quote_id ? <a href={`/admin/quotes/${row.quote_id}/`}>{row.quotes?.quote_number ?? row.reference ?? "Quote"}</a> : row.rfq_id ? <a href={`/admin/rfqs/${row.rfq_id}/`}>{row.rfqs?.rfq_number ?? row.reference ?? "RFQ"}</a> : row.reference ?? "—"}
                      </td>
                      <td>{row.customer_name ?? "—"} <span className="admin-muted">{row.delivery_address?.city ?? ""}</span></td>
                      <td>
                        {row.quantity > 1 ? `${row.quantity} × ` : ""}
                        {row.gsm} gsm, {Number(row.area_m2)} m² ({row.shape})
                      </td>
                      <td>
                        {Number(row.parcel_length_cm)}×{Number(row.parcel_width_cm)}×{Number(row.parcel_height_cm)} cm, {Number(row.weight_kg)} kg
                      </td>
                      <td>
                        {row.chosen_amount != null
                          ? `${row.chosen_service_name}: ${formatRand(Number(row.chosen_amount))}`
                          : cheapest
                            ? `${cheapest.serviceName}: ${formatRand(cheapest.rate)}`
                            : "—"}
                      </td>
                      <td>{row.formal_quote_status === "none" ? "—" : row.formal_quote_status.replace(/_/g, " ")}</td>
                      <td>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => reopen(row)}>
                          Reopen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
