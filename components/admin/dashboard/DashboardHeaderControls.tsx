"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DASHBOARD_RANGE_OPTIONS,
  type DashboardRangeId,
} from "@/lib/admin/dashboard/types";
import { AdminSelect } from "@/components/admin/ui";

type DashboardHeaderControlsProps = {
  rangeId: DashboardRangeId;
};

export function DashboardHeaderControls({
  rangeId,
}: DashboardHeaderControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="dash-header__range">
        <span className="sr-only">Date range</span>
        <AdminSelect
          className="dash-header__select"
          value={rangeId}
          aria-label="Dashboard date range"
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value as DashboardRangeId;
            startTransition(() => {
              router.push(`/admin/?range=${encodeURIComponent(next)}`);
            });
          }}
        >
          {DASHBOARD_RANGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
    </label>
  );
}
