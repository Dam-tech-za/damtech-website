import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import type { EmailSendResult } from "@/lib/rfq/email/types";
import type { RfqCommunicationType } from "@/lib/rfq/email/types";
import { aggregateNotificationStatus } from "@/lib/rfq/notification-status";

export { aggregateNotificationStatus };

export async function recordRfqCommunication(input: {
  rfqId: string;
  communicationType: RfqCommunicationType;
  recipient: string;
  subject?: string;
  result: EmailSendResult;
}): Promise<void> {
  if (!isSupabaseServiceConfigured()) return;
  try {
    const client = createServiceRoleClient();
    const status =
      input.result.status === "skipped"
        ? "sent"
        : input.result.status === "pending_configuration"
          ? "pending_configuration"
          : input.result.ok
            ? "sent"
            : "failed";

    await client.from("rfq_communications").insert({
      rfq_id: input.rfqId,
      communication_type: input.communicationType,
      recipient: input.recipient || null,
      subject: input.subject ?? null,
      provider_message_id: input.result.ok
        ? input.result.providerMessageId ?? null
        : null,
      status,
      provider_error: input.result.ok
        ? null
        : truncate(input.result.error, 400),
      attempt_count: 1,
      attempted_at: new Date().toISOString(),
      sent_at: status === "sent" ? new Date().toISOString() : null,
      metadata: { source: "public_submission" },
    });
  } catch (error) {
    console.error(
      "rfq_communication_record_failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function enqueueNotificationOutbox(input: {
  entityType: string;
  entityId: string;
  notificationType: string;
  recipient: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseServiceConfigured()) return;
  try {
    const client = createServiceRoleClient();
    await client.from("notification_outbox").insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      notification_type: input.notificationType,
      recipient: input.recipient,
      payload: input.payload,
      status: "pending",
    });
  } catch (error) {
    console.error(
      "notification_outbox_enqueue_failed",
      error instanceof Error ? error.message : error,
    );
  }
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}
