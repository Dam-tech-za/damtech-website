const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSubmissionId(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value.trim()));
}

export function parseSubmissionIdFromFormData(
  formData: FormData,
): { ok: true; submissionId: string } | { ok: false; error: string } {
  const raw = String(formData.get("submissionId") ?? "").trim();
  if (!isValidSubmissionId(raw)) {
    return {
      ok: false,
      error: "Please reload the page and try again.",
    };
  }
  return { ok: true, submissionId: raw };
}

export function submissionIdSuffix(submissionId: string): string {
  return submissionId.replace(/-/g, "").slice(-8).toUpperCase();
}
