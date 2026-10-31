"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AdminActionState } from "@/lib/admin/action-state";
import { AdminActionMessage, AdminButton, AdminDrawer } from "@/components/admin/ui";
import {
  BOOKING_KIND_LABELS,
  BOOKING_KINDS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
  addDays,
  bookingDays,
  bookingTimeLabel,
  layoutBars,
  outlookLabel,
  saDate,
  saTime,
  type BarSegment,
  type CalendarBooking,
  type CalendarTeam,
} from "@/lib/operations/calendar";
import type { BacklogProject, ProjectOption } from "@/lib/operations/calendar-store";
import { bookingHistoryAction, saveBookingAction, saveTeamAction } from "@/app/admin/operations/calendar/actions";

type View = "week" | "month";

type Props = {
  view: View;
  anchor: string;
  today: string;
  days: string[];
  teams: CalendarTeam[];
  bookings: CalendarBooking[];
  backlog: BacklogProject[];
  projects: ProjectOption[];
  outlookCalendars: number;
  canEdit: boolean;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  weekHref: string;
  monthHref: string;
  rangeLabel: string;
};

type Draft = { booking?: CalendarBooking; projectId?: string; teamId?: string; date?: string };
type Row = { id: string; name: string; colour: string; leader: string | null };

const WEEKDAY = new Intl.DateTimeFormat("en-ZA", { weekday: "short", timeZone: "UTC" });
const DAY_LONG = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const DAY_NUM = (d: string) => String(Number(d.slice(8, 10)));
const dateObj = (d: string) => new Date(`${d}T00:00:00Z`);
const NO_TEAM: Row = { id: "unassigned", name: "No team", colour: "#94a3b8", leader: null };
const SIDEBAR_KEY = "ops-cal-backlog-open";
const SIDEBAR_EVENT = "ops-cal-backlog-toggle";

