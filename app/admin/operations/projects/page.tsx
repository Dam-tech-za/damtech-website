import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { listBoardProjects } from "@/lib/operations/queries";
import {
  PAYMENT_LABEL_TEXT,
  PAYMENT_LABELS,
  groupProjects,
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
import { BoardTable, GroupHeading } from "@/components/admin/operations/BoardParts";

export const metadata: Metadata = { title: "Projects" };

type Search = Record<string, string | string[] | undefined>;
type PageProps = { searchParams: Promise<Search> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function readFilters(sp: Search): Required<Pick<BoardFilters, "view" | "sort" | "show">> & BoardFilters {
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
  };
}

function hrefWith(filters: BoardFilters, patch: Partial<BoardFilters>): string {
  const merged = { ...filters, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    if ((key === "view" && value === "board") || (key === "sort" && value === "next_action") || (key === "show" && value === "active")) continue;
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
            (!filters.payment || (filters.payment === "overdue" ? p.payment.overdue : p.payment.label === filters.payment)),
        ),
        filters.sort,
      )
    : [];

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Projects"
        description="Every won job. Stages are set here; payment comes from Xero."
        primaryActionNode={canEdit ? <AdminButton href="/admin/operations/projects/new/" variant="primary">New project</AdminButton> : null}
      />
      <Suspense fallback={null}>
        <AdminListMemory listPath="/admin/operations/projects/" />
      </Suspense>
      <OpsSetupBanners setup={load.setup} />

      <form className="ops-board-filters" method="get" role="search" aria-label="Filter projects">
        <label className="ops-board-filters__search">
          <span className="sr-only">Search projects</span>
          <input className="admin-input" type="search" name="q" defaultValue={filters.q} placeholder="Search customer, site, QU or INV number" />
        </label>
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
          <option value="overdue">Overdue</option>
        </AdminSelect>
        <AdminSelect name="sort" defaultValue={filters.sort} aria-label="Sort">
          <option value="next_action">Next action date</option>
          <option value="updated">Recently updated</option>
          <option value="customer">Customer A–Z</option>
        </AdminSelect>
        <input type="hidden" name="view" value={filters.view} />
        <input type="hidden" name="show" value={filters.show} />
        <button type="submit" className="admin-btn admin-btn--secondary">
          Apply
        </button>
      </form>

      <nav className="ops-filter" aria-label="Views">
        <Link href={hrefWith(filters, { view: "board" })} className={`ops-filter__link${filters.view === "board" ? " ops-filter__link--active" : ""}`}>
          Grouped by stage
        </Link>
        <Link href={hrefWith(filters, { view: "table" })} className={`ops-filter__link${filters.view === "table" ? " ops-filter__link--active" : ""}`}>
          Compact table
        </Link>
        <span className="ops-filter__sep" aria-hidden />
        {(["active", "completed", "archived"] as const).map((show) => (
          <Link key={show} href={hrefWith(filters, { show })} className={`ops-filter__link${filters.show === show ? " ops-filter__link--active" : ""}`}>
            {show === "active" ? "Active" : show === "completed" ? "Completed" : "Archived"}
          </Link>
        ))}
      </nav>

      {!load.ok ? (
        load.error === "load_failed" ? <AdminErrorState title="Projects could not be loaded." message="Refresh in a moment." /> : null
      ) : visible.length === 0 ? (
        <AdminPanel>
          <AdminEmptyState
            compact
            title={load.data.length ? "No projects match these filters." : filters.show === "active" ? "No active projects yet." : "Nothing here yet."}
          />
        </AdminPanel>
      ) : filters.view === "table" ? (
        <AdminPanel>
          <BoardTable projects={visible} today={today} canEdit={canEdit} caption="Projects" />
        </AdminPanel>
      ) : (
        groupProjects(visible).map(({ group, projects }) => (
          <section key={group} className="ops-group" aria-label={group}>
            <GroupHeading group={group} count={projects.length} />
            <AdminPanel>
              <BoardTable projects={projects} today={today} canEdit={canEdit} caption={group} />
            </AdminPanel>
          </section>
        ))
      )}
    </div>
  );
}
