import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listOpsProjects } from "@/lib/operations/queries";
import { STAGE_LABELS } from "@/lib/operations/lifecycle";
import { PROJECT_STAGES, isProjectStage, type ProjectStage } from "@/lib/operations/types";
import { AdminEmptyState, AdminErrorState, AdminListMemory, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { OpsSetupBanners, ProjectTable } from "@/components/admin/operations/OpsParts";

export const metadata: Metadata = { title: "Projects" };

type PageProps = { searchParams: Promise<{ stage?: string | string[] }> };

const FILTERS: { id: ProjectStage | "open" | "all"; label: string }[] = [
  { id: "open", label: "Active" },
  ...PROJECT_STAGES.map((stage) => ({ id: stage, label: STAGE_LABELS[stage] })),
  { id: "all", label: "All" },
];

export default async function OperationsProjectsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const raw = (await searchParams).stage;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const stage: ProjectStage | "open" | "all" = value === "all" ? "all" : value && isProjectStage(value) ? value : "open";
  const load = await listOpsProjects({ stage });

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader title="Projects" description="Every won job, one record each. Payment comes from Xero." />
      <Suspense fallback={null}>
        <AdminListMemory listPath="/admin/operations/projects/" />
      </Suspense>
      <OpsSetupBanners setup={load.setup} />

      <nav className="ops-filter" aria-label="Filter by stage">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "open" ? "/admin/operations/projects/" : `/admin/operations/projects/?stage=${f.id}`}
            className={`ops-filter__link${f.id === stage ? " ops-filter__link--active" : ""}`}
            aria-current={f.id === stage ? "page" : undefined}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {!load.ok ? (
        load.error === "load_failed" ? (
          <AdminErrorState title="Projects could not be loaded." message="Refresh in a moment." />
        ) : null
      ) : (
        <AdminPanel>
          {load.data.length === 0 ? (
            <AdminEmptyState compact title="No projects in this view." />
          ) : (
            <ProjectTable projects={load.data} caption="Projects" />
          )}
        </AdminPanel>
      )}
    </div>
  );
}
