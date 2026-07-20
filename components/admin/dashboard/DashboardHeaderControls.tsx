"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DASHBOARD_RANGE_OPTIONS,
  type DashboardRangeId,
} from "@/lib/admin/dashboard/types";
import { AdminButton } from "@/components/admin/ui";

type DashboardHeaderControlsProps = {
  rangeId: DashboardRangeId;
};

export function DashboardHeaderControls({
  rangeId,
}: DashboardHeaderControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <label className="dash-header__range">
        <span className="dash-header__range-label">Date range</span>
        <select
          className="form-input dash-header__select"
          value={rangeId}
          aria-label="Dashboard date range"
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value as DashboardRangeId;
            startTransition(() => {
              router.push(`/admin/?range=${encodeURIComponent(next)}`);
              router.refresh();
            });
          }}
        >
          {DASHBOARD_RANGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <AdminButton
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Refreshing…" : "Refresh"}
      </AdminButton>
    </>
  );
}
