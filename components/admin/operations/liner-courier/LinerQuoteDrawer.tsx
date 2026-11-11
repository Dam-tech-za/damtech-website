"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { AdminTextarea } from "@/components/admin/ui/AdminTextarea";
import { IconMore, ToolbarPopover } from "@/components/admin/board/BoardKit";
import {
  catalogueRuleParcel,
  circularLinerArea,
  DEFAULT_BULK_FACTOR,
  DEFAULT_MAX_EDGE_CM,
  foldLinerParcel,
  linedWallHeightForRows,
  rectangularLinerArea,
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

export type DrawerTarget = { kind: "new" } | { kind: "row"; row: LinerCourierHistoryRow };

type Props = {
  target: DrawerTarget | null;
  depots: { id: string; label: string }[];
  courierReady: boolean;
  canEditQuotes: boolean;
  onClose: () => void;
};

/** Every input as text, so fields stay editable while half-typed. */
type Form = {
  shape: "circular" | "rectangular";
  diameter: string;
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
};

const EMPTY: Form = {
  shape: "circular",
  diameter: "",
  rows: "3",
  wallHeight: "",
  foldOver: "0.30",
  waste: "5",
  length: "",
  width: "",
  depth: "",
  slope: "0",
  anchor: "0",
  overlap: "5",
  gsm: "550",
  customGsm: "",
  colour: "",
  quantity: "1",
  parcelSource: "folded",
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
};

const num = (value: string) => Number(String(value).replace(",", "."));
const DEPOT_NAMES: Record<string, string> = { pretoria: "Pretoria", "bettys-bay": "Betty's Bay" };
// Fields that do not change the courier's answer, so rates stay on screen.
const KEEP_RATES: (keyof Form)[] = ["markup", "reference", "notes", "colour", "email", "companyName"];

function formFromRow(row: LinerCourierHistoryRow): Form {
  const inputs = (row.inputs ?? {}) as Record<string, unknown>;
  const address = row.delivery_address ?? {};
  const fromInputs = Object.fromEntries(
    Object.entries(inputs).filter(([key, value]) => key in EMPTY && typeof value === "string"),
  ) as Partial<Form>;
  // Earlier saves used a separate "height mode"; a typed height means custom rows.
  if (inputs.heightMode === "height") fromInputs.rows = "custom";
  return {
    ...EMPTY,
    ...fromInputs,
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
  };
}

function linkFromRow(row: LinerCourierHistoryRow): LinkedRecord | null {
  if (!row.quote_id && !row.rfq_id) return null;
  return {
    kind: row.quote_id ? "quote" : "rfq",
    id: row.quote_id ?? row.rfq_id ?? "",
    number: row.quotes?.quote_number ?? row.rfqs?.rfq_number ?? "linked",
    status: "",
    rfqId: row.rfq_id,
    quoteId: row.quote_id,
    editable: Boolean(row.quote_id),
    prefill: {},
  };
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function formatDay(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`ops-peek-form__field${wide ? " lc-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function LinerQuoteForm({ initial, depots, courierReady, canEditQuotes }: { initial: LinerCourierHistoryRow | null } & Omit<Props, "target" | "onClose">) {
  const [form, setForm] = useState<Form>(() => (initial ? formFromRow(initial) : EMPTY));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    initial ? { ok: true, text: "Reopened. Get a fresh rate before you use it." } : null,
  );
  const [rates, setRates] = useState<CourierRate[]>([]);
  const [rateMeta, setRateMeta] = useState<{ depotLabel: string; collection: string } | null>(null);
  const [service, setService] = useState("");
  const [historyId, setHistoryId] = useState<string | null>(initial?.id ?? null);
  const [linked, setLinked] = useState<LinkedRecord | null>(initial ? linkFromRow(initial) : null);
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<LinkedRecord[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const moreBtn = useRef<HTMLButtonElement>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (!KEEP_RATES.includes(key)) {
      setRates([]);
      setService("");
    }
  };
  const input = (key: keyof Form, props: Record<string, unknown> = {}) => (
    <AdminInput value={String(form[key])} onChange={(event) => set(key, event.target.value as never)} {...props} />
  );
  const metres = { type: "number", inputMode: "decimal", min: "0", step: "0.01" };
  const percent = { type: "number", inputMode: "decimal", min: "0", step: "0.5" };

  const gsm = form.gsm === "other" ? num(form.customGsm) : num(form.gsm);
  const gsmOk = Number.isFinite(gsm) && gsm >= 100 && gsm <= 3000;
  const quantity = Math.min(20, Math.max(1, Math.floor(num(form.quantity)) || 1));
  const wallHeight = form.rows === "custom" ? num(form.wallHeight) : linedWallHeightForRows(num(form.rows) || 0);
  const hasSize = form.shape === "circular" ? Boolean(form.diameter.trim()) : Boolean(form.length.trim() && form.width.trim() && form.depth.trim());

  const areaResult = useMemo(
    () =>
      form.shape === "circular"
        ? circularLinerArea({ diameterM: num(form.diameter), wallHeightM: wallHeight, foldOverM: num(form.foldOver), wastePercent: num(form.waste) })
        : rectangularLinerArea({
            lengthM: num(form.length),
            widthM: num(form.width),
            depthM: num(form.depth),
            sideSlopeZH: num(form.slope),
            foldOverM: num(form.foldOver),
            anchorRunoutM: num(form.anchor),
            overlapPercent: num(form.overlap),
            wastePercent: num(form.waste),
          }),
    [form.shape, form.diameter, wallHeight, form.foldOver, form.waste, form.length, form.width, form.depth, form.slope, form.anchor, form.overlap],
  );
  const area = areaResult.ok ? areaResult.area : null;
  const folded = useMemo(
    () =>
      area && gsmOk
        ? foldLinerParcel(
            { flatLengthM: area.flatLengthM, flatWidthM: area.flatWidthM, areaM2: area.materialAreaM2, gsm },
            { maxEdgeCm: DEFAULT_MAX_EDGE_CM, bulkFactor: DEFAULT_BULK_FACTOR },
          )
        : null,
    [area, gsm, gsmOk],
  );
  const rule = area && gsmOk ? catalogueRuleParcel(area.materialAreaM2, gsm) : null;
  const manual = { lengthCm: num(form.manualL), widthCm: num(form.manualW), heightCm: num(form.manualH), weightKg: num(form.manualKg) };
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
  const autoDepot = form.province === "Western Cape" && depots.some((d) => d.id === "bettys-bay") ? "Betty's Bay" : "Pretoria";
  const depotLabel = rateMeta?.depotLabel ?? (form.depot === "auto" ? autoDepot : (DEPOT_NAMES[form.depot] ?? form.depot));
  const city = form.city || "customer";
  const summary = area && parcel ? buildWhatsAppSummary({ areaM2: area.materialAreaM2, gsm, parcel, quantity, depotLabel, city, rate: chosen }) : "";
  const quoteLine =
    chosen && parcel
      ? buildCourierQuoteLine({ rate: chosen, parcel, quantity, depotLabel, city, markupPercent: num(form.markup) || 0 }, 0)
      : null;

  const request = (): LinerRatesRequest | null =>
    area && parcel && gsmOk
      ? {
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
        }
      : null;

  const notReady = () => setMessage({ ok: false, text: "Fill in the liner size first." });

  const getRates = () => {
    const req = request();
    if (!req) return notReady();
    startTransition(async () => {
      const result = await courierRatesForParcelAction(req);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok && result.rates) {
        setRates(result.rates);
        setService(result.rates[0]?.serviceCode ?? "");
        setRateMeta({ depotLabel: result.depotLabel ?? depotLabel, collection: result.collection ?? "" });
        if (result.historyId) setHistoryId(result.historyId);
      }
    });
  };

  const saveDraft = () => {
    const req = request();
    if (!req) return notReady();
    startTransition(async () => {
      const result = await saveLinerCourierDraftAction(req);
      setMessage({ ok: result.ok, text: result.message });
      if (result.historyId) setHistoryId(result.historyId);
    });
  };

  const formalQuote = (openPortal: boolean) => {
    if (!area || !parcel) return notReady();
    const text = buildCourierQuoteBrief({
      areaM2: area.materialAreaM2,
      gsm,
      parcel,
      quantity,
      depotLabel,
      city: form.city,
      rate: chosen,
      job,
      collection: rateMeta?.collection || `${depotLabel} depot`,
    });
    // Open the tab straight from the click so the browser does not block it.
    if (openPortal) window.open(COURIER_PORTAL_URL, "_blank", "noopener");
    startTransition(async () => {
      const copied = await copy(text);
      const saved = historyId
        ? await recordFormalQuoteAction({ historyId, status: openPortal ? "portal_opened" : "brief_copied", reference: form.reference })
        : null;
      setMessage({
        ok: copied,
        text: copied
          ? `Quote brief copied${openPortal ? ". Paste it into the Courier Guy portal or an email to your account manager" : ""}.${saved?.ok ? "" : " Get a rate first to keep this on the board."}`
          : "Could not copy to the clipboard.",
      });
    });
  };

  const addToQuote = () => {
    if (!chosen || !parcel || !linked?.quoteId) return;
    if (!window.confirm(`Put ${chosen.serviceName} on quotation ${linked.number} as a delivery line? An earlier courier line from this tool is replaced.`)) return;
    startTransition(async () => {
      const result = await addCourierToQuoteAction({
        quoteId: linked.quoteId!,
        historyId,
        rate: chosen,
        parcel,
        quantity,
        depotLabel,
        city,
        markupPercent: num(form.markup) || 0,
      });
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  const findLinked = () =>
    startTransition(async () => {
      const result = await findRfqOrQuoteAction(lookup);
      setFound(result.records ?? []);
      if (!result.ok) setMessage({ ok: false, text: result.message });
    });

  const applyLinked = (record: LinkedRecord) => {
    setLinked(record);
    setFound([]);
    setLookup("");
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

  const menu = (label: string, run: () => void, disabled = false) => (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setMenuOpen(false);
          run();
        }}
      >
        {label}
      </button>
    </li>
  );

  return (
    <div className="lc-form">
      {/* Liner */}
      <div className="lc-segment" role="radiogroup" aria-label="Shape">
        {(["circular", "rectangular"] as const).map((shape) => (
          <button key={shape} type="button" role="radio" aria-checked={form.shape === shape} className={form.shape === shape ? "is-active" : ""} onClick={() => set("shape", shape)}>
            {shape === "circular" ? "Round tank" : "Rectangular"}
          </button>
        ))}
      </div>

      <div className="lc-grid lc-grid--size">
        {form.shape === "circular" ? (
          <>
            <Field label="Diameter (m)">{input("diameter", { ...metres, autoFocus: !initial, placeholder: "5" })}</Field>
            <Field label="Height">
              <AdminSelect value={form.rows} onChange={(event) => set("rows", event.target.value)}>
                <option value="2">2 rows</option>
                <option value="3">3 rows</option>
                <option value="4">4 rows</option>
                <option value="custom">Other (m)</option>
              </AdminSelect>
            </Field>
            {form.rows === "custom" ? <Field label="Wall height (m)">{input("wallHeight", metres)}</Field> : null}
          </>
        ) : (
          <>
            <Field label="Length (m)">{input("length", { ...metres, autoFocus: !initial })}</Field>
            <Field label="Width (m)">{input("width", metres)}</Field>
            <Field label="Depth (m)">{input("depth", metres)}</Field>
          </>
        )}
        <Field label="Fabric gsm">
          <AdminSelect value={form.gsm} onChange={(event) => set("gsm", event.target.value)}>
            <option value="550">550</option>
            <option value="800">800</option>
            <option value="other">Other</option>
          </AdminSelect>
        </Field>
        {form.gsm === "other" ? <Field label="gsm">{input("customGsm", { type: "number", min: "100", step: "10" })}</Field> : null}
        <Field label="Qty">{input("quantity", { type: "number", min: "1", max: "20", step: "1" })}</Field>
      </div>

      <details className="lc-more">
        <summary>
          Allowances · fold-over {form.foldOver || "0"} m · waste {form.waste || "0"}%
          {form.shape === "rectangular" ? ` · overlap ${form.overlap || "0"}%` : ""}
        </summary>
        <div className="lc-grid">
          <Field label="Fold-over (m)">{input("foldOver", metres)}</Field>
          <Field label="Waste %">{input("waste", percent)}</Field>
          {form.shape === "rectangular" ? (
            <>
              <Field label="Overlap %">{input("overlap", percent)}</Field>
              <Field label="Side slope (z:1)">{input("slope", { ...metres, step: "0.1" })}</Field>
              <Field label="Anchor run-out (m)">{input("anchor", metres)}</Field>
            </>
          ) : null}
          <Field label="Colour / note">{input("colour")}</Field>
        </div>
      </details>

      {/* Result */}
      <section className="ops-peek-value lc-result" aria-label="Liner and parcel">
        {!hasSize ? (
          <p className="ops-peek-muted">Enter the size to see the area, weight and parcel.</p>
        ) : !areaResult.ok ? (
          <p className="ops-peek-warn">{areaResult.error}</p>
        ) : !gsmOk ? (
          <p className="ops-peek-warn">Enter the fabric gsm.</p>
        ) : area && folded ? (
          <div className="lc-result__body">
            <p className="ops-peek-value__amount">
              {area.materialAreaM2} m² <span className="lc-result__sep">·</span> {folded.weightKg} kg
            </p>
            <div className="lc-result__parcel">
              {parcel ? (
                <span>
                  {quantity > 1 ? `${quantity} × ` : ""}
                  {parcel.lengthCm} × {parcel.widthCm} × {parcel.heightCm} cm
                </span>
              ) : (
                <span className="ops-peek-muted">Enter the parcel size</span>
              )}
              <AdminSelect aria-label="Parcel size from" value={form.parcelSource} onChange={(event) => set("parcelSource", event.target.value as ParcelSource)}>
                <option value="folded">Folded</option>
                <option value="catalogue_rule">Checkout rule</option>
                <option value="manual">Own size</option>
              </AdminSelect>
            </div>
            {form.parcelSource === "manual" ? (
              <div className="lc-grid lc-grid--4">
                <Field label="L cm">{input("manualL", { type: "number", min: "1", placeholder: String(folded.lengthCm) })}</Field>
                <Field label="W cm">{input("manualW", { type: "number", min: "1", placeholder: String(folded.widthCm) })}</Field>
                <Field label="H cm">{input("manualH", { type: "number", min: "1", placeholder: String(folded.heightCm) })}</Field>
                <Field label="kg">{input("manualKg", { type: "number", min: "0.1", step: "0.1", placeholder: String(folded.weightKg) })}</Field>
              </div>
            ) : null}
            <p className="ops-peek-value__note" title={folded.note}>
              Made-up area incl. fold-over and {area.wastePercentApplied}% waste · from {depotLabel}
            </p>
          </div>
        ) : null}
      </section>

      {/* Deliver to */}
      <p className="ops-peek-next__label">Deliver to</p>
      {linked ? (
        <p className="lc-linked">
          <span className="ops-peek-chip ops-tone-blue">{linked.kind === "quote" ? "Quote" : "RFQ"} {linked.number}</span>
          {linked.kind === "quote" && !linked.editable ? <span className="ops-peek-muted">locked</span> : null}
          <button type="button" className="ops-toolbar__text-btn" onClick={() => setLinked(null)}>
            Unlink
          </button>
        </p>
      ) : (
        <div className="lc-find">
          <AdminInput
            value={lookup}
            placeholder="Fill from RFQ or quote number (optional)"
            aria-label="RFQ or quote number"
            onChange={(event) => setLookup(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                findLinked();
              }
            }}
          />
          <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" disabled={pending || lookup.trim().length < 3} onClick={findLinked}>
            Find
          </button>
        </div>
      )}
      {found.length > 0 ? (
        <ul className="ops-peek-docs">
          {found.map((record) => (
            <li key={`${record.kind}-${record.id}`}>
              <span>
                {record.kind === "quote" ? "Quote" : "RFQ"} {record.number}{" "}
                <span className="ops-peek-muted">{record.prefill.customerName || record.prefill.companyName}</span>
              </span>
              <button type="button" className="ops-toolbar__text-btn" onClick={() => applyLinked(record)}>
                Use
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="lc-grid lc-grid--2">
        <Field label="Name">{input("customerName")}</Field>
        <Field label="Phone">{input("phone", { type: "tel" })}</Field>
        <Field label="Street address" wide>
          {input("street")}
        </Field>
        <Field label="Suburb">{input("suburb")}</Field>
        <Field label="Town">{input("city")}</Field>
        <Field label="Province">
          <AdminSelect value={form.province} onChange={(event) => set("province", event.target.value)}>
            {SA_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </AdminSelect>
        </Field>
        <Field label="Postal code">{input("postalCode", { inputMode: "numeric", maxLength: 4 })}</Field>
      </div>

      <details className="lc-more">
        <summary>More · email, collect from, declared value, notes</summary>
        <div className="lc-grid lc-grid--2">
          <Field label="Email">{input("email", { type: "email" })}</Field>
          <Field label="Company">{input("companyName")}</Field>
          <Field label="Reference">{input("reference", { placeholder: "RFQ, quote or WhatsApp" })}</Field>
          <Field label="Collect from">
            <AdminSelect value={form.depot} onChange={(event) => set("depot", event.target.value)}>
              <option value="auto">Nearest ({autoDepot})</option>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.label}
                </option>
              ))}
            </AdminSelect>
          </Field>
          <Field label="Declared value (R)">{input("declaredValue", { type: "number", min: "0", step: "1" })}</Field>
          <Field label="Delivery notes" wide>
            <AdminTextarea value={form.notes} rows={2} onChange={(event) => set("notes", event.target.value)} />
          </Field>
        </div>
        {declared.capped ? <p className="ops-peek-warn">Courier Guy takes at most R30 000 declared value, so R30 000 is sent.</p> : null}
      </details>

      {/* Rate */}
      <div className="lc-actions">
        <button type="button" className="admin-btn admin-btn--primary" disabled={pending || !courierReady || !parcel} onClick={getRates}>
          {pending ? "Working…" : rates.length ? "Re-rate" : "Get Courier Guy rate"}
        </button>
        <button
          ref={moreBtn}
          type="button"
          className="ops-toolbar__btn ops-toolbar__btn--icon"
          aria-label="More actions"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <IconMore />
        </button>
        <ToolbarPopover open={menuOpen} anchorRef={moreBtn} onClose={() => setMenuOpen(false)} width={240}>
          <ul className="ops-toolbar__menu-list">
            {menu("Copy Courier Guy quote brief", () => formalQuote(false), !parcel)}
            {menu("Open Courier Guy portal with brief", () => formalQuote(true), !parcel)}
            {menu("Save as draft", saveDraft, !parcel)}
          </ul>
        </ToolbarPopover>
      </div>
      {!courierReady ? <p className="ops-peek-warn">The Courier Guy is not set up, so rates are off.</p> : null}
      {message ? (
        <p className={message.ok ? "ops-peek-muted" : "ops-peek-warn"} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      ) : null}

      {rates.length > 0 ? (
        <fieldset className="ops-courier__rates">
          <legend className="ops-peek-next__label">Choose a service · nothing is booked</legend>
          {rates.map((rate) => (
            <label key={rate.serviceCode}>
              <input type="radio" name="lc_service" checked={service === rate.serviceCode} onChange={() => setService(rate.serviceCode)} />
              <span>
                {rate.serviceName}
                {rate.deliveryTo ? <span className="ops-peek-muted"> · by {formatDay(rate.deliveryTo)}</span> : null}
              </span>
              <span className="ops-courier__price">{formatRand(rate.rate)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {quoteLine && chosen ? (
        <section className="lc-quote">
          <div className="lc-quote__price">
            <span className="ops-peek-muted">Cost {formatRand(rateExVat(chosen).exVat)} excl. VAT +</span>
            <AdminInput aria-label="Markup %" className="lc-quote__markup" value={form.markup} type="number" min="0" step="1" onChange={(event) => set("markup", event.target.value)} />
            <span className="ops-peek-muted">% =</span>
            <strong>{formatRand(quoteLine.sellUnitPrice)}</strong>
          </div>
          <div className="lc-actions">
            {linked?.quoteId ? (
              <button type="button" className="admin-btn admin-btn--primary" disabled={pending || !linked.editable || !canEditQuotes} onClick={addToQuote}>
                Add to quote {linked.number}
              </button>
            ) : null}
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={async () => setMessage({ ok: await copy(`${summary}\n${quoteLineCopyText(quoteLine)}`), text: "Copied for WhatsApp." })}
            >
              Copy for WhatsApp
            </button>
            {form.phone ? (
              <a className="ops-toolbar__text-btn" href={whatsAppLink(form.phone, summary)} target="_blank" rel="noopener noreferrer">
                Open WhatsApp
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function LinerQuoteDrawer({ target, onClose, ...rest }: Props) {
  const row = target?.kind === "row" ? target.row : null;
  const title = row ? `${row.reference || row.customer_name || "Courier quote"}` : "New courier quote";
  return (
    <AdminDrawer open={Boolean(target)} title={title} onClose={onClose}>
      {target ? <LinerQuoteForm key={row?.id ?? "new"} initial={row} {...rest} /> : null}
    </AdminDrawer>
  );
}
