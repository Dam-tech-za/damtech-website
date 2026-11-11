"use client";

import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { CourierTestPanel } from "@/components/admin/CourierTestPanel";
import {
  Chevron,
  IconFilter,
  IconHide,
  IconMore,
  IconSearch,
  IconSort,
  ToolbarPopover,
} from "@/components/admin/board/BoardKit";
import { GroupedSheet, SheetPill, SheetStack, useCollapsedGroups, type SheetColumn } from "@/components/admin/board/GroupedSheet";
import { formatZar } from "@/lib/estimating/money";
import type { OnlinePurchaseRow } from "@/lib/orders/list";
import {
  groupPurchases,
  matchesPurchaseSearch,
  PAYMENT_FILTER_LABELS,
  PURCHASE_SORT_LABELS,
  PURCHASE_STAGE_TONES,
  purchaseAmountDue,
  purchaseFulfilment,
  purchasePaymentKind,
  purchasePaymentPill,
  purchaseShortDate,
  purchasesCsv,
  sortPurchases,
  type PaymentFilter,
  type PurchaseCourierSetup,
  type PurchaseRowExtras,
  type PurchaseSort,
} from "@/lib/orders/purchase-board";
import { makeByDate, PURCHASE_STAGE_LABELS, PURCHASE_STAGES, purchaseStage, type PurchaseStage } from "@/lib/orders/purchase-stage";
import { isCollectionMethod } from "@/lib/shop/delivery";
import { OrderPeekDrawer } from "./OrderPeekDrawer";

const COLLAPSE_KEY = "damtech-admin-purchases-collapsed";
const DEFAULT_COLLAPSED: PurchaseStage[] = ["delivered", "cancelled"];
const PAYMENT_FILTERS = Object.keys(PAYMENT_FILTER_LABELS) as PaymentFilter[];
type Fulfilment = "" | "delivery" | "collection";
type Popover = "filter" | "sort" | "hide" | "more" | "courier" | null;

type Props = {
  rows: OnlinePurchaseRow[];
  extras: Record<string, PurchaseRowExtras>;
  courier: PurchaseCourierSetup;
  canManage: boolean;
  initialStage: PurchaseStage | null;
  initialOrderId: string | null;
  initialQ: string;
};

function download(csv: string, name: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Keep ?order= in the address bar so a refresh or shared link reopens the panel. */
function setOrderParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("order", id);
  else url.searchParams.delete("order");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
}

function IconExport() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M8 2.5v7M5 6.5l3 3 3-3M3 11.5v2h10v-2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2.5 4h11v8h-11zM2.5 4.5 8 8.5l5.5-4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

function BarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="ops-selection-bar__btn" onClick={onClick}>
      <span className="ops-selection-bar__icon">{children}</span>
      <span className="ops-selection-bar__label">{label}</span>
    </button>
  );
}

