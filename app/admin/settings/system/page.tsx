import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { hasUpstashConfiguration } from "@/lib/rate-limit/types";
import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/env";
import { getCompanySettings, getQuotePdfSettings } from "@/lib/quotes/settings";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { COMPANY_ASSETS_BUCKET } from "@/lib/storage/company-assets";
import { getRfqEmailConfig } from "@/lib/rfq/email/config";
import { SystemInfrastructureTest } from "@/components/admin/SystemInfrastructureTest";

type Status =
  | "Configured"
  | "Operational"
  | "Partial"
  | "Degraded"
  | "Missing"
  | "Error";

type Check = {
  label: string;
  status: Status;
  hint: string;
};

export default async function AdminSystemSettingsPage() {
  await requireAdmin({ roles: ["owner", "admin"] });
  const checks = await collectChecks();

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="System health"
        description="Supabase, Resend, Upstash, storage and cron status checks."
        secondaryAction={{ href: "/admin/settings/", label: "All settings" }}
      />

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>Infrastructure status</h2>
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
                      className={`admin-status admin-status--${statusClass(
                        check.status,
                      )}`}
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

        <SystemInfrastructureTest />

        <h3 className="admin-subheading">Production-readiness checklist</h3>
        <ul className="admin-list">
          <li>Apply migration `20260716090000_public_rfq_submission_repair.sql`</li>
          <li>Set SUPABASE_SERVICE_ROLE_KEY on Vercel (Production + Preview)</li>
          <li>
            Set RESEND_API_KEY and RFQ_FROM_EMAIL / QUOTE_FROM_EMAIL (verified domain)
          </li>
          <li>
            Optional: UPSTASH_REDIS_REST_URL + TOKEN (public RFQs fall back to
            Supabase when missing)
          </li>
          <li>Set RATE_LIMIT_HASH_SECRET for privacy-conscious rate-limit keys</li>
          <li>Set CRON_SECRET and verify Vercel cron routes</li>
          <li>Confirm NEXT_PUBLIC_SITE_URL uses the canonical www origin</li>
          <li>Redeploy after changing environment variables</li>
        </ul>
      </div>
    </div>
  );
}

function statusClass(status: Status): string {
  if (status === "Configured" || status === "Operational") {
    return "ready_for_quote";
  }
  if (status === "Partial" || status === "Degraded" || status === "Missing") {
    return "information_required";
  }
  return "spam";
}

async function collectChecks(): Promise<Check[]> {
  const company = await getCompanySettings().catch(() => null);
  const pdf = await getQuotePdfSettings().catch(() => null);
  const email = getRfqEmailConfig();

  let storageStatus: Status = "Missing";
  let storageHint = "company-assets bucket not verified";
  let rpcStatus: Status = "Missing";
  let rpcHint = "Apply RFQ repair migration";
  let rateFallbackStatus: Status = "Missing";
  let rateFallbackHint = "check_public_submission_rate_limit RPC";
  let lastRfqHint = "No RFQs yet";
  let lastFailedHint = "None recorded";
  let lastNotifyHint = "None recorded";
  let pendingNotifyHint = "0";

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

      const ping = await service.rpc("rfq_infrastructure_ping");
      if (ping.error) {
        rpcStatus = "Error";
        rpcHint = ping.error.message.slice(0, 120);
      } else {
        rpcStatus = "Operational";
        const payload = (ping.data || {}) as {
          rateLimitFn?: boolean;
          nextRfqNumberFn?: boolean;
        };
        rpcHint = `next_rfq_number=${Boolean(payload.nextRfqNumberFn)} rate_limit=${Boolean(payload.rateLimitFn)}`;
        rateFallbackStatus = payload.rateLimitFn ? "Operational" : "Missing";
        rateFallbackHint = payload.rateLimitFn
          ? "Supabase fallback ready"
          : "Migration not applied";
      }

      const { data: lastRfq } = await service
        .from("rfqs")
        .select("rfq_number, created_at, status")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastRfq) {
        lastRfqHint = `${lastRfq.rfq_number} · ${lastRfq.status} · ${lastRfq.created_at}`;
      }

      const { data: lastFailed } = await service
        .from("rfq_communications")
        .select("communication_type, status, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastFailed) {
        lastFailedHint = `${lastFailed.communication_type} · ${lastFailed.created_at}`;
      }

      const { data: lastSent } = await service
        .from("rfq_communications")
        .select("communication_type, created_at")
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastSent) {
        lastNotifyHint = `${lastSent.communication_type} · ${lastSent.created_at}`;
      }

      const { count } = await service
        .from("rfq_communications")
        .select("id", { count: "exact", head: true })
        .in("status", ["failed", "pending", "pending_configuration"]);
      pendingNotifyHint = String(count ?? 0);
    }
  } catch {
    storageStatus = "Error";
    storageHint = "Unable to inspect storage";
  }

  const brandingConfigured = Boolean(
    company?.logo_storage_path || pdf?.logo_storage_path,
  );

  const upstash = hasUpstashConfiguration();

  return [
    {
      label: "Supabase URL configured",
      status: isSupabaseConfigured() ? "Configured" : "Missing",
      hint: "NEXT_PUBLIC_SUPABASE_URL + anon key",
    },
    {
      label: "Supabase service role configured",
      status: isSupabaseServiceConfigured() ? "Configured" : "Missing",
      hint: "SUPABASE_SERVICE_ROLE_KEY",
    },
    {
      label: "Production RFQ RPC available",
      status: rpcStatus,
      hint: rpcHint,
    },
    {
      label: "Upstash configured",
      status: upstash ? "Configured" : "Missing",
      hint: upstash
        ? "Distributed limiter active"
        : "Public RFQs use Supabase fallback / allow on outage",
    },
    {
      label: "Supabase rate-limit fallback",
      status: rateFallbackStatus,
      hint: rateFallbackHint,
    },
    {
      label: "Resend configured",
      status: email.configured ? "Configured" : "Missing",
      hint: email.configured
        ? "RESEND_API_KEY present"
        : "RFQs still save when email is missing",
    },
    {
      label: "RFQ sender configured",
      status: "Configured",
      hint: email.fromEmail,
    },
    {
      label: "Internal notification recipient",
      status: "Configured",
      hint: email.internalNotificationEmail,
    },
    {
      label: "Last successful RFQ submission",
      status: lastRfqHint.startsWith("No") ? "Missing" : "Operational",
      hint: lastRfqHint,
    },
    {
      label: "Last failed / pending notification",
      status:
        pendingNotifyHint === "0" && lastFailedHint === "None recorded"
          ? "Operational"
          : "Degraded",
      hint: `pending/failed=${pendingNotifyHint}; lastFailed=${lastFailedHint}; lastSent=${lastNotifyHint}`,
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
    {
      label: "Rate-limit hash secret",
      status: process.env.RATE_LIMIT_HASH_SECRET ? "Configured" : "Degraded",
      hint: process.env.RATE_LIMIT_HASH_SECRET
        ? "RATE_LIMIT_HASH_SECRET set"
        : "Falling back to CRON_SECRET / service key slice",
    },
    ...(await collectPricingReadiness()),
  ];
}

