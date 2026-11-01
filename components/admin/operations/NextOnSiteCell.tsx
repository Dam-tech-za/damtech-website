import Link from "next/link";
import { BOOKING_STATUS_LABELS, saDate, shortSaDay, type NextOnSite } from "@/lib/operations/calendar";

/** Read-only: bookings are made and changed in the calendar, so this only links there. */
export function NextOnSiteCell({ next }: { next: NextOnSite | null }) {
  if (!next) return <span className="ops-next ops-next--none">—</span>;
  const day = shortSaDay(next.start_at);
  const until = saDate(next.end_at) !== saDate(next.start_at) ? ` – ${shortSaDay(next.end_at)}` : "";
  const status = BOOKING_STATUS_LABELS[next.status];
  const hint = next.late ? `${status}, not marked done. Open in the calendar` : `${status}. Open in the calendar`;
  return (
    <Link
      href={`/admin/operations/calendar/?view=week&date=${saDate(next.start_at)}`}
      className={`ops-next${next.late ? " ops-next--late" : ""}${next.status === "tentative" ? " ops-next--tentative" : ""}`}
      title={`${day}${until} · ${hint}`}
    >
      {day}
    </Link>
  );
}
