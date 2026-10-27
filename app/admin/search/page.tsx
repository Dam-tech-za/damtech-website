import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Search" };

type Hit = { href: string; title: string; meta: string };
type Group = { label: string; hits: Hit[] };

/** Strip characters that would break a PostgREST or() filter, then make an ilike pattern. */
function pattern(q: string): string {
  return `%${q.replace(/[,()%*\\{}"]/g, " ").trim()}%`;
}

/**
 * One search box for the whole admin: customers, enquiries, projects and
 * Xero quote/invoice numbers. A single match opens straight away.
 */
export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin();
  const role = admin.profile.role;
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const groups: Group[] = [];

  if (q.length >= 2) {
    const like = pattern(q);
    const upper = q.toUpperCase().replace(/\s+/g, "");
    const supabase = await createClient();
    const jobs: Promise<Group | null>[] = [];

    if (canAccessNavItem(role, "rfqs")) {
      jobs.push(
        (async () => {
          const { data } = await supabase
            .from("rfqs")
            .select("id, rfq_number, contact_name, company_name, town, service_required, xero_quote_number, submitted_at")
            .or(
              `rfq_number.ilike.${like},contact_name.ilike.${like},company_name.ilike.${like},email.ilike.${like},phone.ilike.${like},town.ilike.${like},farm_project_name.ilike.${like},xero_quote_number.ilike.${like}`,
            )
            .order("submitted_at", { ascending: false })
            .limit(8);
          return {
            label: "Enquiries",
            hits: (data ?? []).map((r) => ({
              href: `/admin/rfqs/${r.id}/`,
              title: `${r.rfq_number} · ${r.company_name || r.contact_name || "Unknown"}`,
              meta: [r.service_required, r.town, r.xero_quote_number].filter(Boolean).join(" · "),
            })),
          };
        })(),
      );
    }
    if (canAccessNavItem(role, "customers")) {
      jobs.push(
        (async () => {
          const { data } = await supabase
            .from("customers")
            .select("id, name, company_name, email, phone")
            .or(`name.ilike.${like},company_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
            .order("name")
            .limit(8);
          return {
            label: "Customers",
            hits: (data ?? []).map((c) => ({
              href: `/admin/customers/${c.id}/`,
              title: c.company_name ? `${c.company_name} (${c.name})` : c.name,
              meta: [c.email, c.phone].filter(Boolean).join(" · "),
            })),
          };
        })(),
      );
    }
    if (canAccessNavItem(role, "operations")) {
      jobs.push(
        (async () => {
          const db = createServiceRoleClient();
          const isNumber = /^(QU|INV)-?\d{3,6}$/.test(upper);
          const [byText, byNumber, byInvoice] = await Promise.all([
            db.from("ops_projects").select("id, title, customer_name, site_location, stage").or(`title.ilike.${like},customer_name.ilike.${like},site_location.ilike.${like}`).limit(8),
            isNumber
              ? db.from("ops_projects").select("id, title, customer_name, site_location, stage").or(`xero_quote_numbers.cs.{${upper.replace("-", "")}},xero_invoice_numbers.cs.{${upper}}`).limit(8)
              : Promise.resolve({ data: [] as { id: string; title: string; customer_name: string; site_location: string | null; stage: string }[] }),
            db.from("ops_xero_invoice_links").select("invoice_number, ops_projects(id, title, customer_name, site_location, stage)").ilike("invoice_number", like).limit(8),
          ]);
          const rows = new Map<string, Hit>();
          for (const p of [...(byNumber.data ?? []), ...(byText.data ?? [])]) {
            rows.set(p.id, { href: `/admin/operations/projects/${p.id}/`, title: p.title, meta: [p.customer_name, p.site_location].filter(Boolean).join(" · ") });
          }
          for (const link of byInvoice.data ?? []) {
            const p = link.ops_projects as unknown as { id: string; title: string; customer_name: string } | null;
            if (p) rows.set(p.id, { href: `/admin/operations/projects/${p.id}/`, title: p.title, meta: `${link.invoice_number} · ${p.customer_name}` });
          }
          return { label: "Projects", hits: [...rows.values()].slice(0, 8) };
        })(),
      );
    }

    const settled = await Promise.allSettled(jobs);
    for (const r of settled) if (r.status === "fulfilled" && r.value && r.value.hits.length) groups.push(r.value);
    const all = groups.flatMap((g) => g.hits);
    if (all.length === 1) redirect(all[0].href);
  }

  return (
    <div className="admin-stack--page">
      <AdminPageHeader title="Search" description="Customers, enquiries, projects and Xero quote or invoice numbers." />
      <form action="/admin/search/" method="get" role="search" className="ops-board-filters">
        <label className="ops-board-filters__search">
          <span className="sr-only">Search</span>
          <input className="admin-input" type="search" name="q" defaultValue={q} placeholder="Name, company, phone, RFQ, QU or INV number" autoFocus maxLength={80} />
        </label>
        <button type="submit" className="admin-btn admin-btn--primary">
          Search
        </button>
      </form>
      {q.length < 2 ? (
        <AdminPanel>
          <AdminEmptyState compact title="Type at least two letters." description="Tip: press Ctrl+K anywhere in the admin to jump to search." />
        </AdminPanel>
      ) : groups.length === 0 ? (
        <AdminPanel>
          <AdminEmptyState compact title={`Nothing matches “${q}”.`} description="Check the spelling, or try a phone number, RFQ, QU or INV number." />
        </AdminPanel>
      ) : (
        groups.map((g) => (
          <AdminPanel key={g.label} title={`${g.label} (${g.hits.length})`}>
            <ul className="admin-search-results">
              {g.hits.map((h) => (
                <li key={h.href}>
                  <Link href={h.href} className="admin-search-results__link">
                    <strong>{h.title}</strong>
                    {h.meta ? <span className="ops-table__meta">{h.meta}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </AdminPanel>
        ))
      )}
    </div>
  );
}