/** Remembered per browser; storage can be unavailable, so it falls back to open. */
function readSidebar(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) !== "0";
  } catch {
    return true;
  }
}
function subscribeSidebar(callback: () => void) {
  window.addEventListener(SIDEBAR_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
function setSidebar(open: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}

export function CalendarWorkspace(props: Props) {
  const { view, teams, bookings, days, today, canEdit } = props;
  const [teamFilter, setTeamFilter] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const sidebarOpen = useSyncExternalStore(subscribeSidebar, readSidebar, () => true);
  const toggleSidebar = () => setSidebar(!sidebarOpen);

  const activeTeams = teams.filter((t) => t.active);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const warningsByProject = useMemo(() => new Map(props.projects.map((p) => [p.id, p.warnings])), [props.projects]);
  const shownBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== "cancelled" &&
          (teamFilter === "all" || b.team_ids.includes(teamFilter) || (teamFilter === "unassigned" && !b.team_ids.length)),
      ),
    [bookings, teamFilter],
  );

  const rows: Row[] = [
    ...(teamFilter === "all" ? activeTeams : activeTeams.filter((t) => t.id === teamFilter)).map((t) => ({
      id: t.id,
      name: t.name,
      colour: t.colour,
      leader: t.leader_name,
    })),
    ...((teamFilter === "all" || teamFilter === "unassigned") && shownBookings.some((b) => !b.team_ids.length) ? [NO_TEAM] : []),
  ];
  const bookingsForRow = (rowId: string) =>
    shownBookings.filter((b) => (rowId === "unassigned" ? !b.team_ids.length : b.team_ids.includes(rowId)));

  const open = (d: Draft) => {
    if (canEdit) setDraft(d);
  };
  const colourOf = (b: CalendarBooking) => (b.kind === "project" ? teamById.get(b.team_ids[0] ?? "")?.colour ?? "#64748b" : "#64748b");
  const teamNames = (b: CalendarBooking) => b.team_ids.map((id) => teamById.get(id)?.name).filter(Boolean).join(", ") || "No team";
  const flagOf = (b: CalendarBooking) => (b.project_id ? warningsByProject.get(b.project_id)?.[0] : undefined);

  const bar = (seg: BarSegment, opts: { showTeam: boolean; rowOffset: number }) => {
    const b = seg.booking;
    const flag = flagOf(b);
    const first = saDate(b.start_at);
    const label = seg.span === 1 && !seg.continuesBefore && !seg.continuesAfter ? bookingTimeLabel(b, first) : b.all_day ? `${bookingDays(b).length} days` : `${saTime(b.start_at)} ${first.slice(8)}/${first.slice(5, 7)} – ${saTime(b.end_at)}`;
    return (
      <button
        key={b.id}
        type="button"
        className={`ops-cal-bar ops-cal-bar--${b.status} ops-cal-bar--${b.kind}${seg.continuesBefore ? " is-cont-before" : ""}${seg.continuesAfter ? " is-cont-after" : ""}`}
        style={{ ["--chip" as string]: colourOf(b), gridColumn: `${seg.start + 1} / span ${seg.span}`, gridRow: seg.lane + 1 + opts.rowOffset }}
        onClick={() => open({ booking: b })}
        disabled={!canEdit}
        title={`${b.project?.title ?? b.title} · ${teamNames(b)} · ${BOOKING_STATUS_LABELS[b.status]}${flag ? ` · ${flag}` : ""}`}
      >
        <span className="ops-cal-bar__title">
          {b.status === "tentative" ? <span className="ops-cal-tag">Tentative</span> : null}
          {flag ? <span className="ops-cal-flag" aria-label={flag}>!</span> : null}
          {b.project?.title ?? b.title}
        </span>
        <span className="ops-cal-bar__meta">
          {opts.showTeam ? `${teamNames(b)} · ` : ""}
          {label}
          {b.project && b.title !== "Installation" ? ` · ${b.title}` : ""}
        </span>
      </button>
    );
  };

  return (
    <div className="ops-cal">
      <div className="ops-cal-toolbar" role="toolbar" aria-label="Calendar controls">
        <div className="ops-cal-toolbar__nav">
          <Link className="admin-btn admin-btn--secondary admin-btn--sm" href={props.prevHref} aria-label={view === "week" ? "Previous week" : "Previous month"}>‹</Link>
          <Link className="admin-btn admin-btn--secondary admin-btn--sm" href={props.todayHref}>Today</Link>
          <Link className="admin-btn admin-btn--secondary admin-btn--sm" href={props.nextHref} aria-label={view === "week" ? "Next week" : "Next month"}>›</Link>
          <h2 className="ops-cal-toolbar__range">{props.rangeLabel}</h2>
        </div>
        <div className="ops-cal-toolbar__tools">
          <div className="ops-cal-seg" role="group" aria-label="View">
            <Link href={props.weekHref} aria-current={view === "week" ? "page" : undefined}>Teams</Link>
            <Link href={props.monthHref} aria-current={view === "month" ? "page" : undefined}>Month</Link>
          </div>
          <label className="ops-cal-filter">
            <span className="sr-only">Team</span>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="all">All teams</option>
              {activeTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="unassigned">No team</option>
            </select>
          </label>
          <span
            className={`ops-cal-sync${props.outlookCalendars ? " is-on" : ""}`}
            title={props.outlookCalendars ? `${props.outlookCalendars} Outlook calendar(s) connected` : "Bookings are saved in DamTech. Outlook sync is not set up yet."}
          >
            {props.outlookCalendars ? "Outlook connected" : "Outlook not connected"}
          </span>
          {canEdit ? (
            <span className="ops-cal-toolbar__actions">
              <AdminButton size="sm" variant="ghost" onClick={() => setTeamsOpen(true)}>Teams</AdminButton>
              <AdminButton size="sm" variant="primary" onClick={() => open({ date: today })}>New booking</AdminButton>
            </span>
          ) : null}
        </div>
      </div>

      {activeTeams.length === 0 ? (
        <p className="ops-cal-empty">
          No teams yet.{" "}
          {canEdit ? (
            <button type="button" className="ops-cal-link" onClick={() => setTeamsOpen(true)}>Add your installation teams</button>
          ) : (
            "An admin needs to add the installation teams"
          )}{" "}
          to start booking.
        </p>
      ) : null}

      <div className={`ops-cal-layout${sidebarOpen ? "" : " is-collapsed"}`}>
        <div className="ops-cal-main">
          {view === "week" ? (
            <>
              <div className="ops-cal-tl" role="table" aria-label={`Team planner, ${props.rangeLabel}`}>
                <div className="ops-cal-tl__row ops-cal-tl__head" role="row">
                  <div className="ops-cal-tl__team" role="columnheader">Team</div>
                  <div className="ops-cal-tl__days">
                    {days.map((d) => (
                      <div key={d} role="columnheader" className={`ops-cal-tl__day${d === today ? " is-today" : ""}`}>
                        <span>{WEEKDAY.format(dateObj(d))}</span> <strong>{DAY_NUM(d)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                {rows.map((row) => {
                  const { segments, lanes } = layoutBars(bookingsForRow(row.id), days);
                  const busy = new Set(segments.flatMap((s) => Array.from({ length: s.span }, (_, i) => s.start + i)));
                  return (
                    <div key={row.id} className="ops-cal-tl__row" role="row">
                      <div className="ops-cal-tl__team" role="rowheader">
                        <span className="ops-cal-dot" style={{ background: row.colour }} aria-hidden />
                        <span>
                          {row.name}
                          {row.leader ? <small>Lead: {row.leader}</small> : null}
                        </span>
                      </div>
                      <div className="ops-cal-tl__lanes" style={{ gridTemplateRows: `${lanes ? `repeat(${lanes}, auto) ` : ""}minmax(1.75rem, 1fr)` }} role="cell">
                        {days.map((d, i) => (
                          <div key={d} className={`ops-cal-tl__bg${d === today ? " is-today" : ""}`} style={{ gridColumn: i + 1, gridRow: `1 / ${lanes + 2}` }} aria-hidden />
                        ))}
                        {segments.map((seg) => bar(seg, { showTeam: row.id === "unassigned", rowOffset: 0 }))}
                        {days.map((d, i) =>
                          row.id === "unassigned" ? null : (
                            <div key={`free-${d}`} className="ops-cal-tl__slot" style={{ gridColumn: i + 1, gridRow: lanes + 1 }}>
                              {!busy.has(i) ? <span className="ops-cal-free">Available</span> : null}
                              {canEdit ? (
                                <button type="button" className="ops-cal-add" onClick={() => open({ teamId: row.id, date: d })} aria-label={`Book ${row.name} on ${DAY_LONG.format(dateObj(d))}`}>+</button>
                              ) : null}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ol className="ops-cal-agenda" aria-label="Schedule by day">
                {days.map((d) => {
                  const items = shownBookings.filter((b) => bookingDays(b).includes(d));
                  return (
                    <li key={d} className={d === today ? "is-today" : undefined}>
                      <h3>{DAY_LONG.format(dateObj(d))}</h3>
                      {items.length ? (
                        <ul>
                          {items.map((b) => (
                            <li key={b.id}>
                              <button type="button" className={`ops-cal-bar ops-cal-bar--${b.status} ops-cal-bar--${b.kind}`} style={{ ["--chip" as string]: colourOf(b) }} onClick={() => open({ booking: b })} disabled={!canEdit}>
                                <span className="ops-cal-bar__title">
                                  {b.status === "tentative" ? <span className="ops-cal-tag">Tentative</span> : null}
                                  {flagOf(b) ? <span className="ops-cal-flag" aria-label={flagOf(b)}>!</span> : null}
                                  {b.project?.title ?? b.title}
                                </span>
                                <span className="ops-cal-bar__meta">{teamNames(b)} · {bookingTimeLabel(b, d)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="ops-cal-agenda__none">Nothing booked.</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <div className="ops-cal-month" aria-label={props.rangeLabel}>
              <div className="ops-cal-month__head">
                {days.slice(0, 7).map((d) => (
                  <div key={`h-${d}`}>{WEEKDAY.format(dateObj(d))}</div>
                ))}
              </div>
              {Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7)).map((week) => {
                const { segments } = layoutBars(shownBookings, week);
                const MAX = 3;
                const visible = segments.filter((s) => s.lane < MAX);
                const hidden = segments.filter((s) => s.lane >= MAX);
                return (
                  <div key={week[0]} className="ops-cal-month__week" style={{ gridTemplateRows: `1.7rem repeat(${Math.min(MAX, Math.max(1, ...segments.map((s) => s.lane + 1)))}, auto) 1fr` }}>
                    {week.map((d, i) => {
                      const outside = d.slice(0, 7) !== props.anchor.slice(0, 7);
                      const more = hidden.filter((s) => i >= s.start && i < s.start + s.span).length;
                      return (
                        <div key={d} className={`ops-cal-month__cell${outside ? " is-outside" : ""}${d === today ? " is-today" : ""}`} style={{ gridColumn: i + 1, gridRow: "1 / -1" }}>
                          <button type="button" className="ops-cal-month__num" onClick={() => open({ date: d })} disabled={!canEdit} aria-label={`Book on ${DAY_LONG.format(dateObj(d))}`}>
                            {DAY_NUM(d)}
                          </button>
                          {more ? <span className="ops-cal-month__more">+{more} more</span> : null}
                        </div>
                      );
                    })}
                    {visible.map((seg) => bar(seg, { showTeam: true, rowOffset: 1 }))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Backlog
          backlog={props.backlog}
          canEdit={canEdit}
          open={sidebarOpen}
          onToggle={toggleSidebar}
          onBook={(id) => open({ projectId: id, date: today })}
        />
      </div>

      {draft ? (
        <BookingDrawer
          key={draft.booking?.id ?? `${draft.projectId}-${draft.teamId}-${draft.date}`}
          draft={draft}
          teams={activeTeams}
          projects={props.projects}
          outlookCalendars={props.outlookCalendars}
          onClose={() => setDraft(null)}
        />
      ) : null}
      {teamsOpen ? <TeamsDrawer teams={teams} onClose={() => setTeamsOpen(false)} /> : null}
    </div>
  );
}

type BacklogFilter = "all" | "ready" | "attention";

function Backlog({ backlog, canEdit, open, onToggle, onBook }: { backlog: BacklogProject[]; canEdit: boolean; open: boolean; onToggle: () => void; onBook: (projectId: string) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<BacklogFilter>("ready");
  const ready = backlog.filter((p) => !p.warnings.length).length;
  const needle = q.trim().toLowerCase();
  const items = backlog.filter(
    (p) =>
      (filter === "all" || (filter === "ready" ? !p.warnings.length : p.warnings.length > 0)) &&
      (!needle || [p.title, p.customer_name, p.site_town, p.crew].some((v) => v?.toLowerCase().includes(needle))),
  );

  if (!open) {
    return (
      <aside className="ops-cal-backlog is-collapsed" aria-label="Not booked yet">
        <button type="button" className="ops-cal-backlog__toggle" onClick={onToggle} aria-expanded={false}>
          Not booked yet <span>{backlog.length}</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="ops-cal-backlog" aria-labelledby="ops-cal-backlog-title">
      <div className="ops-cal-backlog__head">
        <h2 id="ops-cal-backlog-title">Not booked yet <span>{backlog.length}</span></h2>
        <button type="button" className="ops-cal-backlog__hide" onClick={onToggle} aria-expanded aria-label="Hide the list of jobs not booked yet">Hide</button>
      </div>
      <input className="ops-cal-backlog__search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs" aria-label="Search jobs not booked yet" />
      <div className="ops-cal-seg ops-cal-seg--small" role="group" aria-label="Filter">
        {([
          ["all", `All ${backlog.length}`],
          ["ready", `Ready ${ready}`],
          ["attention", `Check ${backlog.length - ready}`],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>
      {items.length ? (
        <ul>
          {items.map((p) => (
            <li key={p.id}>
              <div className="ops-cal-backlog__text">
                <Link href={`/admin/operations/projects/${p.id}/`} className="ops-cal-backlog__title">{p.title}</Link>
                <span className="ops-cal-backlog__meta">{[p.customer_name, p.crew ? `Lead: ${p.crew}` : null].filter(Boolean).join(" · ")}</span>
                <span className={p.warnings.length ? "ops-cal-backlog__warn" : "ops-cal-backlog__ok"} title={p.warnings.join(" ")}>
                  {p.warnings.length ? p.warnings[0] : "Ready to schedule"}
                </span>
              </div>
              {canEdit ? <AdminButton size="sm" variant="outline" onClick={() => onBook(p.id)}>Book</AdminButton> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ops-cal-empty">{backlog.length ? "No jobs match." : "Every active installation job has a booking."}</p>
      )}
    </aside>
  );
}

function BookingDrawer({ draft, teams, projects, outlookCalendars, onClose }: { draft: Draft; teams: CalendarTeam[]; projects: ProjectOption[]; outlookCalendars: number; onClose: () => void }) {
  const b = draft.booking;
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(saveBookingAction, null);
  const [kind, setKind] = useState<string>(b?.kind ?? "project");
  const [projectId, setProjectId] = useState(b?.project_id ?? draft.projectId ?? "");
  const [allDay, setAllDay] = useState(b?.all_day ?? false);
  const [override, setOverride] = useState(b?.allow_overlap ?? false);
  const [history, setHistory] = useState<{ at: string; actor: string | null; action: string }[] | null>(null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  useEffect(() => {
    if (!b) return;
    let live = true;
    bookingHistoryAction(b.id).then((h) => live && setHistory(h));
    return () => {
      live = false;
    };
  }, [b]);

  const project = projects.find((p) => p.id === projectId);
  const endLocal = b ? (b.all_day ? addDays(saDate(new Date(new Date(b.end_at).getTime() - 1)), 0) : saDate(b.end_at)) : draft.date;
  const teamIds = new Set(b?.team_ids ?? (draft.teamId ? [draft.teamId] : []));

  return (
    <AdminDrawer open title={b ? "Edit booking" : "New booking"} onClose={onClose}>
      <form
        className="ops-cal-form"
        aria-busy={pending || undefined}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const submitter = (e.nativeEvent as SubmitEvent).submitter;
          if (submitter?.getAttribute("name") === "cancel_booking" && !window.confirm("Cancel this booking? It stays in the history.")) return;
          const fd = new FormData(e.currentTarget, submitter);
          startTransition(() => formAction(fd));
        }}
      >
        {b ? (
          <>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="expected_version" value={b.version} />
          </>
        ) : null}

        <label className="ops-cal-field">
          <span>What</span>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {BOOKING_KINDS.map((k) => (
              <option key={k} value={k}>{BOOKING_KIND_LABELS[k]}</option>
            ))}
          </select>
        </label>

        <label className="ops-cal-field">
          <span>Project{kind === "project" ? "" : " (optional)"}</span>
          <select name="project_id" value={projectId} onChange={(e) => setProjectId(e.target.value)} required={kind === "project"}>
            <option value="">Choose a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{[p.title, p.customer_name, p.site_town].filter(Boolean).join(" · ")}</option>
            ))}
          </select>
        </label>
        {project?.warnings.length ? (
          <ul className="ops-cal-warnings" role="note">
            {project.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        ) : null}

        <label className="ops-cal-field">
          <span>Title</span>
          <input name="title" defaultValue={b?.title ?? ""} placeholder={kind === "project" ? "Installation" : BOOKING_KIND_LABELS[kind as keyof typeof BOOKING_KIND_LABELS]} maxLength={200} />
        </label>

        <div className="ops-cal-row">
          <label className="ops-cal-field">
            <span>Start date</span>
            <input type="date" name="start_date" required defaultValue={b ? saDate(b.start_at) : draft.date} />
          </label>
          {!allDay ? (
            <label className="ops-cal-field">
              <span>From</span>
              <input type="time" name="start_time" step={900} defaultValue={b && !b.all_day ? saTime(b.start_at) : "07:00"} />
            </label>
          ) : null}
        </div>
        <div className="ops-cal-row">
          <label className="ops-cal-field">
            <span>End date</span>
            <input type="date" name="end_date" required defaultValue={endLocal} />
          </label>
          {!allDay ? (
            <label className="ops-cal-field">
              <span>Until</span>
              <input type="time" name="end_time" step={900} defaultValue={b && !b.all_day ? saTime(b.end_at) : "16:00"} />
            </label>
          ) : null}
        </div>
        <label className="ops-cal-check">
          <input type="checkbox" name="all_day" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All day
        </label>

        <fieldset className="ops-cal-field">
          <legend>Teams</legend>
          {teams.length ? (
            teams.map((t) => (
              <label key={t.id} className="ops-cal-check">
                <input type="checkbox" name="team_ids" value={t.id} defaultChecked={teamIds.has(t.id)} />
                <span className="ops-cal-dot" style={{ background: t.colour }} aria-hidden /> {t.name}
              </label>
            ))
          ) : (
            <p className="ops-cal-empty">Add a team first (Teams button).</p>
          )}
        </fieldset>

        <label className="ops-cal-field">
          <span>Status</span>
          <select name="status" defaultValue={b?.status && b.status !== "cancelled" ? b.status : "tentative"}>
            {BOOKING_STATUSES.filter((s) => s !== "cancelled").map((s) => (
              <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>

        <label className="ops-cal-check">
          <input type="checkbox" name="allow_overlap" checked={override} onChange={(e) => setOverride(e.target.checked)} /> Allow double-booking
        </label>
        {override ? (
          <label className="ops-cal-field">
            <span>Why</span>
            <input name="overlap_reason" required defaultValue={b?.overlap_reason ?? ""} maxLength={200} />
          </label>
        ) : null}

        <label className="ops-cal-field">
          <span>Notes for the team</span>
          <textarea name="notes" rows={3} defaultValue={b?.notes ?? ""} maxLength={2000} />
        </label>

        <div className="ops-cal-form__actions">
          <AdminButton type="submit" variant="primary" disabled={pending}>{b ? "Save changes" : "Add booking"}</AdminButton>
          {b ? <AdminButton type="submit" name="cancel_booking" value="1" variant="danger" disabled={pending}>Cancel booking</AdminButton> : null}
          <AdminButton type="button" variant="ghost" onClick={onClose}>Close</AdminButton>
        </div>
        <AdminActionMessage state={state} pending={pending} />
        <p className="ops-cal-empty">{b ? outlookLabel(outlookCalendars, b.sync_statuses) : outlookCalendars ? "Outlook is updated after you save." : "Outlook not connected: saved in DamTech only."}</p>

        {b?.project_id ? (
          <p><Link href={`/admin/operations/projects/${b.project_id}/`}>Open the project</Link></p>
        ) : null}
        {b ? (
          <section className="ops-cal-history" aria-label="Booking history">
            <h3>History</h3>
            {history === null ? <p>Loading…</p> : history.length ? (
              <ul>
                {history.map((h, i) => (
                  <li key={i}>{h.action} · {h.actor ?? "System"} · {saDate(h.at)} {saTime(h.at)}</li>
                ))}
              </ul>
            ) : <p>No history.</p>}
          </section>
        ) : null}
      </form>
    </AdminDrawer>
  );
}

function TeamForm({ team }: { team?: CalendarTeam }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(saveTeamAction, null);
  return (
    <form
      className="ops-cal-team-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {team ? <input type="hidden" name="id" value={team.id} /> : null}
      <input name="name" defaultValue={team?.name ?? ""} placeholder="Team name" aria-label="Team name" required maxLength={60} />
      <input name="leader_name" defaultValue={team?.leader_name ?? ""} placeholder="Team leader" aria-label="Team leader" maxLength={80} />
      <input type="color" name="colour" defaultValue={team?.colour ?? "#026BC6"} aria-label="Team colour" />
      {team ? (
        <select name="active" defaultValue={team.active ? "on" : "off"} aria-label="Team active">
          <option value="on">Active</option>
          <option value="off">Hidden</option>
        </select>
      ) : null}
      <AdminButton type="submit" size="sm" variant={team ? "secondary" : "primary"} disabled={pending}>{team ? "Save" : "Add team"}</AdminButton>
      <AdminActionMessage state={state} pending={pending} />
    </form>
  );
}

function TeamsDrawer({ teams, onClose }: { teams: CalendarTeam[]; onClose: () => void }) {
  return (
    <AdminDrawer open title="Installation teams" onClose={onClose}>
      <p className="ops-cal-empty">Teams are never deleted, so old bookings keep their history. Hide a team you no longer use.</p>
      {teams.map((t) => <TeamForm key={t.id} team={t} />)}
      <h3>Add a team</h3>
      <TeamForm />
    </AdminDrawer>
  );
}
