import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { canPerform } from "@/lib/auth/permissions";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { addDays, dayList, isIsoDate, monthGridStart, saDate, weekStart } from "@/lib/operations/calendar";
import { loadCalendar } from "@/lib/operations/calendar-store";
import { AdminErrorState, AdminInfoBanner, AdminPageHeader } from "@/components/admin/ui";
import { CalendarWorkspace } from "@/components/admin/operations/calendar/CalendarWorkspace";

export const metadata: Metadata = { title: "Calendar" };

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const MONTH = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

function href(view: string, date: string) {
  return `/admin/operations/calendar/?view=${view}&date=${date}`;
}

const header = <AdminPageHeader title="Calendar" description="Which team is where, and which jobs still need a date." />;

export default async function CalendarPage(props: { searchParams: Promise<Search> }) {
  try {
    return await CalendarPageInner(props);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[calendar] page:", error instanceof Error ? error.message : error);
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminErrorState title="The calendar could not be loaded." message="Refresh in a moment." />
      </div>
    );
  }
}

async function CalendarPageInner({ searchParams }: { searchParams: Promise<Search> }) {
  {
    const sp = await searchParams;
    const view = one(sp.view) === "month" ? "month" : "week";
    const today = saDate(new Date());
    const anchor = isIsoDate(one(sp.date)) ? one(sp.date) : today;

    const start = view === "week" ? weekStart(anchor) : monthGridStart(anchor);
    const count = view === "week" ? 7 : 42;
    const days = dayList(start, count);
    const end = addDays(start, count);

    const { db, admin } = await adminOpsDb();
    const load = await loadCalendar(db, start, end);

    if (load.state === "not_installed") {
      return (
        <div className="admin-stack--page ops">
          {header}
          <AdminInfoBanner tone="info">
            <strong>The calendar is not switched on yet.</strong>{" "}
            Its database tables have not been added. Nothing else is affected.
          </AdminInfoBanner>
        </div>
      );
    }
    if (load.state === "error") {
      return (
        <div className="admin-stack--page ops">
          {header}
          <AdminErrorState title="The calendar could not be loaded." message="Refresh in a moment." />
        </div>
      );
    }

    const monthAnchor = `${anchor.slice(0, 7)}-15`;
    const rangeLabel =
      view === "week" ? `${SHORT.format(d(start))} – ${SHORT.format(d(addDays(start, 6)))} ${start.slice(0, 4)}` : MONTH.format(d(monthAnchor));
    const step = (n: number) => (view === "week" ? addDays(anchor, 7 * n) : addDays(`${anchor.slice(0, 7)}-01`, n > 0 ? 32 : -1).slice(0, 7) + "-01");

    return (
      <div className="admin-stack--page ops ops-calendar-page">
        {header}
        <CalendarWorkspace
          view={view}
          anchor={view === "week" ? anchor : monthAnchor}
          today={today}
          days={days}
          teams={load.teams}
          bookings={load.bookings}
          backlog={load.backlog}
          projects={load.projects}
          outlookCalendars={load.outlookCalendars}
          canEdit={canPerform(admin.profile.role, "manageOperations")}
          prevHref={href(view, step(-1))}
          nextHref={href(view, step(1))}
          todayHref={href(view, today)}
          weekHref={href("week", anchor)}
          monthHref={href("month", anchor)}
          rangeLabel={rangeLabel}
        />
      </div>
    );
  }
}
