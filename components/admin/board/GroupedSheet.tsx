"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

/**
 * Monday-style board shared by the admin boards: coloured, collapsible groups,
 * a checkbox column, a frozen name column with a quick-view button, and any
 * number of further columns. Styling lives in the ops-sheet rules.
 */

export type SheetColumn<T> = {
  id: string;
  label: string;
  /** Column width in px. */
  width: number;
  align?: "left" | "center";
  render: (row: T) => ReactNode;
};

export type SheetGroup<T> = {
  id: string;
  label: string;
  /** Group colour, one of the .ops-tone-* names. */
  tone: string;
  rows: T[];
};

type Props<T> = {
  groups: SheetGroup<T>[];
  columns: SheetColumn<T>[];
  rowKey: (row: T) => string;
  /** Heading of the frozen name column. */
  titleLabel: string;
  renderTitle: (row: T) => ReactNode;
  /** Plain name of the row, for screen readers. */
  rowName: (row: T) => string;
  onPeek: (row: T) => void;
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  /** Folded group ids (see useCollapsedGroups). */
  collapsed: string[];
  onCollapsedChange: (next: string[]) => void;
  hideEmptyGroups?: boolean;
  frozen?: boolean;
};

const COLLAPSE_EVENT = "ops-sheet-collapsed";
const TITLE_MIN = 280;
const CHECK_WIDTH = 36;

function subscribe(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStored(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/** Folded group ids, kept per board in localStorage; `defaults` apply until the user folds anything. */
export function useCollapsedGroups(key: string, defaults: readonly string[] = []): [string[], (next: string[]) => void] {
  const raw = useSyncExternalStore(subscribe, () => readStored(key), () => "");
  const defaultsKey = defaults.join("|");
  const collapsed = useMemo(() => {
    if (!raw) return defaultsKey ? defaultsKey.split("|") : [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }, [raw, defaultsKey]);
  const write = (next: string[]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode.
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };
  return [collapsed, write];
}

export function GroupedSheet<T>({
  groups,
  columns,
  rowKey,
  titleLabel,
  renderTitle,
  rowName,
  onPeek,
  selected,
  onSelectedChange,
  collapsed,
  onCollapsedChange: setCollapsed,
  hideEmptyGroups = false,
  frozen = true,
}: Props<T>) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleThRef = useRef<HTMLTableCellElement>(null);
  const shown = hideEmptyGroups ? groups.filter((g) => g.rows.length > 0) : groups;
  const allIds = shown.flatMap((g) => g.rows.map(rowKey));
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const colSpan = 2 + columns.length;
  const minWidth = CHECK_WIDTH + TITLE_MIN + columns.reduce((sum, c) => sum + c.width, 0);

  // Group bands span the visible scroller width; the frozen column needs the measured title width.
  useEffect(() => {
    const sheet = sheetRef.current;
    const scroll = scrollRef.current;
    const th = titleThRef.current;
    if (!sheet || !scroll) return;
    const sync = () => {
      if (th) sheet.style.setProperty("--col-project", `${Math.round(th.getBoundingClientRect().width)}px`);
      sheet.style.setProperty("--ops-scroll-width", `${scroll.clientWidth}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(scroll);
    if (th) observer.observe(th);
    return () => observer.disconnect();
  }, [columns.length]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  };

  return (
    <div
      ref={sheetRef}
      className={`ops-sheet ops-sheet--generic${frozen ? " ops-sheet--frozen" : ""}${selected.size ? " ops-sheet--has-selection" : ""}`}
      style={{ "--ops-sheet-min": `${minWidth}px` } as CSSProperties}
    >
      <div ref={scrollRef} className="ops-sheet__scroll">
        <table className="admin-table ops-table ops-sheet__table">
          <colgroup>
            <col className="ops-sheet__col-check" />
            <col className="ops-sheet__col-project" />
            {columns.map((c) => (
              <col key={c.id} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="ops-sheet__c-check ops-sheet__sticky" scope="col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onSelectedChange(allSelected ? new Set() : new Set(allIds))}
                  aria-label="Select all"
                />
              </th>
              <th ref={titleThRef} className="ops-sheet__c-project ops-sheet__sticky" scope="col">
                {titleLabel}
              </th>
              {columns.map((c) => (
                <th key={c.id} scope="col" className={c.align === "left" ? "ops-sheet__c-left" : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          {shown.map((group) => {
            const open = !collapsed.includes(group.id);
            return (
              <tbody key={group.id} className={`ops-sheet__group ops-tone-${group.tone}${open ? "" : " is-collapsed"}`}>
                <tr className="ops-sheet__group-row">
                  <th colSpan={colSpan} scope="colgroup">
                    <div className="ops-sheet__sticky-row">
                      <button
                        type="button"
                        className="ops-sheet__group-btn"
                        aria-expanded={open}
                        onClick={() => setCollapsed(open ? [...collapsed, group.id] : collapsed.filter((g) => g !== group.id))}
                      >
                        <span className="ops-sheet__chevron" aria-hidden="true">
                          {open ? "▾" : "▸"}
                        </span>
                        {group.label}
                        <span className="ops-group__count">{group.rows.length}</span>
                      </button>
                    </div>
                  </th>
                </tr>
                {open && group.rows.length === 0 ? (
                  <tr className="ops-sheet__empty-row">
                    <td colSpan={colSpan}>
                      <div className="ops-sheet__sticky-row">Nothing here.</div>
                    </td>
                  </tr>
                ) : null}
                {open
                  ? group.rows.map((row) => {
                      const id = rowKey(row);
                      return (
                        <tr key={id} className={selected.has(id) ? "is-selected" : undefined}>
                          <td className="ops-sheet__c-check ops-sheet__sticky">
                            <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} aria-label={`Select ${rowName(row)}`} />
                          </td>
                          <td className="ops-sheet__c-project ops-sheet__sticky">
                            <div className="ops-title-cell">
                              <span className="ops-title-cell__text">{renderTitle(row)}</span>
                              <button
                                type="button"
                                className="ops-title-cell__peek"
                                aria-label={`Open quick view of ${rowName(row)}`}
                                title="Quick view"
                                onClick={() => onPeek(row)}
                              >
                                ▸
                              </button>
                            </div>
                          </td>
                          {columns.map((c) => (
                            <td key={c.id} className={c.align === "left" ? "ops-sheet__c-left" : undefined}>
                              {c.render(row)}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

/** Coloured status pill used in board cells. */
export function SheetPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`ops-pay ops-pay--cell ops-pay--static ops-tone-${tone}`}>
      <span className="ops-pay__text">{label}</span>
    </span>
  );
}

/** Two-line cell: main text and a muted line under it. */
export function SheetStack({ main, sub }: { main: ReactNode; sub?: ReactNode }) {
  return (
    <span className="ops-sheet__stack">
      <span className="ops-sheet__stack-main">{main}</span>
      {sub ? <span className="ops-sheet__stack-sub">{sub}</span> : null}
    </span>
  );
}
