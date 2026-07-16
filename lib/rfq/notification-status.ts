import type { EmailSendResult } from "./email/types.ts";
import type { PublicRfqNotificationStatus } from "./submission-result.ts";

export function aggregateNotificationStatus(
  results: EmailSendResult[],
): PublicRfqNotificationStatus {
  if (!results.length) return "pending";
  if (results.every((r) => r.ok)) return "sent";
  if (results.some((r) => !r.ok && r.status === "pending_configuration")) {
    return "pending_configuration";
  }
  if (results.some((r) => !r.ok)) return "failed";
  return "sent";
}
