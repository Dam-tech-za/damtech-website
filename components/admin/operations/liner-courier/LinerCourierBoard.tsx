"use client";

import { useId, useMemo, useState } from "react";
import { IconSearch } from "@/components/admin/board/BoardKit";
import { GroupedSheet, SheetPill, SheetStack, useCollapsedGroups, type SheetColumn } from "@/components/admin/board/GroupedSheet";
import { formatRand } from "@/lib/courier/liner-quote";
import {
  groupLinerQuotes,
  LINER_QUOTE_STAGE_LABELS,
  LINER_QUOTE_STAGE_TONES,
  linerQuoteStage,
  matchesLinerQuoteSearch,
} from "@/lib/courier/liner-board";
import { LinerQuoteDrawer, type DrawerTarget, type LinerCourierHistoryRow } from "./LinerQuoteDrawer";

type Props = {
  rows: LinerCourierHistoryRow[];
  depots: { id: string; label: string }[];
  courierReady: boolean;
  canEditQuotes: boolean;
};

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });

export function LinerCourierBoard({ rows, depots, courierReady, canEditQuotes }: Props) {
  const searchId = useId();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useCollapsedGroups("damtech-admin-liner-courier-collapsed", ["draft"]);
  const [target, setTarget] = useState<DrawerTarget | null>(null);

  const visible = useMemo(() => rows.filter((row) => matchesLinerQuoteSearch(row, q)), [rows, q]);
  const groups = groupLinerQuotes(visible);

  const columns: SheetColumn<LinerCourierHistoryRow>[] = [
    {
      id: "stage",
      label: "Status",
      width: 160,
      render: (row) => {
        const stage = linerQuoteStage(row);
        return <SheetPill label={LINER_QUOTE_STAGE_LABELS[stage]} tone={LINER_QUOTE_STAGE_TONES[stage]} />;
      },
    },
    {
      id: "liner",
      label: "Liner",
      width: 200,
      align: "left",
      render: (row) => (
        <SheetStack
          main={`${row.quantity > 1 ? `${row.quantity} × ` : ""}${row.gsm} gsm · ${Number(row.area_m2)} m²`}
          sub={row.shape === "circular" ? "Round tank" : "Rectangular"}
        />
      ),
    },
    {
      id: "parcel",
      label: "Parcel",
      width: 170,
      align: "left",
      render: (row) => (
        <SheetStack
          main={`${Number(row.parcel_length_cm)}×${Number(row.parcel_width_cm)}×${Number(row.parcel_height_cm)} cm`}
          sub={`${Number(row.weight_kg)} kg`}
        />
      ),
    },
    {
      id: "to",
      label: "Deliver to",
      width: 180,
      align: "left",
      render: (row) => <SheetStack main={row.delivery_address?.city || "—"} sub={row.delivery_address?.province} />,
    },
    {
      id: "rate",
      label: "Courier rate",
      width: 170,
      align: "left",
      render: (row) => {
        const cheapest = row.courier_rates?.[0];
        if (row.chosen_amount != null) return <SheetStack main={formatRand(Number(row.chosen_amount))} sub={row.chosen_service_name ?? undefined} />;
        if (cheapest) return <SheetStack main={formatRand(cheapest.rate)} sub={cheapest.serviceName} />;
        return <span className="ops-peek-muted">—</span>;
      },
    },
    {
      id: "updated",
      label: "Updated",
      width: 110,
      render: (row) => <span className="ops-sheet__num">{shortDate(row.updated_at)}</span>,
    },
  ];

  return (
    <div className="ops-workspace">
      <div className="ops-toolbar">
        <div className="ops-toolbar__row" role="toolbar" aria-label="Board tools">
          <button type="button" className="ops-toolbar__primary" onClick={() => setTarget({ kind: "new" })}>
            New courier quote
          </button>
          <div className={`ops-toolbar__search${searchOpen || q ? " is-open" : ""}`}>
            <button
              type="button"
              className="ops-toolbar__btn"
              aria-expanded={searchOpen || Boolean(q)}
              aria-controls={searchId}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <IconSearch />
              <span>Search</span>
            </button>
            <input
              id={searchId}
              className="ops-toolbar__search-input"
              type="search"
              value={q}
              placeholder="Reference, customer, town"
              aria-label="Search courier quotes"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (q) setQ("");
                  else setSearchOpen(false);
                }
              }}
            />
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="ops-table__meta">No courier quotes yet. Start one with New courier quote.</p>
      ) : visible.length === 0 ? (
        <p className="ops-table__meta">No courier quotes match “{q.trim()}”.</p>
      ) : (
        <GroupedSheet
          groups={groups}
          columns={columns}
          rowKey={(row) => row.id}
          titleLabel="Quote"
          rowName={(row) => `courier quote ${row.reference || row.customer_name || row.id}`}
          renderTitle={(row) => (
            <button type="button" className="ops-purchases__title" onClick={() => setTarget({ kind: "row", row })}>
              <span className="ops-purchases__ref">{row.quotes?.quote_number || row.rfqs?.rfq_number || row.reference || "No reference"}</span>
              <span className="ops-purchases__customer">{row.customer_name || "—"}</span>
            </button>
          )}
          onPeek={(row) => setTarget({ kind: "row", row })}
          selected={selected}
          onSelectedChange={setSelected}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          hideEmptyGroups={Boolean(q.trim())}
          frozen
        />
      )}

      <LinerQuoteDrawer
        target={target}
        depots={depots}
        courierReady={courierReady}
        canEditQuotes={canEditQuotes}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
