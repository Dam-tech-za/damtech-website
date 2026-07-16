export type DashboardRangeId =
  | "7d"
  | "30d"
  | "month"
  | "prev_month"
  | "ytd";

export type DashboardRangeOption = {
  id: DashboardRangeId;
  label: string;
};

export const DASHBOARD_RANGE_OPTIONS: DashboardRangeOption[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "prev_month", label: "Previous month" },
  { id: "ytd", label: "Year to date" },
];

export type DashboardBreakdownRow = {
  name: string;
  count: number;
  percentage: number;
};

export type DashboardStageRow = {
  status: string;
  label: string;
  count: number;
  percentage: number;
  href: string;
};

export type DashboardQuotePipelineRow = {
  status: string;
  label: string;
  count: number;
  value: number;
  href: string;
};

export type DashboardRecentRfq = {
  id: string;
  rfqNumber: string;
  customer: string;
  service: string;
  location: string;
  status: string;
  submittedAt: string;
};

export type DashboardActivityItem = {
  id: string;
  action: string;
  entityLabel: string;
  entityHref: string | null;
  actor: string;
  createdAt: string;
};

export type DashboardMetrics = {
  rangeId: DashboardRangeId;
  rangeLabel: string;
  primary: {
    newRfqs: number;
    newRfqsDelta: number | null;
    readyForQuote: number;
    awaitingApproval: number;
    acceptedValue: number;
  };
  rfqStages: DashboardStageRow[];
  quotePipeline: DashboardQuotePipelineRow[];
  provisional: {
    linerAreaM2: number;
    tankCapacityKl: number;
    torchOnAreaM2: number;
  };
  services: DashboardBreakdownRow[];
  provinces: DashboardBreakdownRow[];
  recentRfqs: DashboardRecentRfq[];
  recentActivity: DashboardActivityItem[];
  expiringQuotesCount: number;
};

export function parseDashboardRange(
  value: string | string[] | undefined,
): DashboardRangeId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "7d" ||
    raw === "30d" ||
    raw === "month" ||
    raw === "prev_month" ||
    raw === "ytd"
  ) {
    return raw;
  }
  return "30d";
}
