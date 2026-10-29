"use client";

import { AdminActionForm, AdminDialog, AdminSubmitButton } from "@/components/admin/ui";
import { createProjectFromXeroAction, linkProjectToXeroQuoteAction } from "@/app/admin/operations/project-actions";
import { formatOpsMoney } from "./ops-format";
import type { ProjectGroup } from "@/lib/operations/board";
import type { XeroStartItem } from "@/lib/operations/xero-start";

function quoteSubtitle(item: XeroStartItem, possibleDuplicate: boolean): string {
  const title = (item.label ?? "").trim();
  const number = (item.number ?? "").trim();
  const parts: string[] = [];
  if (title && title.toUpperCase() !== number.toUpperCase()) parts.push(title);
  else if (number) parts.push(number);
  if (item.total) parts.push(formatOpsMoney(item.total));
  if (possibleDuplicate) parts.push("possible duplicate");
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
  existingKeys = [],
}: {
  open: boolean;
  onClose: () => void;
  items: XeroStartItem[];
  error: string | null;
  loading: boolean;
  group: ProjectGroup | null;
  /** When set, attach the chosen quote to this existing project instead of creating one. */
  linkProjectId?: string | null;
  /** Lowercased "customer|title" keys already on the board, for duplicate hints. */
  existingKeys?: string[];
}) {
  const linking = Boolean(linkProjectId);
  const quotes = items.filter((item) => item.kind === "quote");
  const keySet = new Set(existingKeys);
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
          {quotes.map((item) => {
            const dupKey = `${(item.contact ?? "").trim().toLowerCase()}|${(item.label ?? item.number ?? "").trim().toLowerCase()}`;
            const possibleDuplicate = keySet.has(dupKey);
            return (
            <li key={item.id} className="ops-xero-picker__row">
              <span className="ops-xero-picker__main">
                <strong>{item.contact}</strong>
                <span className="ops-table__meta">{quoteSubtitle(item, possibleDuplicate)}</span>
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
            );
          })}
        </ul>
      ) : null}
    </AdminDialog>
  );
}
