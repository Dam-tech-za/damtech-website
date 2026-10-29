import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { listBoardProjects, listStaffOptions } from "@/lib/operations/queries";
import {
  DISTANCE_BAND_LABELS,
  DISTANCE_BANDS,
  OFFICE_FILTER_LABELS,
  OFFICE_FILTERS,
  PAYMENT_LABEL_TEXT,
  PAYMENT_LABELS,
  PRICE_BAND_LABELS,
  PRICE_BANDS,
  addDays,
  kmForOffice,
  matchesDistanceBand,
  matchesPriceBand,
  matchesSearch,
  sortProjects,
  type BoardFilters,
} from "@/lib/operations/board";
import { SERVICE_LABELS, STAGE_LABELS, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { PROJECT_SERVICES, PROJECT_STAGES } from "@/lib/operations/types";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminListMemory,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminActionForm,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { ProjectsBoard } from "@/components/admin/operations/ProjectsBoard";
import { updateXeroBoardAction } from "@/app/admin/operations/project-actions";

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

function readFilters(sp: Search): Required<Pick<BoardFilters, "sort" | "show">> & BoardFilters & { quick: Quick } {
  const sortRaw = one(sp.sort);
  const sort: BoardFilters["sort"] =
    sortRaw === "updated" || sortRaw === "name" || sortRaw === "lead" || sortRaw === "price" || sortRaw === "distance"
      ? sortRaw
      : "next_action";
  const show = one(sp.show) === "completed" ? "completed" : one(sp.show) === "archived" ? "archived" : "active";
  return {
    q: one(sp.q).slice(0, 100),
    service: one(sp.service),
    stage: one(sp.stage),
    payment: one(sp.payment),
    lead: one(sp.lead),
    price: one(sp.price),
    office: one(sp.office),
    distance: one(sp.distance),
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
    if ((key === "quick" && value === "all") || (key === "sort" && value === "next_action") || (key === "show" && value === "active")) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return `/admin/operations/projects/${query ? `?${query}` : ""}`;
}

export default async function OperationsProjectsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const canSync = canPerform(admin.profile.role, "runXeroSync");
  const filters = readFilters(await searchParams);
  const [load, staff] = await Promise.all([listBoardProjects(filters.show), listStaffOptions()]);
  const today = todayInSouthAfrica();

  const visible = load.ok
    ? sortProjects(
        load.data.filter(
          (p) =>
            matchesSearch(p, filters.q ?? "") &&
            (!filters.service || p.service === filters.service) &&
            (!filters.stage || p.stage === filters.stage) &&
            (!filters.payment || (filters.payment === "overdue" ? p.payment.overdue : p.payment.label === filters.payment)) &&
            (!filters.lead || p.project_lead_id === filters.lead) &&
            matchesPriceBand(p.quoted_total_incl_vat, filters.price) &&
            matchesDistanceBand(kmForOffice(p, filters.office), filters.distance) &&
            (filters.quick === "all" ||
              (filters.quick === "mine" && p.project_lead_id === admin.profile.id) ||
              (filters.quick === "overdue" && !!p.next_action_due && p.next_action_due < today && p.stage !== "completed") ||
              (filters.quick === "week" && !!p.next_action_due && p.next_action_due <= addDays(today, 7) && p.stage !== "completed")),
        ),
        filters.sort,
        filters.office,
      )
    : [];

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader title="Projects" description="Every won job, by stage. Payment comes from Xero." />
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
          .filter(([key, value]) => value && !(key === "sort" && value === "next_action") && !(key === "show" && value === "active") && !(key === "quick" && value === "all"))
          .map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
        <button type="submit" className="admin-btn admin-btn--secondary">
          Search
        </button>
        {canSync && load.setup.bridgeConfigured ? (
          <AdminActionForm action={updateXeroBoardAction} className="ops-board-filters__sync">
            <AdminSubmitButton variant="secondary" pendingLabel="Updating…">
              Update Xero
            </AdminSubmitButton>
          </AdminActionForm>
        ) : null}
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
      </div>

      <details
        className="ops-more-filters"
        open={Boolean(
          filters.service ||
            filters.stage ||
            filters.payment ||
            filters.lead ||
            filters.price ||
            filters.office ||
            filters.distance ||
            filters.sort !== "next_action" ||
            filters.show !== "active",
        )}
      >
        <summary>More filters</summary>
        <form className="ops-board-filters" method="get" aria-label="More project filters">
          <input type="hidden" name="q" value={filters.q} />
          <input type="hidden" name="quick" value={filters.quick} />
          <AdminSelect name="lead" defaultValue={filters.lead} aria-label="Project lead">
            <option value="">Any project lead</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.email}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect name="price" defaultValue={filters.price} aria-label="Price">
            <option value="">Any price</option>
            {PRICE_BANDS.map((b) => (
              <option key={b} value={b}>
                {PRICE_BAND_LABELS[b]}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect name="office" defaultValue={filters.office} aria-label="Office for distance">
            <option value="">Nearest office</option>
            {OFFICE_FILTERS.map((o) => (
              <option key={o} value={o}>
                {OFFICE_FILTER_LABELS[o]}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect name="distance" defaultValue={filters.distance} aria-label="Distance">
            <option value="">Any distance</option>
            {DISTANCE_BANDS.map((b) => (
              <option key={b} value={b}>
                {DISTANCE_BAND_LABELS[b]}
              </option>
            ))}
          </AdminSelect>
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
            <option value="name">Project name</option>
            <option value="lead">Project lead</option>
            <option value="price">Price (high to low)</option>
            <option value="distance">Distance</option>
            <option value="updated">Recently updated</option>
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
      ) : (
        <AdminPanel>
          {visible.length === 0 && load.data.length > 0 ? (
            <AdminEmptyState compact title="No projects match." description="Try All, or clear the search and filters." />
          ) : null}
          <ProjectsBoard projects={visible} canEdit={canEdit} />
        </AdminPanel>
      )}
    </div>
  );
}