export function PurchasesWorkspace({ rows, extras, courier, canManage, initialStage, initialOrderId, initialQ }: Props) {
  const searchId = useId();
  const [q, setQ] = useState(initialQ);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQ));
  const [stages, setStages] = useState<PurchaseStage[]>(initialStage ? [initialStage] : []);
  const [payments, setPayments] = useState<PaymentFilter[]>([]);
  const [fulfilment, setFulfilment] = useState<Fulfilment>("");
  const [sort, setSort] = useState<PurchaseSort>("newest");
  const [hidden, setHidden] = useState<string[]>([]);
  const [frozen, setFrozen] = useState(true);
  const [open, setOpen] = useState<Popover>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [peekId, setPeekId] = useState<string | null>(initialOrderId);
  const [collapsed, setCollapsed] = useCollapsedGroups(COLLAPSE_KEY, DEFAULT_COLLAPSED);
  const filterBtn = useRef<HTMLButtonElement>(null);
  const sortBtn = useRef<HTMLButtonElement>(null);
  const hideBtn = useRef<HTMLButtonElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);

  const visible = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (stages.length && !stages.includes(purchaseStage(row))) return false;
      if (payments.length && !payments.includes(purchasePaymentKind(row))) return false;
      if (fulfilment && isCollectionMethod(row.fulfilment_method) !== (fulfilment === "collection")) return false;
      return matchesPurchaseSearch(row, q);
    });
    return sortPurchases(filtered, sort);
  }, [rows, stages, payments, fulfilment, q, sort]);

  const filterActive = Boolean(q.trim() || stages.length || payments.length || fulfilment);
  const filterCount = stages.length + payments.length + (fulfilment ? 1 : 0);
  const groups = groupPurchases(visible).map((g) => ({ id: g.stage, label: g.label, tone: g.tone, rows: g.rows }));
  const peekOrder = rows.find((row) => row.id === peekId) ?? null;
  const selectedRows = rows.filter((row) => selected.has(row.id));

  const openPeek = useCallback((row: OnlinePurchaseRow) => {
    setPeekId(row.id);
    setOrderParam(row.id);
  }, []);
  const closePeek = useCallback(() => {
    setPeekId(null);
    setOrderParam(null);
  }, []);

  const clearAll = () => {
    setQ("");
    setStages([]);
    setPayments([]);
    setFulfilment("");
  };
  const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const columns: SheetColumn<OnlinePurchaseRow>[] = [
    {
      id: "stage",
      label: "Stage",
      width: 150,
      render: (row) => {
        const stage = purchaseStage(row);
        return <SheetPill label={PURCHASE_STAGE_LABELS[stage]} tone={PURCHASE_STAGE_TONES[stage]} />;
      },
    },
    {
      id: "payment",
      label: "Payment",
      width: 170,
      render: (row) => {
        const pay = purchasePaymentPill(row);
        return <SheetPill label={pay.label} tone={pay.tone} />;
      },
    },
    {
      id: "product",
      label: "Product",
      width: 230,
      align: "left",
      render: (row) => <SheetStack main={`${row.quantity} × ${row.product_name_snapshot}`} sub={row.sku} />,
    },
    {
      id: "total",
      label: "Total",
      width: 120,
      render: (row) => <span className="ops-sheet__num">{formatZar(purchaseAmountDue(row))}</span>,
    },
    {
      id: "delivery",
      label: "Delivery or collection",
      width: 170,
      align: "left",
      render: (row) => {
        const place = purchaseFulfilment(row);
        return <SheetStack main={place.label} sub={place.detail} />;
      },
    },
    {
      id: "tracking",
      label: "Courier and tracking",
      width: 190,
      align: "left",
      render: (row) =>
        row.courier_name || row.tracking_number ? (
          <SheetStack
            main={row.courier_name || "Courier not set"}
            sub={extras[row.id]?.courierSummary || row.tracking_number || "No tracking number"}
          />
        ) : (
          <span className="ops-peek-muted">—</span>
        ),
    },
    {
      id: "dates",
      label: "Dates",
      width: 150,
      align: "left",
      render: (row) => {
        const makeBy = purchaseStage(row) === "to_make" ? makeByDate(row) : null;
        const sub = row.delivered_on
          ? `Delivered ${purchaseShortDate(row.delivered_on)}`
          : row.dispatched_on
            ? `Dispatched ${purchaseShortDate(row.dispatched_on)}`
            : makeBy
              ? `Make by ${purchaseShortDate(makeBy)}`
              : undefined;
        return <SheetStack main={`Ordered ${purchaseShortDate(row.created_at)}`} sub={sub} />;
      },
    },
    {
      id: "contact",
      label: "Contact",
      width: 210,
      align: "left",
      render: (row) => <SheetStack main={row.email} sub={row.phone} />,
    },
  ];
  const shownColumns = columns.filter((c) => !hidden.includes(c.id));

  const chips: { key: string; label: string; clear: () => void }[] = [
    ...(q.trim() ? [{ key: "q", label: `“${q.trim()}”`, clear: () => setQ("") }] : []),
    ...stages.map((s) => ({ key: `s-${s}`, label: PURCHASE_STAGE_LABELS[s], clear: () => setStages((v) => v.filter((x) => x !== s)) })),
    ...payments.map((p) => ({ key: `p-${p}`, label: PAYMENT_FILTER_LABELS[p], clear: () => setPayments((v) => v.filter((x) => x !== p)) })),
    ...(fulfilment ? [{ key: "f", label: fulfilment === "collection" ? "Customer collects" : "Courier delivery", clear: () => setFulfilment("") }] : []),
  ];

  return (
    <div className="ops-workspace ops-purchases">
      <div className="ops-toolbar">
        <div className="ops-toolbar__row" role="toolbar" aria-label="Board tools">
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
              placeholder="Reference, customer, SKU, tracking"
              aria-label="Search online purchases"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (q) setQ("");
                  else setSearchOpen(false);
                }
              }}
            />
          </div>

          <button
            ref={filterBtn}
            type="button"
            className={`ops-toolbar__btn${filterCount ? " is-active" : ""}`}
            aria-expanded={open === "filter"}
            onClick={() => setOpen((v) => (v === "filter" ? null : "filter"))}
          >
            <IconFilter />
            <span>Filter</span>
            <Chevron />
            {filterCount ? <span className="ops-toolbar__dot" aria-label={`${filterCount} filters`} /> : null}
          </button>

          <button
            ref={sortBtn}
            type="button"
            className={`ops-toolbar__btn${sort !== "newest" ? " is-active" : ""}`}
            aria-expanded={open === "sort"}
            onClick={() => setOpen((v) => (v === "sort" ? null : "sort"))}
          >
            <IconSort />
            <span>Sort</span>
          </button>

          <button
            ref={hideBtn}
            type="button"
            className={`ops-toolbar__btn${hidden.length ? " is-active" : ""}`}
            aria-expanded={open === "hide"}
            onClick={() => setOpen((v) => (v === "hide" ? null : "hide"))}
          >
            <IconHide />
            <span>Hide</span>
          </button>

          <button
            ref={moreBtn}
            type="button"
            className="ops-toolbar__btn ops-toolbar__btn--icon"
            aria-label="More board actions"
            aria-expanded={open === "more" || open === "courier"}
            onClick={() => setOpen((v) => (v === "more" || v === "courier" ? null : "more"))}
          >
            <IconMore />
          </button>
        </div>

        {chips.length ? (
          <div className="ops-toolbar__chips" aria-label="Active filters">
            {chips.map((chip) => (
              <button key={chip.key} type="button" className="ops-toolbar__chip" onClick={chip.clear}>
                {chip.label} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="ops-toolbar__chip-clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        ) : null}

        <ToolbarPopover open={open === "filter"} anchorRef={filterBtn} onClose={() => setOpen(null)} width={320}>
          <p className="ops-toolbar__popover-title">Filter</p>
          <div className="ops-toolbar__form">
            <fieldset>
              <legend>Stage</legend>
              <div className="ops-toolbar__chips-inline">
                {PURCHASE_STAGES.map((s) => (
                  <button key={s} type="button" className={`ops-toolbar__chip${stages.includes(s) ? " is-on" : ""}`} onClick={() => setStages((v) => toggle(v, s))}>
                    {PURCHASE_STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Payment</legend>
              <div className="ops-toolbar__chips-inline">
                {PAYMENT_FILTERS.map((p) => (
                  <button key={p} type="button" className={`ops-toolbar__chip${payments.includes(p) ? " is-on" : ""}`} onClick={() => setPayments((v) => toggle(v, p))}>
                    {PAYMENT_FILTER_LABELS[p]}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              Delivery
              <select className="admin-select" value={fulfilment} onChange={(e) => setFulfilment(e.target.value as Fulfilment)}>
                <option value="">Delivery and collection</option>
                <option value="delivery">Courier delivery</option>
                <option value="collection">Customer collects</option>
              </select>
            </label>
            <button type="button" className="ops-toolbar__text-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </ToolbarPopover>

        <ToolbarPopover open={open === "sort"} anchorRef={sortBtn} onClose={() => setOpen(null)} width={220}>
          <p className="ops-toolbar__popover-title">Sort by</p>
          <ul className="ops-toolbar__radio-list">
            {(Object.keys(PURCHASE_SORT_LABELS) as PurchaseSort[]).map((value) => (
              <li key={value}>
                <label>
                  <input type="radio" name="purchases-sort" checked={sort === value} onChange={() => setSort(value)} />
                  {PURCHASE_SORT_LABELS[value]}
                </label>
              </li>
            ))}
          </ul>
        </ToolbarPopover>

        <ToolbarPopover open={open === "hide"} anchorRef={hideBtn} onClose={() => setOpen(null)} width={220}>
          <p className="ops-toolbar__popover-title">Hide columns</p>
          <ul className="ops-toolbar__check-list">
            {columns.map((col) => (
              <li key={col.id}>
                <label>
                  <input type="checkbox" checked={hidden.includes(col.id)} onChange={() => setHidden((v) => toggle(v, col.id))} />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
        </ToolbarPopover>

        <ToolbarPopover open={open === "more"} anchorRef={moreBtn} onClose={() => setOpen(null)} width={220}>
          <ul className="ops-toolbar__menu-list">
            <li>
              <button type="button" onClick={() => { setCollapsed([]); setOpen(null); }}>
                Expand all
              </button>
            </li>
            <li>
              <button type="button" onClick={() => { setCollapsed([...PURCHASE_STAGES]); setOpen(null); }}>
                Collapse all
              </button>
            </li>
            <li>
              <button type="button" onClick={() => { setFrozen(!frozen); setOpen(null); }}>
                {frozen ? "Unfreeze columns" : "Freeze columns"}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => { download(purchasesCsv(visible), "damtech-online-purchases.csv"); setOpen(null); }}>
                Export CSV
              </button>
            </li>
            {canManage ? (
              <li>
                <button type="button" onClick={() => setOpen("courier")}>
                  Test Courier Guy connection
                </button>
              </li>
            ) : null}
          </ul>
        </ToolbarPopover>

        <ToolbarPopover open={open === "courier"} anchorRef={moreBtn} onClose={() => setOpen(null)} width={340}>
          <p className="ops-toolbar__popover-title">The Courier Guy</p>
          <p className="ops-table__meta">Check that rates come back. This books nothing.</p>
          <CourierTestPanel />
        </ToolbarPopover>
      </div>

      {rows.length === 0 ? (
        <p className="ops-table__meta">No online purchases yet.</p>
      ) : visible.length === 0 ? (
        <p className="ops-table__meta">No orders match these filters.</p>
      ) : null}

      {rows.length > 0 ? (
        <GroupedSheet
          groups={groups}
          columns={shownColumns}
          rowKey={(row) => row.id}
          titleLabel="Order"
          rowName={(row) => `order ${row.order_reference}`}
          renderTitle={(row) => (
            <button type="button" className="ops-purchases__title" onClick={() => openPeek(row)}>
              <span className="ops-purchases__ref">{row.order_reference}</span>
              <span className="ops-purchases__customer">{row.business_name || row.customer_name}</span>
            </button>
          )}
          onPeek={openPeek}
          selected={selected}
          onSelectedChange={setSelected}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          hideEmptyGroups={filterActive}
          frozen={frozen}
        />
      ) : null}

      {selectedRows.length > 0 ? (
        <div className="ops-selection-bar" role="toolbar" aria-label="Selected orders">
          <span className="ops-selection-bar__badge" aria-hidden="true">
            {selectedRows.length}
          </span>
          <span className="ops-selection-bar__count">{selectedRows.length === 1 ? "Order selected" : "Orders selected"}</span>
          <BarButton label="Export" onClick={() => download(purchasesCsv(selectedRows), "damtech-online-purchases-selected.csv")}>
            <IconExport />
          </BarButton>
          <BarButton
            label="Email"
            onClick={() => {
              const emails = [...new Set(selectedRows.map((row) => row.email))].join(",");
              window.location.href = `mailto:?bcc=${encodeURIComponent(emails)}`;
            }}
          >
            <IconMail />
          </BarButton>
          <span className="ops-selection-bar__divider" aria-hidden="true" />
          <button type="button" className="ops-selection-bar__close" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
            ×
          </button>
        </div>
      ) : null}

      <OrderPeekDrawer
        order={peekOrder}
        extras={peekOrder ? extras[peekOrder.id] : undefined}
        courier={courier}
        canManage={canManage}
        onClose={closePeek}
      />
    </div>
  );
}