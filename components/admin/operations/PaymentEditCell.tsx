"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import {
  PAYMENT_CELL_TONE,
  PAYMENT_LABELS,
  PAYMENT_LABEL_TEXT,
  type PaymentLabel,
} from "@/lib/operations/board";
import type { BoardProject } from "@/lib/operations/queries";
import { PaymentPictureBadge } from "./PaymentPictureBadge";

const PAYMENT_MENU_OPTIONS: Array<{ value: string; label: string; tone: string }> = [
  { value: "", label: "Unset", tone: "ops-pay--empty" },
  ...PAYMENT_LABELS.map((l) => ({
    value: l,
    label: PAYMENT_LABEL_TEXT[l],
    tone: PAYMENT_CELL_TONE[l],
  })),
];

export function PaymentEditCell({
  project,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const projectRef = useRef(project);
  const onPatchedRef = useRef(onPatched);

  const currentValue = project.payment.label ?? "";
  const selectedIndex = Math.max(
    0,
    PAYMENT_MENU_OPTIONS.findIndex((o) => o.value === currentValue),
  );

  useEffect(() => {
    projectRef.current = project;
    onPatchedRef.current = onPatched;
  }, [project, onPatched]);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const commitPayment = (next: string) => {
    closeMenu();
    void (async () => {
      const result = await updateBoardFieldAction({ id: project.id, field: "payment", value: next });
      if (!result?.ok) {
        window.alert(result?.message || "Could not save.");
        return;
      }
      const current = projectRef.current;
      onPatchedRef.current?.({
        ...current,
        payment: { ...current.payment, label: (next || null) as PaymentLabel | null },
        payment_label_override: next || null,
      });
    })();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const menuHeight = Math.min(280, 8 + PAYMENT_MENU_OPTIONS.length * 34);
      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = spaceBelow < menuHeight + 8 && rect.top > spaceBelow;
      const top = flipUp ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4;
      const width = Math.max(176, rect.width);
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      setMenuStyle({ top, left, width, maxHeight: menuHeight });
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
    const onPointer = (event: MouseEvent) => {
      const t = event.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) =>
          event.key === "ArrowDown"
            ? (i + 1) % PAYMENT_MENU_OPTIONS.length
            : (i - 1 + PAYMENT_MENU_OPTIONS.length) % PAYMENT_MENU_OPTIONS.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveIndex((i) => {
          const option = PAYMENT_MENU_OPTIONS[i];
          if (option) {
            const next = option.value;
            queueMicrotask(() => {
              setOpen(false);
              triggerRef.current?.focus();
              void (async () => {
                const result = await updateBoardFieldAction({
                  id: projectRef.current.id,
                  field: "payment",
                  value: next,
                });
                if (!result?.ok) {
                  window.alert(result?.message || "Could not save.");
                  return;
                }
                const current = projectRef.current;
                onPatchedRef.current?.({
                  ...current,
                  payment: { ...current.payment, label: (next || null) as PaymentLabel | null },
                  payment_label_override: next || null,
                });
              })();
            });
          }
          return i;
        });
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!canEdit) return <PaymentPictureBadge payment={project.payment} />;

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={menuRef}
            className="ops-pay-edit__menu"
            role="listbox"
            style={menuStyle}
            aria-label={`Payment options for ${project.title}`}
          >
            {PAYMENT_MENU_OPTIONS.map((option, index) => (
              <li key={option.value || "unset"}>
                <button
                  type="button"
                  role="option"
                  className={`ops-pay ops-pay--cell ${option.tone}${option.value === currentValue ? " is-selected" : ""}${index === activeIndex ? " is-active" : ""}`}
                  aria-selected={option.value === currentValue}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commitPayment(option.value)}
                >
                  <span className="ops-pay__text">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={`ops-pay-edit ops-pay-edit--cell${open ? " is-open" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        data-ops-cell
        className="ops-pay-edit__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Payment for ${project.title}`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <PaymentPictureBadge payment={project.payment} />
      </button>
      {menu}
    </div>
  );
}
