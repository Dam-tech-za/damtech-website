"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import { SERVICE_LABELS, SERVICE_SHORT_LABELS } from "@/lib/operations/lifecycle";
import { PROJECT_SERVICES, type ProjectService } from "@/lib/operations/types";
import type { BoardProject } from "@/lib/operations/queries";

/** Board pill for the project type; same shape as the Payment pill, its own colours. */
export function ServicePill({ service, chevron = false }: { service: ProjectService; chevron?: boolean }) {
  return (
    <span className={`ops-pay ops-pay--cell ops-type--${service}`} title={SERVICE_LABELS[service]}>
      <span className="ops-pay__text">{SERVICE_SHORT_LABELS[service]}</span>
      {chevron ? (
        <span className="ops-pay__chevron" aria-hidden="true">
          ▾
        </span>
      ) : null}
    </span>
  );
}

export function ServiceEditCell({
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
  const current = project.service;

  useEffect(() => {
    projectRef.current = project;
    onPatchedRef.current = onPatched;
  }, [project, onPatched]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const commit = (next: ProjectService) => {
    close();
    if (next === projectRef.current.service) return;
    void (async () => {
      const result = await updateBoardFieldAction({ id: projectRef.current.id, field: "service", value: next });
      if (!result?.ok) {
        window.alert(result?.message || "Could not save.");
        return;
      }
      onPatchedRef.current?.({ ...projectRef.current, service: next });
    })();
  };
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(200, rect.width, menuRef.current?.offsetWidth ?? 0);
      const menuHeight = Math.min(360, 12 + PROJECT_SERVICES.length * 36);
      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = spaceBelow < menuHeight + 8 && rect.top > spaceBelow;
      const top = flipUp ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4;
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      setMenuStyle({ top, left, minWidth: width, width: "max-content", maxHeight: menuHeight });
    };
    place();
    const raf = window.requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.cancelAnimationFrame(raf);
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
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((i) => (i + step + PROJECT_SERVICES.length) % PROJECT_SERVICES.length);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveIndex((i) => {
          const next = PROJECT_SERVICES[i];
          if (next) queueMicrotask(() => commitRef.current(next));
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

  if (!canEdit) return <ServicePill service={current} />;

  const openMenu = () => {
    setActiveIndex(Math.max(0, PROJECT_SERVICES.indexOf(current)));
    setOpen(true);
  };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul ref={menuRef} className="ops-pay-edit__menu" role="listbox" style={menuStyle} aria-label={`Type options for ${project.title}`}>
            {PROJECT_SERVICES.map((s, index) => (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  className={`ops-pay ops-pay--cell ops-type--${s}${s === current ? " is-selected" : ""}${index === activeIndex ? " is-active" : ""}`}
                  aria-selected={s === current}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(s)}
                >
                  <span className="ops-pay__text">{SERVICE_LABELS[s]}</span>
                  {s === current ? (
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
        aria-label={`Type for ${project.title}: ${SERVICE_LABELS[current]}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <ServicePill service={current} chevron />
      </button>
      {menu}
    </div>
  );
}
