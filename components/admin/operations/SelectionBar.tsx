"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { AdminActionForm } from "@/components/admin/ui";
import {
  bulkArchiveProjectsAction,
  bulkMoveProjectsAction,
  deleteProjectsAction,
  duplicateProjectsAction,
} from "@/app/admin/operations/project-actions";
import { GROUP_LABELS, PROJECT_GROUPS, type ProjectGroup } from "@/lib/operations/board";

function IconDuplicate() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 13V4.5A1.5 1.5 0 0 1 5.5 3H13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 12.5V3.5M10 3.5 7 6.5M10 3.5 13 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12.5v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="3.5" width="14" height="3.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 7v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7M8 10.5h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 6.5h11M8 6.5V4.5h4v2M6.5 6.5l.7 9h5.6l.7-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMove() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h10.5M11 6.5 14.5 10 11 13.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconXero() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 5.5 15 14.5M15 5.5 5 14.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconFromXero() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 3.5v8M10 11.5 7.5 9M10 11.5 12.5 9M4.5 14.5h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5.5 5.5 0 1 0-1.2 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BarButton({
  label,
  danger,
  children,
  onClick,
  type = "button",
  pendingLabel,
  buttonRef,
  pending = false,
  disabled = false,
  title,
  ...rest
}: {
  label: string;
  danger?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  pendingLabel?: string;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  pending?: boolean;
  disabled?: boolean;
  title?: string;
  "aria-haspopup"?: boolean | "menu";
  "aria-expanded"?: boolean;
}) {
  const busy = type === "submit" && pending;
  return (
    <button
      ref={buttonRef}
      type={type}
      className={`ops-selection-bar__btn${danger ? " ops-selection-bar__btn--danger" : ""}`}
      onClick={onClick}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      title={title}
      {...rest}
    >
      <span className="ops-selection-bar__icon">{children}</span>
      <span className="ops-selection-bar__label">{busy ? pendingLabel ?? "…" : label}</span>
    </button>
  );
}

function FormBarButton(props: Omit<Parameters<typeof BarButton>[0], "pending">) {
  const { pending } = useFormStatus();
  return <BarButton {...props} pending={pending} />;
}

type Props = {
  count: number;
  idsValue: string;
  onExport: () => void;
  onClear: () => void;
  linkToXero?: (() => void) | null;
  onFromXero?: (() => void) | null;
  fromXeroEnabled?: boolean;
};

export function SelectionBar({ count, idsValue, onExport, onClear, linkToXero, onFromXero, fromXeroEnabled }: Props) {
  const [moveOpen, setMoveOpen] = useState(false);
  const moveBtnRef = useRef<HTMLButtonElement>(null);
  const moveGroupRef = useRef<HTMLInputElement>(null);
  const [moveStyle, setMoveStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!moveOpen) return;
    const place = () => {
      const btn = moveBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width = 220;
      let left = rect.left + rect.width / 2 - width / 2;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setMoveStyle({
        left,
        bottom: window.innerHeight - rect.top + 8,
        width,
      });
    };
    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoveOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (moveBtnRef.current?.contains(t)) return;
      const pop = document.querySelector(".ops-selection-bar__move-pop");
      if (pop?.contains(t)) return;
      setMoveOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
    };
  }, [moveOpen]);

  const label = count === 1 ? "Item selected" : "Items selected";

  return (
    <div className="ops-selection-bar" role="toolbar" aria-label="Selected projects">
      <span className="ops-selection-bar__badge" aria-hidden="true">
        {count}
      </span>
      <span className="ops-selection-bar__count">{label}</span>

      <AdminActionForm action={duplicateProjectsAction} className="ops-selection-bar__action">
        <input type="hidden" name="ids" value={idsValue} />
        <FormBarButton type="submit" label="Duplicate" pendingLabel="…">
          <IconDuplicate />
        </FormBarButton>
      </AdminActionForm>

      <BarButton label="Export" onClick={onExport}>
        <IconExport />
      </BarButton>

      <AdminActionForm
        action={bulkArchiveProjectsAction}
        className="ops-selection-bar__action"
        confirmMessage="Archive the selected projects? They leave the active board."
      >
        <input type="hidden" name="ids" value={idsValue} />
        <FormBarButton type="submit" label="Archive" pendingLabel="…">
          <IconArchive />
        </FormBarButton>
      </AdminActionForm>

      {onFromXero ? (
        <BarButton
          label="From Xero"
          onClick={fromXeroEnabled ? onFromXero : undefined}
          disabled={!fromXeroEnabled}
          title={fromXeroEnabled ? "Update this project from its linked Xero document" : "Select one project"}
        >
          <IconFromXero />
        </BarButton>
      ) : null}

      <AdminActionForm
        action={deleteProjectsAction}
        className="ops-selection-bar__action"
        confirmMessage="Delete the selected projects? This cannot be undone."
      >
        <input type="hidden" name="ids" value={idsValue} />
        <FormBarButton type="submit" label="Delete" danger pendingLabel="…">
          <IconDelete />
        </FormBarButton>
      </AdminActionForm>

      <AdminActionForm action={bulkMoveProjectsAction} className="ops-selection-bar__action">
        <input type="hidden" name="ids" value={idsValue} />
        <input type="hidden" name="group" ref={moveGroupRef} defaultValue="" />
        <BarButton
          label="Move to"
          buttonRef={moveBtnRef}
          aria-haspopup="menu"
          aria-expanded={moveOpen}
          onClick={() => setMoveOpen((v) => !v)}
        >
          <IconMove />
        </BarButton>
      </AdminActionForm>

      {linkToXero ? (
        <BarButton label="Link Xero" onClick={linkToXero}>
          <IconXero />
        </BarButton>
      ) : null}

      <span className="ops-selection-bar__divider" aria-hidden="true" />

      <button type="button" className="ops-selection-bar__close" aria-label="Clear selection" onClick={onClear}>
        ✕
      </button>

      {moveOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="ops-selection-bar__move-pop" role="menu" style={moveStyle}>
              {PROJECT_GROUPS.map((g: ProjectGroup) => (
                <div key={g} className="ops-selection-bar__move-item">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      const input = moveGroupRef.current;
                      if (!input?.form) return;
                      input.value = g;
                      input.form.requestSubmit();
                      setMoveOpen(false);
                    }}
                  >
                    {GROUP_LABELS[g]}
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
