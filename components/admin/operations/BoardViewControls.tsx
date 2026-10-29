"use client";

import { useSyncExternalStore } from "react";
import { PROJECT_GROUPS, type ProjectGroup } from "@/lib/operations/board";

const COLLAPSE_KEY = "ops-board-collapsed-groups";
const COLLAPSE_EVENT = "ops-board-collapsed";
const FREEZE_KEY = "ops-board-freeze-columns";
const FREEZE_EVENT = "ops-board-freeze";

function subscribeCollapsed(onStoreChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCollapsedRaw(): string {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeFreeze(onStoreChange: () => void) {
  window.addEventListener(FREEZE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(FREEZE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getFreezeRaw(): string {
  try {
    return window.localStorage.getItem(FREEZE_KEY) ?? "1";
  } catch {
    return "1";
  }
}

/** Expand / collapse / freeze controls shared with the board via localStorage. */
export function BoardViewControls() {
  const freezeRaw = useSyncExternalStore(subscribeFreeze, getFreezeRaw, () => "1");
  const frozen = freezeRaw !== "0";
  // Keep collapsed subscription so Expand/Collapse stay in sync with the board.
  useSyncExternalStore(subscribeCollapsed, getCollapsedRaw, () => "");

  const writeCollapsed = (next: ProjectGroup[]) => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
    } catch {
      // Private mode.
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  const setFrozen = (next: boolean) => {
    try {
      window.localStorage.setItem(FREEZE_KEY, next ? "1" : "0");
    } catch {
      // Private mode.
    }
    window.dispatchEvent(new Event(FREEZE_EVENT));
  };

  return (
    <div className="ops-board-view-controls" role="group" aria-label="Board view">
      <button type="button" className="ops-sheet__text-btn" onClick={() => writeCollapsed([])}>
        Expand all
      </button>
      <button type="button" className="ops-sheet__text-btn" onClick={() => writeCollapsed([...PROJECT_GROUPS])}>
        Collapse all
      </button>
      <button
        type="button"
        className={`ops-sheet__text-btn${frozen ? " is-active" : ""}`}
        aria-pressed={frozen}
        onClick={() => setFrozen(!frozen)}
        title={frozen ? "Project and Payment stay fixed while scrolling" : "Pin Project and Payment while scrolling"}
      >
        {frozen ? "📌 Unfreeze columns" : "Freeze columns"}
      </button>
    </div>
  );
}
