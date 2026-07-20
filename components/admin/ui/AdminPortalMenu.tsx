"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type AdminPortalMenuItem = {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  tone?: "default" | "danger";
  separator?: boolean;
  hidden?: boolean;
  icon?: ReactNode;
};

type AdminPortalMenuProps = {
  items: AdminPortalMenuItem[];
  triggerLabel: string;
  triggerClassName?: string;
  menuClassName?: string;
  align?: "start" | "end";
  children?: ReactNode;
  triggerRef?: RefObject<HTMLButtonElement | null>;
};

const COLLISION_PADDING = 10;
const SIDE_OFFSET = 6;

export function AdminPortalMenu({
  items,
  triggerLabel,
  triggerClassName = "btn btn--sm btn--secondary",
  menuClassName = "admin-portal-menu__list",
  align = "end",
  children,
  triggerRef,
}: AdminPortalMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuId = useId();
  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuItems = items.filter((item) => !item.hidden);

  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      internalTriggerRef.current = node;
      if (triggerRef) {
        triggerRef.current = node;
      }
    },
    [triggerRef],
  );

  const updatePosition = useCallback(() => {
    const trigger = internalTriggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top =
      triggerRect.bottom + SIDE_OFFSET + menuRect.height <= viewportH - COLLISION_PADDING
        ? triggerRect.bottom + SIDE_OFFSET
        : triggerRect.top - SIDE_OFFSET - menuRect.height;

    top = Math.max(
      COLLISION_PADDING,
      Math.min(top, viewportH - menuRect.height - COLLISION_PADDING),
    );

    let left =
      align === "end"
        ? triggerRect.right - menuRect.width
        : triggerRect.left;

    left = Math.max(
      COLLISION_PADDING,
      Math.min(left, viewportW - menuRect.width - COLLISION_PADDING),
    );

    setPosition({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, menuItems.length]);

  useEffect(() => {
    if (!open) return;

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        internalTriggerRef.current?.focus();
      }
    };

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        internalTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    internalTriggerRef.current?.focus();
  }

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            className={menuClassName}
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 90,
            }}
          >
            {menuItems.map((item) =>
              item.separator ? (
                <li key={item.id} role="separator" className="admin-portal-menu__sep" />
              ) : (
                <li key={item.id} role="none">
                  {item.href ? (
                    <Link
                      href={item.href}
                      role="menuitem"
                      className={`admin-portal-menu__item${item.tone === "danger" ? " is-danger" : ""}`}
                      onClick={closeMenu}
                    >
                      {item.icon ? (
                        <span className="admin-portal-menu__item-icon">{item.icon}</span>
                      ) : null}
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className={`admin-portal-menu__item${item.tone === "danger" ? " is-danger" : ""}`}
                      onClick={() => {
                        item.onSelect?.();
                        closeMenu();
                      }}
                    >
                      {item.icon ? (
                        <span className="admin-portal-menu__item-icon">{item.icon}</span>
                      ) : null}
                      {item.label}
                    </button>
                  )}
                </li>
              ),
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={setTriggerRef}
        type="button"
        className={`${triggerClassName}${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => setOpen((value) => !value)}
      >
        {children ?? "⋯"}
      </button>
      {menu}
    </>
  );
}
