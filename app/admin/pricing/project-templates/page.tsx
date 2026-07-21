import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { listProjectTemplates } from "@/lib/project-templates/queries";
import { ProjectTemplateRowActions } from "@/components/admin/project-templates/ProjectTemplateRowActions";
import {
  AdminButton,
  AdminEmptyState,
  AdminFilterToolbar,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
};

export default async function ProjectTemplatesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "project-templates")) {
    redirect("/admin/unauthorised/");
  }

  const { q, category, status } = await searchParams;
  const active = status === "inactive" ? false : status === "active" ? true : undefined;

  const templates = await listProjectTemplates({
    q,
    category: category || undefined,
    active,
  });

  const categories = Array.from(
    new Set(templates.map((t) => t.projectCategory).filter(Boolean)),
  ) as string[];

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Project Templates"
        description="Reusable estimating and quotation content for recurring Damtech project types."
        primaryAction={{
          href: "/admin/pricing/project-templates/new/",
          label: "New template",
        }}
      />

      <AdminPanel title="Templates">
        <AdminFilterToolbar>
          <form method="get" className="admin-filter-toolbar__form">
            <AdminSearchField
              name="q"
              placeholder="Search code, name…"
              defaultValue={q ?? ""}
              label="Search templates"
            />
            <AdminSelect name="category" defaultValue={category ?? ""} aria-label="Category">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="status" defaultValue={status ?? ""} aria-label="Status">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </AdminSelect>
            <AdminButton type="submit" variant="primary">
              Filter
            </AdminButton>
            {q || category || status ? (
              <AdminButton href="/admin/pricing/project-templates/" variant="secondary">
                Clear
              </AdminButton>
            ) : null}
          </form>
        </AdminFilterToolbar>

        {templates.length === 0 ? (
          <AdminEmptyState
            title="No project templates found"
            description="Create a template to store reusable scope, assumptions and suggested items."
            actionHref="/admin/pricing/project-templates/new/"
            actionLabel="New template"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Code</th>
                <th>Template</th>
                <th>Category</th>
                <th>Default material</th>
                <th>Suggested items</th>
                <th>Status</th>
                <th>Updated</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <code>{t.code}</code>
                  </td>
                  <td>{t.name}</td>
                  <td>{t.projectCategory ?? "—"}</td>
                  <td>{t.defaultMaterialType ?? "—"}</td>
                  <td>
                    {t.itemCount}
                    {t.unresolvedCount > 0 ? (
                      <span className="admin-badge admin-badge--warning pt-internal-tag">
                        {t.unresolvedCount} unlinked
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <AdminStatusBadge
                      status={t.isActive ? "active" : "inactive"}
                      label={t.isActive ? "Active" : "Inactive"}
                    />
                  </td>
                  <td>
                    {t.updatedAt
                      ? new Date(t.updatedAt).toLocaleDateString("en-ZA")
                      : "—"}
                  </td>
                  <td>
                    <ProjectTemplateRowActions id={t.id} isActive={t.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
