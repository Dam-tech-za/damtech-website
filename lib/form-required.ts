/**
 * Client-side check run before a public form is sent: lists every required
 * field that is empty or invalid in one message (in form order), marks them
 * aria-invalid and focuses the first. The server still validates everything.
 */
export function checkRequiredFields(form: HTMLFormElement): string | null {
  const problems: { el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement; label: string }[] = [];
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea",
  );
  for (const el of fields) {
    if (el.disabled || el.type === "hidden" || el.name === "website") continue;
    const invalid = !el.checkValidity();
    if (invalid) {
      el.setAttribute("aria-invalid", "true");
      problems.push({ el, label: fieldLabel(form, el) });
    } else {
      el.removeAttribute("aria-invalid");
    }
  }
  if (!problems.length) return null;
  problems[0].el.focus();
  const labels = problems.map((p) => p.label);
  return labels.length === 1
    ? `Please complete: ${labels[0]}.`
    : `Please complete these fields: ${labels.join(", ")}.`;
}

function fieldLabel(form: HTMLFormElement, el: HTMLElement): string {
  const label = el.id ? form.querySelector(`label[for="${CSS.escape(el.id)}"]`) : el.closest("label");
  const text = (label?.textContent ?? el.getAttribute("name") ?? "field").replace(/\*/g, "").replace(/\s+/g, " ").trim();
  return text;
}
