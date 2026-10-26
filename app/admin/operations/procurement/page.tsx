import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listProcurement } from "@/lib/operations/queries";
import { FULFILMENT_LABELS, MATERIAL_STATUS_LABELS } from "@/lib/operations/lifecycle";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPanel, AdminStatusBadge, AdminTable } from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Procurement" };

type PageProps = { searchParams: Promise<{ show?: string }> };

export default async function ProcurementPage({ searchParams }: PageProps) {
  await requireAdmin();
  const showAll = (await searchParams).show === "all";
  const load = await listProcurement(showAll);

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Supplier orders"
        description="Materials ordered for each job. Add and update orders on the project page."
        secondaryAction={
          showAll
            ? { href: "/admin/operations/procurement/", label: "Open orders only" }
            : { href: "/admin/operations/procurement/?show=all", label: "Include received" }
        }
      />
      <OpsSetupBanners setup={load.setup} />
      {!load.ok ? (
        load.error === "load_failed" ? <AdminErrorState title="Supplier orders could not be loaded." message="Refresh in a moment." /> : null
      ) : load.data.length === 0 ? (
        <AdminPanel>
          <AdminEmptyState compact title={showAll ? "No supplier orders yet." : "No open supplier orders."} />
        </AdminPanel>
      ) : (
        <AdminPanel>
          <AdminTable caption="Supplier orders" className="ops-table">
            <thead>
              <tr>
                <th scope="col">Supplier</th>
                <th scope="col">Materials</th>
                <th scope="col">Project</th>
                <th scope="col">Status</th>
                <th scope="col">Expected</th>
                <th scope="col">Cost excl. VAT</th>
              </tr>
            </thead>
            <tbody>
              {load.data.map((o) => (
                <tr key={o.id}>
                  <td data-label="Supplier">
                    {o.supplier_name}
                    {o.supplier_reference ? <span className="ops-table__meta">{o.supplier_reference}</span> : null}
                  </td>
                  <td data-label="Materials">
                    {o.description}
                    {o.quantity ? <span className="ops-table__meta">{o.quantity}</span> : null}
                  </td>
                  <td data-label="Project">
                    <Link href={`/admin/operations/projects/${o.project_id}/#materials`}>{o.project_title}</Link>
                  </td>
                  <td data-label="Status">
                    <AdminStatusBadge
                      status={o.status === "received" ? "ops-good" : o.status === "cancelled" ? "ops-neutral" : "ops-info"}
                      label={MATERIAL_STATUS_LABELS[o.status]}
                    />
                    <span className="ops-table__meta">{FULFILMENT_LABELS[o.fulfilment]}</span>
                  </td>
                  <td data-label="Expected">{formatOpsDate(o.expected_date)}</td>
                  <td data-label="Cost excl. VAT">{formatOpsMoney(o.cost_excl_vat)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminPanel>
      )}
    </div>
  );
}
