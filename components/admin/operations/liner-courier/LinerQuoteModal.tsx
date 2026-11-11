"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { AdminDialog } from "@/components/admin/ui/AdminDialog";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { AdminTextarea } from "@/components/admin/ui/AdminTextarea";
import { useScrollEdges } from "@/components/admin/ui/use-scroll-edges";
import {
  catalogueRuleParcel,
  circularLinerArea,
  foldLinerParcel,
  linedWallHeightForRows,
  rectangularLinerArea,
} from "@/lib/courier/liner-pack";
import { declaredValueFor, SA_PROVINCES, type LinerCourierJob } from "@/lib/courier/liner-quote";
import type { LinerCourierHistoryRow } from "@/lib/courier/liner-board";
import {
  courierRatesForParcelAction,
  findRfqOrQuoteAction,
  saveLinerCourierDraftAction,
  type LinkedRecord,
  type LinerRatesRequest,
  type ParcelSource,
} from "@/app/admin/operations/liner-courier/actions";

type Props = {
  /** null: closed. "new": blank form. A row: edit and re-rate it. */
  target: "new" | LinerCourierHistoryRow | null;
  depots: { id: string; label: string }[];
  courierReady: boolean;
  onClose: () => void;
  /** Called with the saved quote once it is rated or saved, to show it in the side panel. */
  onDone: (row: LinerCourierHistoryRow) => void;
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
};

