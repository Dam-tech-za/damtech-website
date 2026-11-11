"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { IconMore, ToolbarPopover } from "@/components/admin/board/BoardKit";
import {
  buildCourierQuoteBrief,
  buildCourierQuoteLine,
  buildWhatsAppSummary,
  COURIER_PORTAL_URL,
  formatRand,
  quoteLineCopyText,
  rateExVat,
  whatsAppLink,
} from "@/lib/courier/liner-quote";
import {
  LINER_DEPOT_LABELS,
  LINER_QUOTE_STAGE_LABELS,
  LINER_QUOTE_STAGE_TONES,
  linerQuoteStage,
  savedJob,
  savedParcel,
  savedSizeLabel,
  type LinerCourierHistoryRow,
} from "@/lib/courier/liner-board";
import {
  addCourierToQuoteAction,
  findRfqOrQuoteAction,
  recordFormalQuoteAction,
  type LinkedRecord,
} from "@/app/admin/operations/liner-courier/actions";

type Props = {
  row: LinerCourierHistoryRow | null;
  canEditQuotes: boolean;
  onClose: () => void;
  onEdit: (row: LinerCourierHistoryRow) => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ops-peek-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const when = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" })
    : "";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function QuoteView({ row, canEditQuotes, onEdit }: Omit<Props, "row" | "onClose"> & { row: LinerCourierHistoryRow }) {
  const rates = row.courier_rates ?? [];
  const [service, setService] = useState(() => rates.find((r) => r.serviceName === row.chosen_service_name)?.serviceCode ?? rates[0]?.serviceCode ?? "");
  const [markup, setMarkup] = useState("0");
  const [linkedQuote, setLinkedQuote] = useState<{ id: string; number: string } | null>(
    row.quote_id ? { id: row.quote_id, number: row.quotes?.quote_number ?? "quote" } : null,
  );
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<LinkedRecord[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const moreBtn = useRef<HTMLButtonElement>(null);

  const stage = linerQuoteStage(row);
  const parcel = savedParcel(row);
  const job = savedJob(row);
  const address = row.delivery_address ?? {};
  const depotLabel = LINER_DEPOT_LABELS[row.depot] ?? row.depot;
  const city = address.city || "customer";
  const chosen = rates.find((rate) => rate.serviceCode === service) ?? null;
  const markupPct = Number(markup.replace(",", ".")) || 0;
  const line = chosen ? buildCourierQuoteLine({ rate: chosen, parcel, quantity: row.quantity, depotLabel, city, markupPercent: markupPct }, 0) : null;
  const summary = buildWhatsAppSummary({ areaM2: Number(row.area_m2), gsm: row.gsm, parcel, quantity: row.quantity, depotLabel, city, rate: chosen });
  const saved = !row.id.startsWith("unsaved-");

  const formalQuote = (openPortal: boolean) => {
    const text = buildCourierQuoteBrief({
      areaM2: Number(row.area_m2),
      gsm: row.gsm,
      parcel,
      quantity: row.quantity,
      depotLabel,
      city: address.city ?? "",
      rate: chosen,
      job,
      collection: `${depotLabel} depot`,
    });
    if (openPortal) window.open(COURIER_PORTAL_URL, "_blank", "noopener");
    startTransition(async () => {
      const copied = await copy(text);
      if (saved) await recordFormalQuoteAction({ historyId: row.id, status: openPortal ? "portal_opened" : "brief_copied", reference: row.reference ?? "" });
      setMessage({ ok: copied, text: copied ? `Quote brief copied${openPortal ? ": paste it into the Courier Guy portal" : ""}.` : "Could not copy to the clipboard." });
    });
  };

  const findQuote = () =>
    startTransition(async () => {
      const result = await findRfqOrQuoteAction(lookup);
      const quotes = (result.records ?? []).filter((r) => r.kind === "quote");
      setFound(quotes);
      if (!quotes.length) setMessage({ ok: false, text: result.ok ? "No quotation with that number." : result.message });
    });

  const addToQuote = () => {
    if (!chosen || !linkedQuote) return;
    if (!window.confirm(`Put ${chosen.serviceName} on quotation ${linkedQuote.number}? An earlier courier line from this tool is replaced.`)) return;
    startTransition(async () => {
      const result = await addCourierToQuoteAction({
        quoteId: linkedQuote.id,
        historyId: saved ? row.id : null,
        rate: chosen,
        parcel,
        quantity: row.quantity,
        depotLabel,
        city,
        markupPercent: markupPct,
      });
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  const menu = (label: string, run: () => void) => (
    <li>
      <button
        type="button"
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
    <div className="ops-peek lc-view">
      <header className="ops-peek__head">
        <div className="ops-peek__chips">
          <span className={`ops-peek-chip ops-tone-${LINER_QUOTE_STAGE_TONES[stage]}`}>{LINER_QUOTE_STAGE_LABELS[stage]}</span>
          {linkedQuote ? <span className="ops-peek-chip">Quote {linkedQuote.number}</span> : null}
          {row.rfqs?.rfq_number ? <span className="ops-peek-chip">RFQ {row.rfqs.rfq_number}</span> : null}
        </div>
      </header>

      <section className="ops-peek-value" aria-label="Courier rate">
        <div>
          <p className="ops-peek-value__label">{chosen ? `The Courier Guy · ${chosen.serviceName}` : "Courier rate"}</p>
          <p className="ops-peek-value__amount">{chosen ? formatRand(chosen.rate) : "Not rated"}</p>
          <p className="ops-peek-value__note">
            {chosen
              ? `${formatRand(rateExVat(chosen).exVat)} excl. VAT · rated ${when(row.rated_at)} · nothing booked`
              : "Edit and get a rate to price this delivery."}
          </p>
        </div>
      </section>

      <dl className="ops-peek-list">
        <Row label="Liner">
          {savedSizeLabel(row)} · {row.gsm} gsm · {Number(row.area_m2)} m²
        </Row>
        <Row label="Parcel">
          {row.quantity > 1 ? `${row.quantity} × ` : ""}
          {parcel.lengthCm}×{parcel.widthCm}×{parcel.heightCm} cm · {parcel.weightKg} kg
        </Row>
        <Row label="Deliver to">
          {[address.customerName, address.companyName].filter(Boolean).join(", ") || "—"}
          <span className="ops-peek-muted">
            {" "}
            · {[address.suburb, address.city, address.postalCode].filter(Boolean).join(", ")}
          </span>
        </Row>
        <Row label="From">{depotLabel}</Row>
      </dl>

      {rates.length > 1 ? (
        <fieldset className="lc-services">
          <legend className="ops-peek-next__label">Service</legend>
          {rates.map((rate) => (
            <label key={rate.serviceCode} className={service === rate.serviceCode ? "is-active" : ""}>
              <input type="radio" name={`lc-svc-${row.id}`} checked={service === rate.serviceCode} onChange={() => setService(rate.serviceCode)} />
              <span>{rate.serviceName}</span>
              <span className="ops-courier__price">{formatRand(rate.rate)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {line && chosen ? (
        <section className="lc-quote">
          <div className="lc-quote__price">
            <span className="ops-peek-muted">Sell = cost +</span>
            <AdminInput aria-label="Markup %" className="lc-quote__markup" value={markup} type="number" min="0" step="1" onChange={(event) => setMarkup(event.target.value)} />
            <span className="ops-peek-muted">% =</span>
            <strong>{formatRand(line.sellUnitPrice)}</strong>
            <span className="ops-peek-muted">excl. VAT</span>
          </div>
          {linkedQuote ? null : (
            <div className="lc-find">
              <AdminInput
                value={lookup}
                placeholder="Quote number to add it to"
                aria-label="Quotation number"
                onChange={(event) => setLookup(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    findQuote();
                  }
                }}
              />
              <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" disabled={pending || lookup.trim().length < 3} onClick={findQuote}>
                Find
              </button>
            </div>
          )}
          {found.length > 0 && !linkedQuote ? (
            <ul className="ops-peek-docs">
              {found.map((record) => (
                <li key={record.id}>
                  <span>
                    Quote {record.number} <span className="ops-peek-muted">{record.prefill.customerName || record.prefill.companyName}</span>
                  </span>
                  <button
                    type="button"
                    className="ops-toolbar__text-btn"
                    disabled={!record.editable}
                    onClick={() => {
                      setLinkedQuote({ id: record.id, number: record.number });
                      setFound([]);
                    }}
                  >
                    {record.editable ? "Use" : "Locked"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="lc-actions">
        {line && linkedQuote ? (
          <button type="button" className="admin-btn admin-btn--primary" disabled={pending || !canEditQuotes} onClick={addToQuote}>
            Add to quote {linkedQuote.number}
          </button>
        ) : null}
        {line ? (
          <button
            type="button"
            className={`admin-btn ${linkedQuote ? "admin-btn--secondary" : "admin-btn--primary"}`}
            onClick={async () => setMessage({ ok: await copy(`${summary}\n${quoteLineCopyText(line)}`), text: "Copied for WhatsApp." })}
          >
            Copy for WhatsApp
          </button>
        ) : null}
        <button type="button" className={`admin-btn ${line ? "admin-btn--secondary" : "admin-btn--primary"}`} onClick={() => onEdit(row)}>
          {rates.length ? "Edit / re-rate" : "Edit and get rate"}
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
            {menu("Copy Courier Guy quote brief", () => formalQuote(false))}
            {menu("Open Courier Guy portal with brief", () => formalQuote(true))}
            {address.phone ? menu("Open WhatsApp chat", () => window.open(whatsAppLink(address.phone, summary), "_blank", "noopener")) : null}
          </ul>
        </ToolbarPopover>
      </div>

      {message ? (
        <p className={message.ok ? "ops-peek-muted" : "ops-peek-warn"} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

export function LinerQuoteDrawer({ row, onClose, ...rest }: Props) {
  const title = row ? row.reference || row.customer_name || "Courier quote" : "Courier quote";
  return (
    <AdminDrawer open={Boolean(row)} title={title} onClose={onClose}>
      {row ? <QuoteView key={`${row.id}-${row.updated_at}`} row={row} {...rest} /> : null}
    </AdminDrawer>
  );
}
