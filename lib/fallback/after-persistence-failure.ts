import { shouldAttemptDatabaseFallback } from "./classifier.ts";
import { deliverDatabaseFallback } from "./service.ts";
import { totalFailureCustomerMessage } from "./messages.ts";
import type { DatabaseFallbackInput } from "./types.ts";
import type { DeliverDatabaseFallbackDeps } from "./service.ts";

export async function attemptDatabaseFallbackAfterPersistenceFailure(
  input: {
    incidentId: string;
    databaseErrorCode?: string;
    fallbackInput: DatabaseFallbackInput;
  },
  deps?: DeliverDatabaseFallbackDeps,
): Promise<
  | { ok: true; incidentId: string; idempotentReplay: boolean }
  | { ok: false; incidentId: string; customerMessage: string }
> {
  if (!shouldAttemptDatabaseFallback(input.databaseErrorCode)) {
    return {
      ok: false,
      incidentId: input.incidentId,
      customerMessage: totalFailureCustomerMessage(input.incidentId),
    };
  }

  const delivered = await deliverDatabaseFallback(
    input.fallbackInput,
    input.databaseErrorCode ?? "DATABASE_UNAVAILABLE",
    deps,
  );

  if (!delivered.ok) {
    return {
      ok: false,
      incidentId: input.incidentId,
      customerMessage: totalFailureCustomerMessage(input.incidentId),
    };
  }

  return {
    ok: true,
    incidentId: delivered.incidentId,
    idempotentReplay: delivered.idempotentReplay,
  };
}
