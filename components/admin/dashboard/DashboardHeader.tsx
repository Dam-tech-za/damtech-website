"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DASHBOARD_RANGE_OPTIONS,
  type DashboardRangeId,
} from "@/lib/admin/dashboard/types";

type DashboardHeaderProps = {
  rangeId: DashboardRangeId;
};

export function DashboardHeader({ rangeId }: DashboardHeaderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <header className="dash-header">
      <div className="dash-header__copy">
        <h1 className="dash-header__title">Dashboard</h1>
        <p className="dash-header__subtitle">
          Operational overview of RFQs, quotes and estimating activity.
        </p>
      </div>
      <div className="dash-header__actions">
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
        <button
          type="button"
          className="btn btn--md btn--secondary"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
        >
          {pending ? "Refreshing…" : "Refresh"}
        </button>
        <Link href="/admin/rfqs/" className="btn btn--md btn--secondary">
          View RFQs
        </Link>
        <Link href="/admin/quotes/new/" className="btn btn--md btn--primary">
          New Quote
        </Link>
      </div>
    </header>
  );
}
