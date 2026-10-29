"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { sendEnquiriesToXeroAction } from "@/app/admin/rfqs/actions";
import { RFQ_QUICK_STATUSES } from "./RfqStatusCell";

type StaffMember = {
  id: string;
  email: string;
  full_name: string | null;
};

function IconStatus() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3.5" y="5.5" width="13" height="9" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="10" r="1.4" fill="currentColor" />
    </svg>
  );
}

function IconPerson() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="7" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 16c.9-3 2.8-4.5 5.5-4.5s4.6 1.5 5.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSendXero() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 12.5V4.5M10 4.5 7.5 7M10 4.5 12.5 7M4.5 15.5h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarButton({
  label,
  children,
  onClick,
  buttonRef,
  pending = false,
  disabled = false,
  title,
  ...rest
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  pending?: boolean;
  disabled?: boolean;
  title?: string;
  "aria-haspopup"?: boolean | "menu";
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="ops-selection-bar__btn"
      onClick={onClick}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      title={title ?? label}
      {...rest}
    >
      <span className="ops-selection-bar__icon">{children}</span>
      <span className="ops-selection-bar__label">{pending ? "…" : label}</span>
    </button>
  );
}

function MenuPop({
  open,
  anchorRef,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
}) {
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = anchorRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width = 220;
      let left = rect.left + rect.width / 2 - width / 2;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setStyle({
        left,
        bottom: window.innerHeight - rect.top + 8,
        width,
      });
    };
    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      const pop = document.querySelector(".ops-selection-bar__move-pop");
      if (pop?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="ops-selection-bar__move-pop" role="menu" aria-labelledby={labelledBy} style={style}>
      {children}
    </div>,
    document.body,
  );
}

type RfqBulkActionsProps = {
  selectedCount: number;
  staff: StaffMember[];
  canManage: boolean;
  onClear: () => void;
  onToast: (message: string) => void;
  bulkStatusAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  bulkAssignAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  selectedIds: string[];
};

/**
 * Floating selection card, the same bottom bar as Projects: a count badge
 * and icon actions, instead of a strip that pushes the table down.
 */
export function RfqBulkActions({
  selectedCount,
  staff,
  canManage,
  onClear,
  onToast,
  bulkStatusAction,
  bulkAssignAction,
  selectedIds,
}: RfqBulkActionsProps) {
  const router = useRouter();
  const [menu, setMenu] = useState<null | "status" | "assign">(null);
  const [pending, startTransition] = useTransition();
  const statusBtn = useRef<HTMLButtonElement>(null);
  const assignBtn = useRef<HTMLButtonElement>(null);

  if (selectedCount === 0) return null;

  const label = selectedCount === 1 ? "Item selected" : "Items selected";

  const withIds = () => {
    const form = new FormData();
    for (const id of selectedIds) form.append("rfqIds", id);
    return form;
  };

  const chooseStatus = (status: string) => {
    setMenu(null);
    startTransition(async () => {
      const form = withIds();
      form.set("status", status);
      const result = await bulkStatusAction(form);
      if (!result.ok) onToast(result.error || "Could not update status.");
    });
  };

  const chooseAssign = (assignedTo: string) => {
    setMenu(null);
    startTransition(async () => {
      const form = withIds();
      form.set("assignedTo", assignedTo);
      const result = await bulkAssignAction(form);
      if (!result.ok) onToast(result.error || "Could not assign.");
    });
  };

  return (
    <div className="ops-selection-bar" role="toolbar" aria-label="Selected enquiries">
      <span className="ops-selection-bar__badge" aria-hidden="true">
        {selectedCount}
      </span>
      <span className="ops-selection-bar__count">{label}</span>

      {canManage ? (
        <>
          <BarButton
            label="Status"
            buttonRef={statusBtn}
            aria-haspopup="menu"
            aria-expanded={menu === "status"}
            pending={pending}
            onClick={() => setMenu((v) => (v === "status" ? null : "status"))}
          >
            <IconStatus />
          </BarButton>

          <BarButton
            label="Assign"
            buttonRef={assignBtn}
            aria-haspopup="menu"
            aria-expanded={menu === "assign"}
            pending={pending}
            onClick={() => setMenu((v) => (v === "assign" ? null : "assign"))}
          >
            <IconPerson />
          </BarButton>

          <BarButton
            label="Send to Xero"
            pending={pending}
            onClick={() => {
              setMenu(null);
              startTransition(async () => {
                const result = await sendEnquiriesToXeroAction(selectedIds);
                onToast(result.message);
                if (result.ok) router.refresh();
              });
            }}
          >
            <IconSendXero />
          </BarButton>
        </>
      ) : null}

      <span className="ops-selection-bar__divider" aria-hidden="true" />

      <button type="button" className="ops-selection-bar__close" aria-label="Clear selection" onClick={onClear}>
        ✕
      </button>

      <MenuPop open={menu === "status"} anchorRef={statusBtn} onClose={() => setMenu(null)}>
        {RFQ_QUICK_STATUSES.map((status) => (
          <div key={status.value} className="ops-selection-bar__move-item">
            <button type="button" role="menuitem" onClick={() => chooseStatus(status.value)}>
              {status.label}
            </button>
          </div>
        ))}
      </MenuPop>

      <MenuPop open={menu === "assign"} anchorRef={assignBtn} onClose={() => setMenu(null)}>
        <div className="ops-selection-bar__move-item">
          <button type="button" role="menuitem" onClick={() => chooseAssign("__unassigned__")}>
            Unassigned
          </button>
        </div>
        {staff.map((person) => (
          <div key={person.id} className="ops-selection-bar__move-item">
            <button type="button" role="menuitem" onClick={() => chooseAssign(person.id)}>
              {person.full_name || person.email}
            </button>
          </div>
        ))}
      </MenuPop>
    </div>
  );
}
