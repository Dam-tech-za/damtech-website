import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import {
  getProjectTemplate,
  getProjectTemplateVersions,
} from "@/lib/project-templates/queries";
import { parseClauses } from "@/lib/project-templates/clauses";
import {
  AdminInfoBanner,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

type PageProps = {
  params: Promise<{ id: string }>;
};

function ClauseList({ text }: { text: string | null }) {
  const clauses = parseClauses(text);
  if (!clauses.length) return <p className="admin-muted">Not set.</p>;
  return (
    <ol className="pt-preview-clauses">
      {clauses.map((c) => (
        <li key={c.id}>{c.text}</li>
      ))}
    </ol>
  );
}

export default async function ProjectTemplatePreviewPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "project-templates")) {
    redirect("/admin/unauthorised/");
  }
  const { id } = await params;
  const template = await getProjectTemplate(id);
  if (!template) notFound();
  const canManage = canPerform(admin.profile.role, "managePricing");
  const versions = await getProjectTemplateVersions(id);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title={template.name}
        description={`${template.code}${
          template.projectCategory ? ` · ${template.projectCategory}` : ""
        }`}
        primaryAction={
          canManage
            ? {
                href: `/admin/pricing/project-templates/${id}/edit/`,
                label: "Edit template",
              }
            : undefined
        }
        secondaryAction={{
          href: "/admin/pricing/project-templates/",
          label: "Back to templates",
        }}
      />

      {template.unresolvedItemCodes.length ? (
        <AdminInfoBanner tone="warning">
          <strong>Unlinked item codes:</strong>{" "}
          {template.unresolvedItemCodes.join(", ")}. Link these to catalogue items so
          quotes are priced automatically.
        </AdminInfoBanner>
      ) : null}

      <AdminPanel title="Overview">
        <dl className="admin-data-list">
          <div>
            <dt>Status</dt>
            <dd>
              <AdminStatusBadge
                status={template.isActive ? "active" : "inactive"}
                label={template.isActive ? "Active" : "Inactive"}
              />
            </dd>
          </div>
          <div>
            <dt>Default quote title</dt>
            <dd>{template.defaultQuoteTitle ?? "—"}</dd>
          </div>
          <div>
            <dt>Material / service</dt>
            <dd>
              {template.defaultMaterialType ?? "—"} /{" "}
              {template.defaultServiceType ?? "—"}
            </dd>
          </div>
          <div>
            <dt>Validity</dt>
            <dd>
              {template.defaultValidityDays
                ? `${template.defaultValidityDays} days`
                : "—"}
            </dd>
          </div>
        </dl>
        {template.shortDescription ? (
          <p>{template.shortDescription}</p>
        ) : null}
        {template.defaultProjectDescription ? (
          <p>{template.defaultProjectDescription}</p>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Suggested quote items">
        {template.items.length === 0 ? (
          <p className="admin-muted">No suggested items.</p>
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Item</th>
                <th>Role</th>
                <th>Qty source</th>
                <th>Default qty</th>
                <th>Optional</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {template.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.resolvedName ? (
                      <>
                        <code>{item.resolvedItemCode}</code> {item.resolvedName}
                      </>
                    ) : (
                      <span className="pt-item-row__label--unresolved">
                        {item.requestedItemCode} (unlinked)
                      </span>
                    )}
                  </td>
                  <td>{item.lineRole.replace(/_/g, " ")}</td>
                  <td>{item.defaultQuantitySource.replace(/_/g, " ")}</td>
                  <td>{item.defaultQuantity ?? "—"}</td>
                  <td>{item.isOptional ? "Yes" : "No"}</td>
                  <td>{item.isSelectedByDefault ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>

      <AdminPanel title="Scope">
        <ClauseList text={template.defaultScope} />
      </AdminPanel>
      <AdminPanel title="Assumptions">
        <ClauseList text={template.defaultAssumptions} />
      </AdminPanel>
      <AdminPanel title="Exclusions">
        <ClauseList text={template.defaultExclusions} />
      </AdminPanel>

      {template.defaultCustomerMessage ? (
        <AdminPanel title="Customer message">
          <p>{template.defaultCustomerMessage}</p>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Internal notes">
        <AdminInfoBanner tone="warning">
          <strong>Internal — not shown to customers.</strong>
        </AdminInfoBanner>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {template.defaultInternalNotes ?? "—"}
        </p>
      </AdminPanel>

      {template.defaultWarrantyText ? (
        <AdminPanel title="Warranty">
          <p>{template.defaultWarrantyText}</p>
        </AdminPanel>
      ) : null}

      {template.fields.length ? (
        <AdminPanel title="Project information fields">
          <AdminTable>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Required</th>
                <th>Recommended</th>
              </tr>
            </thead>
            <tbody>
              {template.fields.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.label} <code>{f.fieldKey}</code>
                  </td>
                  <td>{f.fieldType}</td>
                  <td>{f.isRequired ? "Yes" : "No"}</td>
                  <td>{f.isRecommended ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Version history">
        {versions.length === 0 ? (
          <p className="admin-muted">No versions recorded.</p>
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Version</th>
                <th>Change summary</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}>
                  <td>v{v.versionNumber}</td>
                  <td>{v.changeSummary ?? "—"}</td>
                  <td>
                    {v.createdAt
                      ? new Date(v.createdAt).toLocaleString("en-ZA")
                      : "—"}
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