async function collectPricingReadiness(): Promise<Check[]> {
  if (!isSupabaseServiceConfigured()) {
    return [
      {
        label: "Pricing catalogue readiness",
        status: "Missing",
        hint: "Service role required to inspect pricing tables",
      },
    ];
  }

  try {
    const service = createServiceRoleClient();
    const { count: pricingCount } = await service
      .from("pricing_items")
      .select("id", { count: "exact", head: true });
    const { count: labourLinked } = await service
      .from("labour_items")
      .select("id", { count: "exact", head: true })
      .not("pricing_item_id", "is", null);
    const { count: crews } = await service
      .from("labour_crews")
      .select("id", { count: "exact", head: true });
    const { count: vehicles } = await service
      .from("travel_vehicles")
      .select("id", { count: "exact", head: true });

    const { count: tankModels } = await service
      .from("tank_models")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    const { count: priceVersions } = await service
      .from("pricing_item_prices")
      .select("id", { count: "exact", head: true });

    return [
      {
        label: "Material catalogue",
        status: (pricingCount ?? 0) > 0 ? "Operational" : "Partial",
        hint: `${pricingCount ?? 0} pricing_items`,
      },
      {
        label: "Labour synchronisation",
        status: (labourLinked ?? 0) > 0 ? "Operational" : "Partial",
        hint: `${labourLinked ?? 0} labour rows linked`,
      },
      {
        label: "Crew templates",
        status: (crews ?? 0) > 0 ? "Operational" : "Missing",
        hint: `${crews ?? 0} crews`,
      },
      {
        label: "Travel rates",
        status: (vehicles ?? 0) > 0 ? "Operational" : "Partial",
        hint: `${vehicles ?? 0} vehicles (settings defaults always available)`,
      },
      {
        label: "Tank models",
        status: (tankModels ?? 0) > 0 ? "Operational" : "Missing",
        hint: `${tankModels ?? 0} active models`,
      },
      {
        label: "Price history",
        status: (priceVersions ?? 0) > 0 ? "Operational" : "Partial",
        hint: `${priceVersions ?? 0} pricing_item_prices rows`,
      },
      {
        label: "CSV importer",
        status: "Partial",
        hint: "/admin/pricing/import/ — materials & labour import/export ready; supplier/travel commit scaffolded",
      },
      {
        label: "Legacy fallback",
        status: "Degraded",
        hint: "Still enabled until catalogue readiness checks pass — see docs/pricing-legacy-migration.md",
      },
      {
        label: "RLS cost protection",
        status: "Operational",
        hint: "Apply 20260720130000 migration for can_view_internal_costs()",
      },
    ];
  } catch {
    return [
      {
        label: "Pricing catalogue readiness",
        status: "Error",
        hint: "Apply pricing migrations 20260720120000 and 20260720130000",
      },
    ];
  }
}
