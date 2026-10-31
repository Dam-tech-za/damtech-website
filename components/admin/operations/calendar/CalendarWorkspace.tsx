"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import type { AdminActionState } from "@/lib/admin/action-state";
import { AdminActionMessage, AdminButton, AdminDrawer } from "@/components/admin/ui";
import {
  BOOKING_KIND_LABELS,
  BOOKING_KINDS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
  addDays,
  bookingTimeLabel,
  groupByTeamAndDay,
  saDate,
  saTime,
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
  canEdit: boolean;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  weekHref: string;
  monthHref: string;
  rangeLabel: string;
};

type Draft = { booking?: CalendarBooking; projectId?: string; teamId?: string; date?: string };

const WEEKDAY = new Intl.DateTimeFormat("en-ZA", { weekday: "short", timeZone: "UTC" });
const DAY_LONG = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const DAY_NUM = (d: string) => String(Number(d.slice(8, 10)));
const dateObj = (d: string) => new Date(`${d}T00:00:00Z`);

export function CalendarWorkspace(props: Props) {
  const { view, teams, bookings, days, today, canEdit } = props;
  const [teamFilter, setTeamFilter] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [teamsOpen, setTeamsOpen] = useState(false);

  const activeTeams = teams.filter((t) => t.active);
  const shownTeams = teamFilter === "all" ? activeTeams : activeTeams.filter((t) => t.id === teamFilter);
  const shownBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status !== "cancelled" && (teamFilter === "all" || b.team_ids.includes(teamFilter) || (teamFilter === "unassigned" && !b.team_ids.length)),
      ),
    [bookings, teamFilter],
  );
  const grid = useMemo(() => groupByTeamAndDay(shownBookings, days), [shownBookings, days]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const hasUnassigned = grid.has("unassigned");

  const open = (d: Draft) => canEdit && setDraft(d);
  const chipColour = (b: CalendarBooking) => teamById.get(b.team_ids[0] ?? "")?.colour ?? "#64748b";

  const chip = (b: CalendarBooking, day: string, compact = false) => (
    <button
      key={`${b.id}-${day}`}
      type="button"
      className={`ops-cal-chip ops-cal-chip--${b.status} ops-cal-chip--${b.kind}`}
      style={{ ["--chip" as string]: chipColour(b) }}
      onClick={() => (canEdit ? setDraft({ booking: b }) : undefined)}
      disabled={!canEdit}
      title={`${b.project?.title ?? b.title} · ${BOOKING_STATUS_LABELS[b.status]}`}
    >
      <span className="ops-cal-chip__title">{b.project?.title ?? b.title}</span>
      {!compact ? (
        <span className="ops-cal-chip__meta">
          {bookingTimeLabel(b, day)}
          {b.project && b.title !== "Installation" ? ` · ${b.title}` : ""}
          {b.status === "tentative" ? " · tentative" : ""}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="ops-cal">
      <div className="ops-cal-toolbar" role="toolbar" aria-label="Calendar controls">
        <div className="ops-cal-toolbar__nav">
          <Link className="admin-btn admin-btn--secondary admin-btn--sm" href={props.prevHref} aria-label={`Previous ${view}`}>‹</Link>
          <Link className="admin-btn admin-btn--secondary admin-btn--sm" href={props.todayHref}>Today</Link>
          <Link className="admin-btn admin-btn--secondary admin-btn--sm" href={props.nextHref} aria-label={`Next ${view}`}>›</Link>
          <h2 className="ops-cal-toolbar__range">{props.rangeLabel}</h2>
        </div>
        <div className="ops-cal-toolbar__tools">
          <div className="ops-cal-seg" role="group" aria-label="View">
            <Link href={props.weekHref} aria-current={view === "week" ? "page" : undefined}>Week</Link>
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
          {canEdit ? (
            <>
              <AdminButton size="sm" variant="ghost" onClick={() => setTeamsOpen(true)}>Teams</AdminButton>
              <AdminButton size="sm" variant="primary" onClick={() => open({ date: today })}>New booking</AdminButton>
            </>
          ) : null}
        </div>
      </div>

      {activeTeams.length === 0 ? (
        <p className="ops-cal-empty">
          No teams yet. {canEdit ? <button type="button" className="ops-cal-link" onClick={() => setTeamsOpen(true)}>Add your installation teams</button> : "An admin needs to add the installation teams."} to start booking.
        </p>
      ) : null}

      <div className="ops-cal-layout">
        <div className="ops-cal-main">
          {view === "week" ? (
            <>
              <div className="ops-cal-week" role="table" aria-label={`Team schedule, ${props.rangeLabel}`}>
                <div className="ops-cal-week__row ops-cal-week__head" role="row">
                  <div className="ops-cal-week__team" role="columnheader">Team</div>
                  {days.map((d) => (
                    <div key={d} role="columnheader" className={`ops-cal-week__day${d === today ? " is-today" : ""}`}>
                      <span>{WEEKDAY.format(dateObj(d))}</span> <strong>{DAY_NUM(d)}</strong>
                    </div>
                  ))}
                </div>
                {[...shownTeams.map((t) => ({ id: t.id, name: t.name, colour: t.colour, leader: t.leader_name })), ...(hasUnassigned && teamFilter === "all" ? [{ id: "unassigned", name: "No team", colour: "#94a3b8", leader: null }] : [])].map((t) => (
                  <div key={t.id} className="ops-cal-week__row" role="row">
                    <div className="ops-cal-week__team" role="rowheader">
                      <span className="ops-cal-dot" style={{ background: t.colour }} aria-hidden />
                      <span>
                        {t.name}
                        {t.leader ? <small>{t.leader}</small> : null}
                      </span>
                    </div>
                    {days.map((d) => (
                      <div key={d} role="cell" className={`ops-cal-week__cell${d === today ? " is-today" : ""}`}>
                        {(grid.get(t.id)?.get(d) ?? []).map((b) => chip(b, d))}
                        {canEdit && t.id !== "unassigned" ? (
                          <button type="button" className="ops-cal-add" onClick={() => open({ teamId: t.id, date: d })} aria-label={`Book ${t.name} on ${DAY_LONG.format(dateObj(d))}`}>+</button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <ol className="ops-cal-agenda" aria-label="Schedule by day">
                {days.map((d) => {
                  const items = shownBookings.filter((b) => [...(grid.values())].some((row) => row.get(d)?.includes(b)));
                  return (
                    <li key={d} className={d === today ? "is-today" : undefined}>
                      <h3>{DAY_LONG.format(dateObj(d))}</h3>
                      {items.length ? (
                        <ul>
                          {items.map((b) => (
                            <li key={b.id}>
                              {chip(b, d)}
                              <span className="ops-cal-agenda__teams">{b.team_ids.map((id) => teamById.get(id)?.name).filter(Boolean).join(", ") || "No team"}</span>
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
            <div className="ops-cal-month" role="grid" aria-label={props.rangeLabel}>
              {days.slice(0, 7).map((d) => (
                <div key={`h-${d}`} className="ops-cal-month__head" role="columnheader">{WEEKDAY.format(dateObj(d))}</div>
              ))}
              {days.map((d) => {
                const items = [...new Map([...grid.values()].flatMap((row) => row.get(d) ?? []).map((b) => [b.id, b])).values()];
                const outside = d.slice(0, 7) !== props.anchor.slice(0, 7);
                return (
                  <div key={d} role="gridcell" className={`ops-cal-month__cell${outside ? " is-outside" : ""}${d === today ? " is-today" : ""}`}>
                    <button type="button" className="ops-cal-month__num" onClick={() => open({ date: d })} disabled={!canEdit} aria-label={`Book on ${DAY_LONG.format(dateObj(d))}`}>
                      {DAY_NUM(d)}
                    </button>
                    {items.slice(0, 4).map((b) => chip(b, d, true))}
                    {items.length > 4 ? <span className="ops-cal-month__more">+{items.length - 4} more</span> : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="ops-cal-backlog" aria-labelledby="ops-cal-backlog-title">
          <h2 id="ops-cal-backlog-title">Not booked yet <span>{props.backlog.length}</span></h2>
          {props.backlog.length ? (
            <ul>
              {props.backlog.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/operations/projects/${p.id}/`} className="ops-cal-backlog__title">{p.title}</Link>
                  <span className="ops-cal-backlog__meta">{[p.customer_name, p.site_town, p.crew ? `Crew: ${p.crew}` : null].filter(Boolean).join(" · ")}</span>
                  {p.warnings.length ? <span className="ops-cal-backlog__warn">{p.warnings[0]}</span> : null}
                  {canEdit ? (
                    <AdminButton size="sm" variant="outline" onClick={() => open({ projectId: p.id, date: today })}>Book</AdminButton>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ops-cal-empty">Every active installation job has a booking.</p>
          )}
        </aside>
      </div>

      {draft ? (
        <BookingDrawer
          key={draft.booking?.id ?? `${draft.projectId}-${draft.teamId}-${draft.date}`}
          draft={draft}
          teams={activeTeams}
          projects={props.projects}
          onClose={() => setDraft(null)}
        />
      ) : null}
      {teamsOpen ? <TeamsDrawer teams={teams} onClose={() => setTeamsOpen(false)} /> : null}
    </div>
  );
}

function BookingDrawer({ draft, teams, projects, onClose }: { draft: Draft; teams: CalendarTeam[]; projects: ProjectOption[]; onClose: () => void }) {
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
