/**
 * Conservative classifier for when a database-fallback email is appropriate.
 * Unknown or business-rule errors must not trigger fallback with customer data.
 */

export type PersistenceFailureCode =
  | "CONFIGURATION_ERROR"
  | "DATABASE_UNAVAILABLE"
  | "DATABASE_CONSTRAINT"
  | "UNKNOWN_ERROR"
  | "VALIDATION_ERROR"
  | string
  | undefined;

export function shouldAttemptDatabaseFallback(
  code: PersistenceFailureCode,
): boolean {
  return code === "DATABASE_UNAVAILABLE" || code === "CONFIGURATION_ERROR";
}

export function classifyPersistenceFailure(
  code: PersistenceFailureCode,
): "infrastructure" | "business" | "unknown" | "validation" {
  if (code === "DATABASE_UNAVAILABLE" || code === "CONFIGURATION_ERROR") {
    return "infrastructure";
  }
  if (code === "DATABASE_CONSTRAINT" || code === "VALIDATION_ERROR") {
    return "business";
  }
  if (code === "UNKNOWN_ERROR" || !code) {
    return "unknown";
  }
  return "unknown";
}
