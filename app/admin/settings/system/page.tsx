import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isUpstashConfigured } from "@/lib/rate-limit/types";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { getCompanySettings, getQuotePdfSettings } from "@/lib/quotes/settings";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { COMPANY_ASSETS_BUCKET } from "@/lib/storage/company-assets";

type Status = "Configured" | "Missing" | "Error";

type Check = {
  label: string;
  status: Status;
  hint: string;
};

export default async function AdminSystemSettingsPage() {
  await requireAdmin({ roles: ["owner", "admin"] });
  const checks = await collectChecks();

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>System health</h2>
        <p className="admin-empty__hint">
          Configuration status only — secret values are never displayed.
        </p>
      </header>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.label}>
                <td>{check.label}</td>
                <td>
                  <span
                    className={`admin-status admin-status--${
                      check.status === "Configured"
                        ? "ready_for_quote"
                        : check.status === "Missing"
                          ? "information_required"
                          : "spam"
                    }`}
                  >
                    {check.status}
                  </span>
                </td>
                <td>{check.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subheading">Production-readiness checklist</h3>
      <ul className="admin-list">
        <li>Apply all Supabase migrations including company-assets bucket</li>
        <li>Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN on Vercel</li>
        <li>Set RESEND_API_KEY and quote from/reply addresses</li>
        <li>Set CRON_SECRET and verify Vercel cron routes</li>
        <li>Upload company + PDF logos and preview a draft PDF</li>
        <li>Confirm Google OAuth redirect URLs for production domain</li>
        <li>Confirm NEXT_PUBLIC_SITE_URL uses the canonical www origin</li>
      </ul>

      <p className="admin-empty__hint">
        <Link href="/admin/settings/">← Back to settings</Link>
      </p>
    </div>
  );
}

async function collectChecks(): Promise<Check[]> {
  const company = await getCompanySettings().catch(() => null);
  const pdf = await getQuotePdfSettings().catch(() => null);

  let storageStatus: Status = "Missing";
  let storageHint = "company-assets bucket not verified";
  try {
    if (isSupabaseServiceConfigured()) {
      const service = createServiceRoleClient();
      const { data, error } = await service.storage.listBuckets();
      if (error) {
        storageStatus = "Error";
        storageHint = "Storage list failed";
      } else if ((data ?? []).some((b) => b.id === COMPANY_ASSETS_BUCKET)) {
        storageStatus = "Configured";
        storageHint = "company-assets bucket present";
      }
    }
  } catch {
    storageStatus = "Error";
    storageHint = "Unable to inspect storage";
  }

  const brandingConfigured = Boolean(
    company?.logo_storage_path || pdf?.logo_storage_path,
  );

  return [
    {
      label: "Supabase connected",
      status: isSupabaseConfigured() ? "Configured" : "Missing",
      hint: "Public URL + anon key",
    },
    {
      label: "Service-role server configuration",
      status: isSupabaseServiceConfigured() ? "Configured" : "Missing",
      hint: "SUPABASE_SERVICE_ROLE_KEY",
    },
    {
      label: "Google OAuth configured",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing",
      hint: "Supabase Auth Google provider (manual verify in dashboard)",
    },
    {
      label: "Email provider configured",
      status: process.env.RESEND_API_KEY ? "Configured" : "Missing",
      hint: "RESEND_API_KEY",
    },
    {
      label: "Upstash configured",
      status: isUpstashConfigured() ? "Configured" : "Missing",
      hint: "UPSTASH_REDIS_REST_URL + TOKEN",
    },
    {
      label: "Storage bucket configured",
      status: storageStatus,
      hint: storageHint,
    },
    {
      label: "PDF branding configured",
      status: brandingConfigured ? "Configured" : "Missing",
      hint: "company or PDF logo path set",
    },
    {
      label: "Cron secret configured",
      status: process.env.CRON_SECRET ? "Configured" : "Missing",
      hint: "CRON_SECRET for quote expire/reminders",
    },
    {
      label: "Public site URL configured",
      status: process.env.NEXT_PUBLIC_SITE_URL ? "Configured" : "Missing",
      hint: "NEXT_PUBLIC_SITE_URL",
    },
  ];
}
