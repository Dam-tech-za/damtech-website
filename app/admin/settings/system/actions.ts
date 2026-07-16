"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { hasUpstashConfiguration } from "@/lib/rate-limit/types";
import { enforceRateLimit } from "@/lib/rate-limit/client";
import { getRfqEmailConfig, isRfqEmailConfigured } from "@/lib/rfq/email/config";
import { sendRfqAdminNotification } from "@/lib/rfq/email/send-rfq-admin-notification";
import { recordRfqCommunication } from "@/lib/rfq/communications";

export type InfrastructureTestResult = {
  ok: boolean;
  checks: Array<{ name: string; status: string; detail: string }>;
};

export async function testRfqInfrastructureAction(options?: {
  sendTestEmail?: boolean;
}): Promise<InfrastructureTestResult> {
  const admin = await assertAdmin({ roles: ["owner", "admin"] });
  const checks: InfrastructureTestResult["checks"] = [];

  checks.push({
    name: "Supabase service role",
    status: isSupabaseServiceConfigured() ? "Operational" : "Missing",
    detail: "SUPABASE_SERVICE_ROLE_KEY + URL",
  });

  if (isSupabaseServiceConfigured()) {
    try {
      const client = createServiceRoleClient();
      const { data, error } = await client.rpc("rfq_infrastructure_ping");
      if (error) {
        checks.push({
          name: "RFQ infrastructure RPC",
          status: "Error",
          detail: error.message.slice(0, 120),
        });
      } else {
        const payload = (data || {}) as {
          rateLimitFn?: boolean;
          nextRfqNumberFn?: boolean;
        };
        checks.push({
          name: "RFQ infrastructure RPC",
          status: "Operational",
          detail: `rateLimitFn=${Boolean(payload.rateLimitFn)} nextRfqNumber=${Boolean(payload.nextRfqNumberFn)}`,
        });
      }

      const probe = await client.rpc("check_public_submission_rate_limit", {
        p_rate_key_hash: `admin-test-${admin.user.id}`.padEnd(32, "0").slice(0, 32),
        p_action: "admin-infrastructure-probe",
        p_limit: 100,
        p_window_seconds: 60,
      });
      checks.push({
        name: "Supabase rate-limit fallback",
        status: probe.error ? "Error" : "Operational",
        detail: probe.error?.message.slice(0, 120) || "RPC ok",
      });
    } catch (error) {
      checks.push({
        name: "Supabase connectivity",
        status: "Error",
        detail: error instanceof Error ? error.message.slice(0, 120) : "failed",
      });
    }
  }

  checks.push({
    name: "Upstash",
    status: hasUpstashConfiguration() ? "Configured" : "Missing",
    detail: hasUpstashConfiguration()
      ? "Distributed limiter available"
      : "Using Supabase/memory fallback for public RFQs",
  });

  if (hasUpstashConfiguration()) {
    const probe = await enforceRateLimit(`admin-infra:${admin.user.id}`, {
      name: "admin-infrastructure-probe",
      limit: 20,
      windowMs: 60_000,
      onProviderError: "fail_closed",
    });
    checks.push({
      name: "Upstash probe",
      status: probe.success || probe.reason === "rate_limited" ? "Operational" : "Error",
      detail: `provider=${probe.provider || "unknown"}`,
    });
  }

  const email = getRfqEmailConfig();
  checks.push({
    name: "Resend",
    status: email.configured ? "Configured" : "Missing",
    detail: email.configured
      ? `from=${email.fromEmail}`
      : "RESEND_API_KEY missing — RFQs still save",
  });
  checks.push({
    name: "RFQ sender / internal notify",
    status: "Configured",
    detail: `${email.fromEmail} → ${email.internalNotificationEmail}`,
  });

  if (options?.sendTestEmail && isRfqEmailConfigured()) {
    const result = await sendRfqAdminNotification({
      rfqNumber: "RFQ-TEST-INFRA",
      customerName: "Infrastructure Test",
      services: ["System test"],
      location: "Admin settings",
      assetCount: 0,
      quantitySummary: "Do not treat as a customer RFQ",
      adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.dam-tech.co.za"}/admin/settings/system/`,
      enquiryChannel: "simple_public_rfq",
      messagePreview: "Admin infrastructure test email",
    });
    checks.push({
      name: "Test Resend email",
      status: result.ok ? "Operational" : "Error",
      detail: result.ok
        ? result.providerMessageId || "sent"
        : result.error.slice(0, 120),
    });
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "rfq_infrastructure_tested",
    entityType: "system",
    metadata: {
      checks: checks.map((c) => ({ name: c.name, status: c.status })),
    },
  });

  revalidatePath("/admin/settings/system/");
  return {
    ok: checks.every((c) => c.status !== "Error" && c.status !== "Missing"),
    checks,
  };
}

export async function resendRfqAdminNotificationAction(
  rfqId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await assertAdmin({ permission: "manageRfqs" });
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const client = createServiceRoleClient();
  const { data: rfq, error } = await client
    .from("rfqs")
    .select(
      "id, rfq_number, contact_name, service_required, services_requested, project_location, enquiry_channel, project_description",
    )
    .eq("id", rfqId)
    .maybeSingle();

  if (error || !rfq) {
    return { ok: false, error: "RFQ not found." };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";
  const emailConfig = getRfqEmailConfig();

  const result = await sendRfqAdminNotification({
    rfqNumber: rfq.rfq_number,
    customerName: rfq.contact_name || "Customer",
    services: Array.isArray(rfq.services_requested)
      ? rfq.services_requested
      : [rfq.service_required || "Other"],
    location: rfq.project_location || "—",
    assetCount: 0,
    quantitySummary: (rfq.project_description || "").slice(0, 200) || "—",
    adminUrl: `${origin}/admin/rfqs/${rfq.id}/`,
    enquiryChannel: rfq.enquiry_channel || "simple_public_rfq",
  });

  await recordRfqCommunication({
    rfqId: rfq.id,
    communicationType: "admin_resend",
    recipient: emailConfig.internalNotificationEmail,
    subject: `New RFQ ${rfq.rfq_number}`,
    result,
  });

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "rfq_admin_notification_resent",
    entityType: "rfq",
    entityId: rfq.id,
    metadata: { ok: result.ok },
  });

  revalidatePath(`/admin/rfqs/${rfqId}/`);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
