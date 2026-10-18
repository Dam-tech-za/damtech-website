/**
 * Result shape returned by admin Server Actions used with `useActionState`.
 * `at` makes two identical messages distinct so screen readers re-announce.
 */
export type AdminActionState = {
  ok: boolean;
  message: string;
  at: number;
} | null;

export function actionSuccess(message: string): AdminActionState {
  return { ok: true, message, at: Date.now() };
}

export function actionFailure(message: string): AdminActionState {
  return { ok: false, message, at: Date.now() };
}

type AuthLikeError = { name?: unknown; code?: unknown };

/**
 * Turns an unexpected error into a message an administrator can act on
 * without leaking database or provider details.
 */
export function describeActionError(error: unknown): string {
  const candidate = error as AuthLikeError | null;
  if (candidate && candidate.name === "AdminAuthError") {
    if (candidate.code === "unauthenticated") {
      return "Your session has expired. Sign in again and retry.";
    }
    if (candidate.code === "unauthorised") {
      return "Your account is not approved for admin access.";
    }
    return "Your role is not allowed to make this change.";
  }
  return "The change could not be saved. Please try again. If it keeps failing, check System health under Settings.";
}
