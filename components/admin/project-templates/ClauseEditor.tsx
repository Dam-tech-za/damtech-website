"use client";

import { useState } from "react";
import { AdminButton, AdminCheckbox, AdminTextarea } from "@/components/admin/ui";
import {
  clausesToText,
  newClause,
  parseClauses,
  type Clause,
} from "@/lib/project-templates/clauses";

type Props = {
  label: string;
  clauses: Clause[];
  onChange: (clauses: Clause[]) => void;
  internal?: boolean;
};

export function ClauseEditor({ label, clauses, onChange, internal }: Props) {
  const [textMode, setTextMode] = useState(false);
  const [draftText, setDraftText] = useState("");

  function update(id: string, patch: Partial<Clause>) {
    onChange(clauses.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function remove(id: string) {
    onChange(clauses.filter((c) => c.id !== id));
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= clauses.length) return;
    const next = [...clauses];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function enterTextMode() {
    setDraftText(clausesToText(clauses).replace(/^\d+\.\s*/gm, ""));
    setTextMode(true);
  }
  function applyTextMode() {
    onChange(parseClauses(draftText));
    setTextMode(false);
  }

  return (
    <div className="pt-clause-editor" aria-label={label}>
      <div className="pt-clause-editor__head">
        <span className="pt-clause-editor__title">
          {label}
          {internal ? (
            <span className="admin-badge admin-badge--warning pt-internal-tag">
              Internal
            </span>
          ) : null}
        </span>
        {textMode ? (
          <AdminButton type="button" size="sm" variant="secondary" onClick={applyTextMode}>
            Apply as clauses
          </AdminButton>
        ) : (
          <AdminButton type="button" size="sm" variant="ghost" onClick={enterTextMode}>
            Edit as text
          </AdminButton>
        )}
      </div>

      {textMode ? (
        <AdminTextarea
          rows={8}
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          placeholder="One clause per line"
        />
      ) : (
        <>
          <ul className="pt-clause-list">
            {clauses.map((clause, index) => (
              <li key={clause.id} className="pt-clause-row">
                <AdminCheckbox
                  checked={clause.included}
                  onChange={(event) =>
                    update(clause.id, { included: event.target.checked })
                  }
                  label={
                    <span className="sr-only">{`Include clause ${index + 1}`}</span>
                  }
                />
                <AdminTextarea
                  rows={2}
                  value={clause.text}
                  onChange={(event) => update(clause.id, { text: event.target.value })}
                  aria-label={`${label} clause ${index + 1}`}
                />
                <div className="pt-clause-row__actions">
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    ↑
                  </AdminButton>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </AdminButton>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(clause.id)}
                    aria-label="Remove clause"
                  >
                    ✕
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
          <AdminButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onChange([...clauses, newClause()])}
          >
            + Add clause
          </AdminButton>
        </>
      )}
    </div>
  );
}
