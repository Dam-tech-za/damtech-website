"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { openQuotesAction, quoteSnapshotAction, refreshInspectionAction, type OpenQuote } from "@/app/admin/operations/calendar/actions";
import { formatOpsDateTime, formatOpsMoney } from "@/components/admin/operations/ops-format";
import { CountryFlag } from "@/components/admin/operations/CountryFlag";
import { displayPhone } from "@/lib/operations/phone-display";
import type { CalendarBooking, QuoteSnapshot } from "@/lib/operations/calendar";

const SHORT = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
const short = (d: string | null) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? SHORT.format(new Date(`${d.slice(0, 10)}T00:00:00Z`)) : "");

/** Read-only card with what the inspector needs on the day. */
export function QuoteSummaryCard({ snapshot }: { snapshot: QuoteSnapshot }) {
  const phone = displayPhone(snapshot.phone);
  return (
    <div className="ops-insp-card">
      <p className="ops-insp-card__head">
        <strong>{snapshot.client ?? "Client"}</strong>
        <span>{snapshot.number}{snapshot.status ? ` · ${snapshot.status.toLowerCase()}` : ""}</span>
      </p>
      {snapshot.person && snapshot.person !== snapshot.client ? <p>{snapshot.person}</p> : null}
      {phone ? (
        <p>
          <a href={phone.href} className="ops-insp-card__link">
            <CountryFlag country={phone.country} /> {phone.text}
          </a>
        </p>
      ) : null}
      {snapshot.email ? (
        <p>
          <a href={`mailto:${snapshot.email}`} className="ops-insp-card__link">{snapshot.email}</a>
        </p>
      ) : null}
      {snapshot.title || snapshot.reference ? <p className="ops-insp-card__ref">{snapshot.title || snapshot.reference}</p> : null}
      {snapshot.address ? <p>{snapshot.address}</p> : null}
      <p className="ops-insp-card__meta">
        {snapshot.total !== null ? `${formatOpsMoney(snapshot.total)} incl. VAT · ` : ""}Details from Xero, {formatOpsDateTime(snapshot.fetched_at)}
      </p>
    </div>
  );
}

/** "Quote (not yet accepted)" picker, or a client typed by hand. Reads Xero only. */
export function InspectionPicker({ booking, linkedProject }: { booking?: CalendarBooking; linkedProject?: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"quote" | "manual">(booking && !booking.quote_number ? "manual" : "quote");
  const [quotes, setQuotes] = useState<OpenQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [number, setNumber] = useState(booking?.quote_number ?? "");
  const [contactId, setContactId] = useState(booking?.quote_contact_id ?? "");
  const [snapshot, setSnapshot] = useState<QuoteSnapshot | null>(booking?.quote_snapshot ?? null);
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "quote" || quotes !== null) return;
    let live = true;
    openQuotesAction().then((r) => {
      if (!live) return;
      if ("error" in r) setError(r.error);
      else setQuotes(r.quotes);
    });
    return () => {
      live = false;
    };
  }, [mode, quotes]);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => (quotes ?? []).filter((x) => !needle || [x.number, x.contact, x.title].some((v) => v?.toLowerCase().includes(needle))).slice(0, 40),
    [quotes, needle],
  );

  const pick = async (n: string) => {
    setNumber(n);
    setSnapshot(null);
    setLoadingSnap(true);
    const r = await quoteSnapshotAction(n);
    setLoadingSnap(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    setError(null);
    setSnapshot(r.snapshot);
    setContactId(r.contactId);
  };

  const refreshFromXero = async () => {
    if (!booking) return;
    setRefreshMsg("Reading Xero…");
    const r = await refreshInspectionAction(booking.id);
    setRefreshMsg(r?.message ?? null);
    if (r?.ok) router.refresh();
  };

  return (
    <div className="ops-insp">
      {linkedProject ? <p className="ops-cal-empty">Linked to project {linkedProject}</p> : null}
      {mode === "quote" ? (
        <>
          <input type="hidden" name="quote_number" value={number} />
          <input type="hidden" name="project_id" value={booking?.project_id && booking.quote_number?.toUpperCase() === number.toUpperCase() ? booking.project_id : ""} />
          <input type="hidden" name="quote_contact_id" value={contactId} />
          <input type="hidden" name="quote_snapshot" value={snapshot && snapshot.number.toUpperCase() === number.toUpperCase() ? JSON.stringify(snapshot) : ""} />
          <label className="ops-cal-field">
            <span>Quote (not yet accepted)</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={number ? `Selected ${number}. Search to change` : "Search number, client or reference"} />
          </label>
          {error ? <p className="ops-cal-warn" role="alert">{error}</p> : null}
          {quotes === null && !error ? <p className="ops-cal-empty">Loading quotes from Xero…</p> : null}
          {quotes && (needle || !number) ? (
            shown.length ? (
              <ul className="ops-insp__list" role="listbox" aria-label="Quotes not yet accepted">
                {shown.map((x) => (
                  <li key={x.id}>
                    <button type="button" role="option" aria-selected={x.number === number} className={x.number === number ? "is-on" : undefined} onClick={() => { setQ(""); void pick(x.number); }}>
                      <strong>{x.number}</strong> · {x.contact ?? "No client"} · {x.total !== null ? formatOpsMoney(x.total) : "—"} · {x.status === "DRAFT" ? "Draft" : "Sent"} {short(x.date)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ops-cal-empty">No draft or sent quotes match.</p>
            )
          ) : null}
          {loadingSnap ? <p className="ops-cal-empty">Reading {number} from Xero…</p> : null}
          {snapshot ? <QuoteSummaryCard snapshot={snapshot} /> : null}
          {booking?.quote_number ? (
            <p className="ops-insp__actions">
              <button type="button" className="ops-cal-link" onClick={() => void refreshFromXero()}>Refresh from Xero</button>
              {refreshMsg ? <span className="ops-cal-empty"> {refreshMsg}</span> : null}
            </p>
          ) : null}
          <button type="button" className="ops-cal-link" onClick={() => setMode("manual")}>No quote yet, enter a client manually</button>
        </>
      ) : (
        <>
          <input type="hidden" name="quote_number" value="" />
          <label className="ops-cal-field">
            <span>Client name</span>
            <input name="client_name_manual" required maxLength={200} defaultValue={booking?.client_name_manual ?? ""} />
          </label>
          <label className="ops-cal-field">
            <span>Site / town</span>
            <input name="site_manual" maxLength={200} defaultValue={booking?.site_manual ?? ""} />
          </label>
          <button type="button" className="ops-cal-link" onClick={() => setMode("quote")}>Pick a Xero quote instead</button>
        </>
      )}
    </div>
  );
}
