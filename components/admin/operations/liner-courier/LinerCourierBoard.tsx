"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@/components/admin/board/BoardKit";
import { GroupedSheet, SheetPill, SheetStack, useCollapsedGroups, type SheetColumn } from "@/components/admin/board/GroupedSheet";
import { formatRand } from "@/lib/courier/liner-quote";
import {
  groupLinerQuotes,
  LINER_QUOTE_STAGE_LABELS,
  LINER_QUOTE_STAGE_TONES,
  linerQuoteStage,
  matchesLinerQuoteSearch,
  type LinerCourierHistoryRow,
} from "@/lib/courier/liner-board";
import { LinerQuoteDrawer } from "./LinerQuoteDrawer";
import { LinerQuoteModal } from "./LinerQuoteModal";

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
  const router = useRouter();
  const [modal, setModal] = useState<"new" | LinerCourierHistoryRow | null>(null);
  // The open quote: its id, plus the copy the card just saved (shown until the board refreshes).
  const [peek, setPeek] = useState<{ id: string; local: LinerCourierHistoryRow | null } | null>(null);
  const peekRow = peek ? (rows.find((row) => row.id === peek.id && (!peek.local || row.updated_at >= peek.local.updated_at)) ?? peek.local ?? rows.find((row) => row.id === peek.id) ?? null) : null;
  const openRow = (row: LinerCourierHistoryRow) => setPeek({ id: row.id, local: null });

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
          <button type="button" className="ops-toolbar__primary" onClick={() => setModal("new")}>
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
            <button type="button" className="ops-purchases__title" onClick={() => openRow(row)}>
              <span className="ops-purchases__ref">{row.quotes?.quote_number || row.rfqs?.rfq_number || row.reference || "No reference"}</span>
              <span className="ops-purchases__customer">{row.customer_name || "—"}</span>
            </button>
          )}
          onPeek={openRow}
          selected={selected}
          onSelectedChange={setSelected}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          hideEmptyGroups={Boolean(q.trim())}
          frozen
        />
      )}

      <LinerQuoteModal
        target={modal}
        depots={depots}
        courierReady={courierReady}
        onClose={() => setModal(null)}
        onDone={(row) => {
          setModal(null);
          setPeek({ id: row.id, local: row });
          router.refresh();
        }}
      />
      <LinerQuoteDrawer
        row={modal ? null : peekRow}
        canEditQuotes={canEditQuotes}
        onClose={() => setPeek(null)}
        onEdit={(row) => setModal(row)}
      />
    </div>
  );
}
