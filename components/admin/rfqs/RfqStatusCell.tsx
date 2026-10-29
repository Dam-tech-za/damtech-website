"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { updateRfqStatusAction } from "@/app/admin/rfqs/actions";
import { RFQ_STATUS_LABELS } from "@/lib/admin/rfqs/rfq-inbox-types";

/**
 * Enquiry status as a coloured pill with a dropdown, the same look as the
 * payment column on Projects. Four everyday choices; older statuses still
 * show (e.g. "Site visit") until someone picks a new one.
 */
export const RFQ_QUICK_STATUSES: { value: string; label: string; tone: string }[] = [
  { value: "new", label: "NEW", tone: "ops-pay--invoiced" },
  { value: "information_required", label: "Waiting Info", tone: "ops-pay--portion" },
  { value: "quote_sent", label: "Quote Sent", tone: "ops-pay--paid" },
  { value: "closed", label: "N/A", tone: "ops-pay--not-invoiced" },
];

function pill(status: string): { label: string; tone: string } {
  const quick = RFQ_QUICK_STATUSES.find((s) => s.value === status);
  if (quick) return quick;
  return { label: RFQ_STATUS_LABELS[status] ?? status, tone: "ops-pay--empty" };
}

function Chevron() {
  return (
    <svg className="ops-pay__chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
      <path d="M1 1.2 5 4.8 9 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RfqStatusCell({
  rfqId,
  status,
  label,
  canEdit,
}: {
  rfqId: string;
  status: string;
  /** For screen readers, e.g. the customer name. */
  label: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const shown = pill(current);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(180, rect.width);
      const height = 12 + RFQ_QUICK_STATUSES.length * 36;
      const flip = window.innerHeight - rect.bottom < height + 8 && rect.top > height;
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      setMenuStyle({ top: flip ? rect.top - height - 4 : rect.bottom + 4, left, minWidth: width, width: "max-content" });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: string) => {
    setOpen(false);
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const form = new FormData();
      form.set("rfqId", rfqId);
      form.set("status", next);
      const result = await updateRfqStatusAction(null, form);
      if (!result?.ok) {
        setCurrent(previous);
        window.alert(result?.message || "Could not change the status.");
        return;
      }
      router.refresh();
    });
  };

  const badge = (
    <span className={`ops-pay ops-pay--cell ${shown.tone}${canEdit ? " has-chevron" : ""}`} title={shown.label}>
      <span className="ops-pay__text">{shown.label}</span>
      {canEdit ? <Chevron /> : null}
    </span>
  );

  if (!canEdit) return badge;

  return (
    <div className={`ops-pay-edit ops-pay-edit--cell${open ? " is-open" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="ops-pay-edit__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status for ${label}: ${shown.label}`}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        {badge}
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <ul ref={menuRef} className="ops-pay-edit__menu" role="listbox" style={menuStyle} aria-label={`Status options for ${label}`}>
              {RFQ_QUICK_STATUSES.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === current}
                    className={`ops-pay ops-pay--cell ${option.tone}${option.value === current ? " is-selected" : ""}`}
                    onClick={() => choose(option.value)}
                  >
                    <span className="ops-pay__text">{option.label}</span>
                    {option.value === current ? (
                      <span className="ops-pay__tick" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
