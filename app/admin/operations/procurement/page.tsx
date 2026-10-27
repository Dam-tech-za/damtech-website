import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { listProcurement } from "@/lib/operations/queries";
import { FULFILMENT_LABELS, MATERIAL_STATUS_LABELS, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { orderNeedsAction } from "@/lib/operations/board";
import { MATERIAL_ORDER_STATUSES, isMaterialOrderStatus } from "@/lib/operations/types";
import { updateMaterialOrderAction } from "@/app/admin/operations/actions";
import {
  AdminActionForm,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminSubmitButton,
  AdminTable,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Procurement" };

type PageProps = { searchParams: Promise<{ show?: string; status?: string; q?: string }> };

export default async function ProcurementPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const sp = await searchParams;
  const showAll = sp.show === "all";
  const status = sp.status && isMaterialOrderStatus(sp.status) ? sp.status : "";
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 100);
  const load = await listProcurement(showAll || Boolean(status));
  const today = todayInSouthAfrica();
  const rows = load.ok
    ? load.data.filter(
        (o) =>
          (!status || o.status === status) &&
          (!q || [o.supplier_name, o.description, o.project_title, o.supplier_reference ?? ""].some((v) => v.toLowerCase().includes(q))),
      )
    : [];

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Procurement"
        description="Supplier orders across all projects. Add an order from its project. Supplier payment is tracked in Xero."
      />
      <OpsSetupBanners setup={load.setup} />

      <form className="ops-board-filters" method="get" role="search" aria-label="Filter supplier orders">
        <label className="ops-board-filters__search">
          <span className="sr-only">Search orders</span>
          <input className="admin-input" type="search" name="q" defaultValue={sp.q ?? ""} placeholder="Search supplier, materials, project or reference" />
        </label>
        <AdminSelect name="status" defaultValue={status} aria-label="Status">
          <option value="">All open statuses</option>
          {MATERIAL_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {MATERIAL_STATUS_LABELS[s]}
            </option>
          ))}
        </AdminSelect>
        <label className="admin-checkbox-field">
          <input type="checkbox" name="show" value="all" defaultChecked={showAll} /> Include collected / delivered and cancelled
        </label>
        <button type="submit" className="admin-btn admin-btn--secondary">
          Apply
        </button>
      </form>

      {!load.ok ? (
        load.error === "load_failed" ? <AdminErrorState title="Supplier orders could not be loaded." message="Refresh in a moment." /> : null
      ) : rows.length === 0 ? (
        <AdminPanel>
          <AdminEmptyState compact title={load.data.length ? "No orders match these filters." : "No open supplier orders."} />
        </AdminPanel>
      ) : (
        <AdminPanel>
          <AdminTable caption="Supplier orders" className="ops-table">
            <thead>
              <tr>
                <th scope="col">Supplier and materials</th>
                <th scope="col">Project</th>
                <th scope="col">Status</th>
                <th scope="col">Expected</th>
                <th scope="col">Cost excl. VAT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td data-label="Supplier and materials">
                    <strong>{o.supplier_name}</strong>
                    <span className="ops-table__meta">
                      {o.description}
                      {o.quantity ? ` · ${o.quantity}${o.unit ? ` ${o.unit}` : ""}` : ""}
                      {o.supplier_reference ? ` · ref ${o.supplier_reference}` : ""}
                    </span>
                    {orderNeedsAction(o, today) ? <AdminStatusBadge status="ops-warn" label="Needs action" /> : null}
                  </td>
                  <td data-label="Project">
                    <Link href={`/admin/operations/projects/${o.project_id}/#materials`}>{o.project_title}</Link>
                  </td>
                  <td data-label="Status">
                    {canEdit ? (
                      <AdminActionForm action={updateMaterialOrderAction} className="ops-quick-stage">
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="expected_date" value={o.expected_date ?? ""} />
                        <input type="hidden" name="supplier_reference" value={o.supplier_reference ?? ""} />
                        <AdminSelect name="status" defaultValue={o.status} aria-label={`Status for ${o.supplier_name}`}>
                          {MATERIAL_ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {MATERIAL_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </AdminSelect>
                        <AdminSubmitButton variant="outline" pendingLabel="…">Set</AdminSubmitButton>
                      </AdminActionForm>
                    ) : (
                      <AdminStatusBadge status="ops-info" label={MATERIAL_STATUS_LABELS[o.status]} />
                    )}
                    <span className="ops-table__meta">{FULFILMENT_LABELS[o.fulfilment]}</span>
                  </td>
                  <td data-label="Expected">
                    {formatOpsDate(o.expected_date)}
                    {o.expected_date && o.expected_date < today && o.status !== "collected_delivered" && o.status !== "cancelled" ? (
                      <>
                        {" "}
                        <AdminStatusBadge status="ops-bad" label="Late" />
                      </>
                    ) : null}
                  </td>
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
