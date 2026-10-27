import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { listBoardProjects } from "@/lib/operations/queries";
import {
  PAYMENT_LABEL_TEXT,
  PAYMENT_LABELS,
  addDays,
  matchesSearch,
  sortProjects,
  type BoardFilters,
} from "@/lib/operations/board";
import { SERVICE_LABELS, STAGE_LABELS, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { PROJECT_SERVICES, PROJECT_STAGES } from "@/lib/operations/types";
import {
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminListMemory,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { BoardTable, ProjectKanban } from "@/components/admin/operations/BoardParts";

export const metadata: Metadata = { title: "Projects" };

type Search = Record<string, string | string[] | undefined>;
type PageProps = { searchParams: Promise<Search> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Quick = "all" | "mine" | "overdue" | "week";
const QUICK: { id: Quick; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mine", label: "My jobs" },
  { id: "overdue", label: "Overdue" },
  { id: "week", label: "Due this week" },
];

function readFilters(sp: Search): Required<Pick<BoardFilters, "view" | "sort" | "show">> & BoardFilters & { quick: Quick } {
  const view = one(sp.view) === "table" ? "table" : "board";
  const sort = one(sp.sort) === "updated" ? "updated" : one(sp.sort) === "customer" ? "customer" : "next_action";
  const show = one(sp.show) === "completed" ? "completed" : one(sp.show) === "archived" ? "archived" : "active";
  return {
    q: one(sp.q).slice(0, 100),
    service: one(sp.service),
    stage: one(sp.stage),
    payment: one(sp.payment),
    view,
    sort,
    show,
    quick: (["mine", "overdue", "week"] as const).find((q) => q === one(sp.quick)) ?? "all",
  };
}

function hrefWith(filters: BoardFilters & { quick?: Quick }, patch: Partial<BoardFilters & { quick: Quick }>): string {
  const merged = { ...filters, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    if ((key === "quick" && value === "all") || (key === "view" && value === "board") || (key === "sort" && value === "next_action") || (key === "show" && value === "active")) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return `/admin/operations/projects/${query ? `?${query}` : ""}`;
}

export default async function OperationsProjectsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const filters = readFilters(await searchParams);
  const load = await listBoardProjects(filters.show);
  const today = todayInSouthAfrica();

  const visible = load.ok
    ? sortProjects(
        load.data.filter(
          (p) =>
            matchesSearch(p, filters.q ?? "") &&
            (!filters.service || p.service === filters.service) &&
            (!filters.stage || p.stage === filters.stage) &&
            (!filters.payment || (filters.payment === "overdue" ? p.payment.overdue : p.payment.label === filters.payment)) &&
            (filters.quick === "all" ||
              (filters.quick === "mine" && p.project_lead_id === admin.profile.id) ||
              (filters.quick === "overdue" && !!p.next_action_due && p.next_action_due < today && p.stage !== "completed") ||
              (filters.quick === "week" && !!p.next_action_due && p.next_action_due <= addDays(today, 7) && p.stage !== "completed")),
        ),
        filters.sort,
      )
    : [];

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Projects"
        description="Every won job, by stage. Payment comes from Xero."
        primaryActionNode={canEdit ? <AdminButton href="/admin/operations/projects/new/" variant="primary">New project</AdminButton> : null}
      />
      <Suspense fallback={null}>
        <AdminListMemory listPath="/admin/operations/projects/" />
      </Suspense>
      <OpsSetupBanners setup={load.setup} />

      <form className="ops-board-filters" method="get" role="search" aria-label="Search projects">
        <label className="ops-board-filters__search">
          <span className="sr-only">Search projects</span>
          <input className="admin-input" type="search" name="q" defaultValue={filters.q} placeholder="Search customer, site, QU or INV number" />
        </label>
        {Object.entries({ ...filters, q: "" })
          .filter(
            ([key, value]) =>
              value &&
              !(key === "view" && value === "board") &&
              !(key === "sort" && value === "next_action") &&
              !(key === "show" && value === "active") &&
              !(key === "quick" && value === "all"),
          )
          .map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
        <button type="submit" className="admin-btn admin-btn--secondary">
          Search
        </button>
      </form>

      <div className="ops-quickbar">
        <nav className="ops-chips" aria-label="Quick filters">
          {QUICK.map((q) => (
            <Link
              key={q.id}
              href={hrefWith(filters, { quick: q.id })}
              className={`ops-chip${filters.quick === q.id ? " is-active" : ""}`}
              aria-current={filters.quick === q.id ? "true" : undefined}
            >
              {q.label}
            </Link>
          ))}
        </nav>
        <nav className="ops-chips" aria-label="View">
          <Link href={hrefWith(filters, { view: "board" })} className={`ops-chip${filters.view === "board" ? " is-active" : ""}`}>
            Board
          </Link>
          <Link href={hrefWith(filters, { view: "table" })} className={`ops-chip${filters.view === "table" ? " is-active" : ""}`}>
            Table
          </Link>
        </nav>
      </div>

      <details
        className="ops-more-filters"
        open={Boolean(filters.service || filters.stage || filters.payment || filters.sort !== "next_action" || filters.show !== "active")}
      >
        <summary>More filters</summary>
        <form className="ops-board-filters" method="get" aria-label="More project filters">
          <input type="hidden" name="q" value={filters.q} />
          <input type="hidden" name="view" value={filters.view} />
          <input type="hidden" name="quick" value={filters.quick} />
          <AdminSelect name="service" defaultValue={filters.service} aria-label="Service">
            <option value="">All services</option>
            {PROJECT_SERVICES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s]}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect name="stage" defaultValue={filters.stage} aria-label="Stage">
            <option value="">All stages</option>
            {PROJECT_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect name="payment" defaultValue={filters.payment} aria-label="Payment status">
            <option value="">Any payment status</option>
            {PAYMENT_LABELS.map((l) => (
              <option key={l} value={l}>
                {PAYMENT_LABEL_TEXT[l]}
              </option>
            ))}
            <option value="overdue">Payment overdue</option>
          </AdminSelect>
          <AdminSelect name="sort" defaultValue={filters.sort} aria-label="Sort">
            <option value="next_action">Next step date</option>
            <option value="updated">Recently updated</option>
            <option value="customer">Customer A–Z</option>
          </AdminSelect>
          <AdminSelect name="show" defaultValue={filters.show} aria-label="Which projects">
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </AdminSelect>
          <button type="submit" className="admin-btn admin-btn--secondary">
            Apply
          </button>
          <Link href="/admin/operations/projects/" className="admin-btn admin-btn--ghost">
            Clear
          </Link>
        </form>
      </details>

      {!load.ok ? (
        load.error === "load_failed" ? <AdminErrorState title="Projects could not be loaded." message="Refresh in a moment." /> : null
      ) : visible.length === 0 ? (
        <AdminPanel>
          <AdminEmptyState
            compact
            title={load.data.length ? "No projects match." : filters.show === "active" ? "No active projects yet." : "Nothing here yet."}
            description={load.data.length ? "Try All, or clear the search and filters." : canEdit ? "Start one from a Xero quote or invoice with New project." : undefined}
          />
        </AdminPanel>
      ) : filters.view === "table" ? (
        <AdminPanel>
          <BoardTable projects={visible} today={today} canEdit={canEdit} caption="Projects" />
        </AdminPanel>
      ) : (
        <ProjectKanban projects={visible} today={today} />
      )}
    </div>
  );
}