const num = (value: string) => Number(String(value).replace(",", "."));

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
    declaredValue: row.declared_value ? String(row.declared_value) : "",
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

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`ops-peek-form__field${wide ? " lc-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function QuoteForm({ initial, depots, courierReady, onClose, onDone }: Omit<Props, "target"> & { initial: LinerCourierHistoryRow | null }) {
  const [form, setForm] = useState<Form>(() => (initial ? formFromRow(initial) : EMPTY));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<LinkedRecord | null>(initial ? linkFromRow(initial) : null);
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<LinkedRecord[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef, true);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((previous) => ({ ...previous, [key]: value }));
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
    () => (area && gsmOk ? foldLinerParcel({ flatLengthM: area.flatLengthM, flatWidthM: area.flatWidthM, areaM2: area.materialAreaM2, gsm }) : null),
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
  const autoDepot = form.province === "Western Cape" && depots.some((d) => d.id === "bettys-bay") ? "Betty's Bay" : "Pretoria";

  const request = (): LinerRatesRequest | null =>
    area && parcel && gsmOk
      ? {
          historyId: initial?.id ?? null,
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

  /** The saved quote as the board shows it, so the side panel opens at once. */
  const asRow = (req: LinerRatesRequest, id: string, extra: Partial<LinerCourierHistoryRow>): LinerCourierHistoryRow => {
    const now = new Date().toISOString();
    return {
      id,
      created_at: initial?.created_at ?? now,
      updated_at: now,
      reference: form.reference || null,
      customer_name: form.customerName || null,
      shape: form.shape,
      inputs: req.inputs,
      area_m2: req.areaM2,
      gsm,
      quantity,
      weight_kg: req.parcel.weightKg,
      parcel_length_cm: req.parcel.lengthCm,
      parcel_width_cm: req.parcel.widthCm,
      parcel_height_cm: req.parcel.heightCm,
      parcel_source: form.parcelSource,
      depot: form.depot === "auto" ? (autoDepot === "Betty's Bay" ? "bettys-bay" : "pretoria") : form.depot,
      delivery_address: {
        customerName: form.customerName,
        companyName: form.companyName,
        phone: form.phone,
        email: form.email,
        street: form.street,
        suburb: form.suburb,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
      },
      declared_value: declared.value || null,
      courier_rates: initial?.courier_rates ?? null,
      rated_at: initial?.rated_at ?? null,
      chosen_service_name: initial?.chosen_service_name ?? null,
      chosen_amount: initial?.chosen_amount ?? null,
      formal_quote_status: initial?.formal_quote_status ?? "none",
      rfq_id: linked?.rfqId ?? null,
      quote_id: linked?.quoteId ?? null,
      notes: form.notes || null,
      quotes: linked?.kind === "quote" ? { quote_number: linked.number } : null,
      rfqs: linked?.kind === "rfq" ? { rfq_number: linked.number } : null,
      ...extra,
    };
  };

  const getRates = () => {
    const req = request();
    if (!req) return setError("Fill in the liner size and fabric first.");
    startTransition(async () => {
      const result = await courierRatesForParcelAction(req);
      if (!result.ok || !result.rates) return setError(result.message);
      setError(null);
      onDone(
        asRow(req, result.historyId ?? `unsaved-${Date.now()}`, {
          courier_rates: result.rates,
          rated_at: result.ratedAt ?? new Date().toISOString(),
          depot: result.depot ?? req.depot,
        }),
      );
    });
  };

  const saveDraft = () => {
    const req = request();
    if (!req) return setError("Fill in the liner size and fabric first.");
    startTransition(async () => {
      const result = await saveLinerCourierDraftAction(req);
      if (!result.ok || !result.historyId) return setError(result.message);
      setError(null);
      onDone(asRow(req, result.historyId, {}));
    });
  };

  const findLinked = () =>
    startTransition(async () => {
      const result = await findRfqOrQuoteAction(lookup);
      setFound(result.records ?? []);
      setError(result.ok ? null : result.message);
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

  return (
    <>
      <div ref={scrollRef} className="lc-modal">
        {/* Liner */}
        <section className="lc-col" aria-label="Liner">
          <p className="ops-peek-next__label">Liner</p>
          <div className="lc-segment" role="radiogroup" aria-label="Shape">
            {(["circular", "rectangular"] as const).map((shape) => (
              <button key={shape} type="button" role="radio" aria-checked={form.shape === shape} className={form.shape === shape ? "is-active" : ""} onClick={() => set("shape", shape)}>
                {shape === "circular" ? "Round tank" : "Rectangular"}
              </button>
            ))}
          </div>
          <div className="lc-grid lc-grid--2">
            {form.shape === "circular" ? (
              <>
                <Field label="Diameter (m)">{input("diameter", { ...metres, autoFocus: !initial, placeholder: "5" })}</Field>
                <Field label="Height">
                  <AdminSelect value={form.rows} onChange={(event) => set("rows", event.target.value)}>
                    <option value="2">2 rows</option>
                    <option value="3">3 rows</option>
                    <option value="4">4 rows</option>
                    <option value="custom">Other height</option>
                  </AdminSelect>
                </Field>
                {form.rows === "custom" ? <Field label="Wall height (m)">{input("wallHeight", metres)}</Field> : null}
              </>
            ) : (
              <>
                <Field label="Length (m)">{input("length", { ...metres, autoFocus: !initial })}</Field>
                <Field label="Width (m)">{input("width", metres)}</Field>
                <Field label="Depth (m)">{input("depth", metres)}</Field>
                <Field label="Side slope (z:1)">{input("slope", { ...metres, step: "0.1" })}</Field>
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
            <Field label="Quantity">{input("quantity", { type: "number", min: "1", max: "20", step: "1" })}</Field>
          </div>
          <div className="lc-grid lc-grid--3">
            <Field label="Fold-over (m)">{input("foldOver", metres)}</Field>
            <Field label="Waste %">{input("waste", percent)}</Field>
            {form.shape === "rectangular" ? (
              <>
                <Field label="Overlap %">{input("overlap", percent)}</Field>
                <Field label="Anchor (m)">{input("anchor", metres)}</Field>
              </>
            ) : (
              <Field label="Colour">{input("colour")}</Field>
            )}
          </div>

          <div className="ops-peek-value lc-result" aria-live="polite">
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
                  <span>
                    {parcel ? `${quantity > 1 ? `${quantity} × ` : ""}${parcel.lengthCm} × ${parcel.widthCm} × ${parcel.heightCm} cm` : "Enter the parcel size"}
                  </span>
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
              </div>
            ) : null}
          </div>
        </section>

        {/* Customer */}
        <section className="lc-col" aria-label="Deliver to">
          <p className="ops-peek-next__label">Deliver to</p>
          {linked ? (
            <p className="lc-linked">
              <span className="ops-peek-chip ops-tone-blue">
                {linked.kind === "quote" ? "Quote" : "RFQ"} {linked.number}
              </span>
              <button type="button" className="ops-toolbar__text-btn" onClick={() => setLinked(null)}>
                Unlink
              </button>
            </p>
          ) : (
            <div className="lc-find">
              <AdminInput
                value={lookup}
                placeholder="Fill from RFQ or quote number"
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
            <Field label="Email">{input("email", { type: "email" })}</Field>
            <Field label="Company">{input("companyName")}</Field>
          </div>
        </section>

        {/* Courier */}
        <section className="lc-col" aria-label="Courier">
          <p className="ops-peek-next__label">Courier</p>
          <div className="lc-grid lc-grid--2">
            <Field label="Collect from">
              <AdminSelect value={form.depot} onChange={(event) => set("depot", event.target.value)}>
                <option value="auto">Nearest depot</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.label}
                  </option>
                ))}
              </AdminSelect>
            </Field>
            <Field label="Declared value (R)">{input("declaredValue", { type: "number", min: "0", step: "1" })}</Field>
            <Field label="Reference" wide>
              {input("reference", { placeholder: "RFQ, quote or WhatsApp" })}
            </Field>
            <Field label="Delivery notes" wide>
              <AdminTextarea value={form.notes} rows={3} onChange={(event) => set("notes", event.target.value)} />
            </Field>
          </div>
          {declared.capped ? <p className="ops-peek-warn">Courier Guy takes at most R30 000 declared value, so R30 000 is sent.</p> : null}
          <p className="ops-peek-muted">Getting a rate books nothing. The rate and the quote are saved on the board.</p>
        </section>
      </div>

      <footer className="admin-dialog__footer lc-modal__footer">
        {error ? (
          <p className="ops-peek-warn lc-modal__error" role="alert">
            {error}
          </p>
        ) : !courierReady ? (
          <p className="ops-peek-warn lc-modal__error">The Courier Guy is not set up, so rates are off.</p>
        ) : null}
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="admin-btn admin-btn--secondary" disabled={pending || !parcel} onClick={saveDraft}>
          Save draft
        </button>
        <button type="button" className="admin-btn admin-btn--primary" disabled={pending || !courierReady || !parcel} onClick={getRates}>
          {pending ? "Getting rate…" : "Get Courier Guy rate"}
        </button>
      </footer>
    </>
  );
}

export function LinerQuoteModal({ target, onClose, ...rest }: Props) {
  const row = target && target !== "new" ? target : null;
  return (
    <AdminDialog open={Boolean(target)} size="large" title={row ? "Edit courier quote" : "New courier quote"} onClose={onClose}>
      {target ? <QuoteForm key={row?.id ?? "new"} initial={row} onClose={onClose} {...rest} /> : null}
    </AdminDialog>
  );
}
