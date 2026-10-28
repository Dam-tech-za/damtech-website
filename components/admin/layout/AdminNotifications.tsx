"use client";

import { useEffect, useRef } from "react";
import { AttentionPanel } from "@/components/admin/dashboard/AttentionPanel";
import {
  attentionBadgeCount,
  formatAttentionBadge,
  type AttentionItem,
} from "@/lib/admin/dashboard/attention";

type AdminNotificationsProps = {
  items: AttentionItem[];
};

/** Header bell: the overview "needs attention" list, with a count on the icon. */
export function AdminNotifications({ items }: AdminNotificationsProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const count = attentionBadgeCount(items);
  const badge = formatAttentionBadge(count);
  const label = count === 0 ? "Notifications, none" : `Notifications, ${badge}`;

  useEffect(() => {
    function close(event: MouseEvent | KeyboardEvent) {
      const el = ref.current;
      if (!el?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !el.contains(event.target as Node)) {
        el.open = false;
      }
    }
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={ref} className="admin-notify">
      <summary className="admin-icon-btn admin-notify__button" aria-label={label} title={label}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 18.5a2 2 0 0 0 4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {badge ? (
          <span className="admin-notify__badge" aria-hidden>
            {badge}
          </span>
        ) : null}
      </summary>
      <div className="admin-notify__dropdown">
        <AttentionPanel
          items={items}
          onNavigate={() => {
            if (ref.current) ref.current.open = false;
          }}
        />
      </div>
    </details>
  );
}
