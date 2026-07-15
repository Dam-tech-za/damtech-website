import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";

export type AuditLogInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Best-effort audit write via service role.
 * Never throws to callers — auth/audit failures must not break UX paths.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    return;
  }

  try {
    const client = createServiceRoleClient();
    const { error } = await client.from("audit_log").insert({
      actor_user_id: input.actorUserId ?? null,
      actor_email: input.actorEmail ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      before_data: input.beforeData ?? null,
      after_data: input.afterData ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("[audit] insert failed:", error.message);
    }
  } catch (error) {
    console.error("[audit] unexpected failure:", error);
  }
}
