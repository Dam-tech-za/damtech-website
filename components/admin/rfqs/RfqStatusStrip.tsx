import Link from "next/link";
import {
  RFQ_STATUS_STRIP,
  type RfqInboxFilters,
} from "@/lib/admin/rfqs/rfq-inbox-types";
import { buildFilterParams } from "@/lib/admin/rfqs/rfq-inbox-utils";
import type { RfqStatusCounts } from "@/lib/rfq/list";

type RfqStatusStripProps = {
  counts: RfqStatusCounts;
  filters: RfqInboxFilters;
};

export function RfqStatusStrip({ counts, filters }: RfqStatusStripProps) {
  return (
    <nav className="rfq-status-strip" aria-label="RFQ status summary">
      <ul className="rfq-status-strip__list">
        {RFQ_STATUS_STRIP.map((segment, index) => {
          const params = buildFilterParams(filters, ["status", "page"]);
          params.set("status", segment.key);
          const active = filters.status === segment.key;
          return (
            <li key={segment.key} className="rfq-status-strip__item">
              {index > 0 ? (
                <span className="rfq-status-strip__sep" aria-hidden>
                  |
                </span>
              ) : null}
              <Link
                href={`/admin/rfqs/?${params.toString()}`}
                className={`rfq-status-strip__link${active ? " is-active" : ""}`}
                aria-current={active ? "true" : undefined}
              >
                <span className="rfq-status-strip__label">{segment.label}</span>
                <span className="rfq-status-strip__count">
                  {counts[segment.key] ?? 0}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
