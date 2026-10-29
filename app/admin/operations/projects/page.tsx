import { Suspense } from "react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { listBoardProjects } from "@/lib/operations/queries";
import {
  AdminActionForm,
  AdminErrorState,
  AdminListMemory,
  AdminPageHeader,
  AdminPanel,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { ProjectsWorkspace } from "@/components/admin/operations/ProjectsWorkspace";
import { updateXeroBoardAction } from "@/app/admin/operations/project-actions";
import type { BoardFilters } from "@/lib/operations/board";

export const metadata: Metadata = { title: "Projects" };
export const maxDuration = 30;

type Search = Record<string, string | string[] | undefined>;
type PageProps = { searchParams: Promise<Search> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function OperationsProjectsPage(props: PageProps) {
  try {
    return await ProjectsPageInner(props);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] projects page:", error instanceof Error ? error.message : error);
    return (
      <div className="admin-stack--page ops">
        <AdminPageHeader title="Projects" description="Every won job, by stage." />
        <AdminErrorState title="Projects could not be loaded." message="Refresh in a moment." />
      </div>
    );
  }
}

async function ProjectsPageInner({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const canSync = canPerform(admin.profile.role, "runXeroSync");
  const sp = await searchParams;
  const load = await listBoardProjects("active");
  const initial: BoardFilters & { add?: boolean } = {
    q: one(sp.q).slice(0, 100),
    lead: one(sp.lead),
    payment: one(sp.payment),
    price: one(sp.price),
    price_min: one(sp.price_min).slice(0, 12),
    price_max: one(sp.price_max).slice(0, 12),
    office: one(sp.office),
    distance: one(sp.distance),
    stage: one(sp.stage),
    sort: "created",
    show: "active",
    add: one(sp.add) === "1",
  };

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Projects"
        description="Every won job, by stage."
        primaryActionNode={
          canSync && load.ok && load.setup.bridgeConfigured ? (
            <AdminActionForm action={updateXeroBoardAction} className="ops-board-filters__sync">
              <AdminSubmitButton variant="secondary" pendingLabel="Updating…">
                Update Xero
              </AdminSubmitButton>
            </AdminActionForm>
          ) : null
        }
      />
      <Suspense fallback={null}>
        <AdminListMemory listPath="/admin/operations/projects/" />
      </Suspense>
      <OpsSetupBanners setup={load.setup} />

      {!load.ok ? (
        load.error === "load_failed" ? <AdminErrorState title="Projects could not be loaded." message="Refresh in a moment." /> : null
      ) : (
        <AdminPanel>
          <ProjectsWorkspace projects={load.data} canEdit={canEdit} focusAdd={Boolean(initial.add) && canEdit} initial={initial} />
        </AdminPanel>
      )}
    </div>
  );
}
