import { DAMTECH_FONTS, DAMTECH_THEME } from "../theme.ts";
import {
  FALLBACK_FORM_LABELS,
  type DatabaseFallbackInput,
  type FallbackEmailSection,
} from "./types.ts";
import { shortIncidentRef } from "../rfq/submission-result.ts";
import { submissionIdSuffix } from "./submission-id.ts";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderRows(rows: Array<{ label: string; value: string }>): string {
  return rows
    .filter((row) => row.value.trim())
    .map(
      (row) => `<tr>
    <td style="padding:8px 12px 8px 0;font-weight:600;color:#0f172a;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</td>
    <td style="padding:8px 0;color:#334155;vertical-align:top;">${escapeHtml(row.value)}</td>
  </tr>`,
    )
    .join("");
}

function renderSection(section: FallbackEmailSection): string {
  const rows = renderRows(section.rows);
  if (!rows) return "";
  return `<h2 style="margin:24px 0 8px;font-size:16px;color:${DAMTECH_THEME.navyDark};">${escapeHtml(section.title)}</h2>
<table style="width:100%;border-collapse:collapse;" role="presentation"><tbody>${rows}</tbody></table>`;
}

export function buildFallbackEmailSubject(input: DatabaseFallbackInput): string {
  const ref = shortIncidentRef(input.incidentId);
  return `[DATABASE FALLBACK] ${FALLBACK_FORM_LABELS[input.formType]} — ${ref}`;
}

export function buildFallbackEmailHtml(input: DatabaseFallbackInput): string {
  const ref = shortIncidentRef(input.incidentId);
  const sections = input.sections.map(renderSection).join("");
  const attachments = input.attachmentsNote
    ? `<p style="margin:16px 0 0;padding:12px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;color:#9a3412;"><strong>Attachments:</strong> ${escapeHtml(input.attachmentsNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:${DAMTECH_FONTS.main};font-weight:${DAMTECH_FONTS.weightBody};background:#f8fafc;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:3px solid #dc2626;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#7f1d1d;color:#ffffff;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">DATABASE FALLBACK — manual RFQ/order required</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#fecaca;">Supabase persistence failed. This is not an RFQ number.</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 12px;"><strong>Form:</strong> ${escapeHtml(FALLBACK_FORM_LABELS[input.formType])}</p>
        <p style="margin:0 0 12px;"><strong>Incident ID:</strong> ${escapeHtml(ref)} (not an RFQ/order reference)</p>
        <p style="margin:0 0 12px;"><strong>Submission ID suffix:</strong> ${escapeHtml(submissionIdSuffix(input.submissionId))}</p>
        ${input.sourcePage ? `<p style="margin:0 0 12px;"><strong>Source page:</strong> ${escapeHtml(input.sourcePage)}</p>` : ""}
        ${sections}
        ${attachments}
        <p style="margin:24px 0 0;font-size:13px;color:#64748b;">Create the missing RFQ or order manually in the admin panel. Search the inbox for this incident ID before processing twice.</p>
      </div>
    </div>
  </body>
</html>`;
}

export function buildFallbackEmailText(input: DatabaseFallbackInput): string {
  const ref = shortIncidentRef(input.incidentId);
  const lines = [
    "DATABASE FALLBACK — manual RFQ/order required",
    "",
    `Form: ${FALLBACK_FORM_LABELS[input.formType]}`,
    `Incident ID: ${ref} (NOT an RFQ/order reference)`,
    `Submission ID suffix: ${submissionIdSuffix(input.submissionId)}`,
    input.sourcePage ? `Source page: ${input.sourcePage}` : null,
    "",
    ...input.sections.flatMap((section) => [
      section.title,
      ...section.rows
        .filter((row) => row.value.trim())
        .map((row) => `${row.label}: ${row.value}`),
      "",
    ]),
    input.attachmentsNote ? `Attachments: ${input.attachmentsNote}` : null,
    "",
    "Create the missing RFQ or order manually in the admin panel.",
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

export function buildOperationalAlertText(input: {
  formType: DatabaseFallbackInput["formType"];
  incidentId: string;
  timestampIso: string;
}): string {
  const ref = shortIncidentRef(input.incidentId);
  return [
    "DamTech database write failed — fallback email sent.",
    "",
    `Form: ${FALLBACK_FORM_LABELS[input.formType]}`,
    `Incident ID: ${ref}`,
    `Timestamp (UTC): ${input.timestampIso}`,
    "",
    "Check the [DATABASE FALLBACK] inbox message and create the RFQ/order manually.",
  ].join("\n");
}
