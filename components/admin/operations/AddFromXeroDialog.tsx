"use client";

import { AdminActionForm, AdminDialog, AdminSubmitButton } from "@/components/admin/ui";
import { createProjectFromXeroAction, linkProjectToXeroQuoteAction } from "@/app/admin/operations/project-actions";
import { formatOpsMoney } from "./ops-format";
import type { ProjectGroup } from "@/lib/operations/board";
import type { XeroStartItem } from "@/lib/operations/xero-start";

function quoteSubtitle(item: XeroStartItem): string {
  const title = (item.label ?? "").trim();
  const number = (item.number ?? "").trim();
  const parts: string[] = [];
  if (title && title.toUpperCase() !== number.toUpperCase()) parts.push(title);
  else if (number) parts.push(number);
  if (item.total) parts.push(formatOpsMoney(item.total));
  return parts.join(" · ");
}

export function AddFromXeroDialog({
  open,
  onClose,
  items,
  error,
  loading,
  group,
  linkProjectId,
}: {
  open: boolean;
  onClose: () => void;
  items: XeroStartItem[];
  error: string | null;
  loading: boolean;
  group: ProjectGroup | null;
  /** When set, attach the chosen quote to this existing project instead of creating one. */
  linkProjectId?: string | null;
}) {
  const linking = Boolean(linkProjectId);
  const quotes = items.filter((item) => item.kind === "quote");
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      size="wide"
      title={linking ? "Link to Xero" : "Add from Xero"}
      description={
        linking
          ? "Accepted quotes from the last 30 days that are not on a project yet."
          : "Accepted quotes from the last 30 days. The job is added to the stage you clicked."
      }
    >
      {loading && quotes.length === 0 ? <p className="ops-table__meta">Loading quotes from Xero…</p> : null}
      {!loading && error ? <p className="ops-xero-picker__error">{error}</p> : null}
      {!loading && !error && quotes.length === 0 ? <p className="ops-table__meta">No unclaimed accepted quotes in the last 30 days.</p> : null}
      {quotes.length ? (
        <ul className="ops-xero-picker">
          {quotes.map((item) => (
            <li key={item.id} className="ops-xero-picker__row">
              <span className="ops-xero-picker__main">
                <strong>{item.contact}</strong>
                <span className="ops-table__meta">{quoteSubtitle(item)}</span>
              </span>
              {linking && linkProjectId ? (
                <AdminActionForm action={linkProjectToXeroQuoteAction} className="ops-xero-picker__add">
                  <input type="hidden" name="id" value={linkProjectId} />
                  <input type="hidden" name="xero_id" value={item.id} />
                  <AdminSubmitButton variant="secondary" pendingLabel="Linking…">
                    +
                  </AdminSubmitButton>
                </AdminActionForm>
              ) : (
                <AdminActionForm action={createProjectFromXeroAction} className="ops-xero-picker__add">
                  <input type="hidden" name="kind" value="quote" />
                  <input type="hidden" name="xero_id" value={item.id} />
                  <input type="hidden" name="stay" value="1" />
                  {group ? <input type="hidden" name="group" value={group} /> : null}
                  <AdminSubmitButton variant="secondary" pendingLabel="Adding…">
                    +
                  </AdminSubmitButton>
                </AdminActionForm>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </AdminDialog>
  );
}
