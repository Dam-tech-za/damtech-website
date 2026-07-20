"use client";

import { AdminButton } from "@/components/admin/ui";

type QuoteActionBarProps = {
  onSave: () => void;
  onPreview: () => void;
  onSend: () => void;
  savePending: boolean;
  previewDisabled?: boolean;
  sendDisabled: boolean;
};

export function QuoteActionBar({
  onSave,
  onPreview,
  onSend,
  savePending,
  previewDisabled = false,
  sendDisabled,
}: QuoteActionBarProps) {
  return (
    <div className="admin-form-actions admin-form-actions--sticky quote-action-bar">
      <AdminButton type="button" variant="primary" onClick={onSave} disabled={savePending}>
        {savePending ? "Saving…" : "Save"}
      </AdminButton>
      <AdminButton type="button" variant="secondary" onClick={onPreview} disabled={previewDisabled}>
        Preview
      </AdminButton>
      <AdminButton type="button" variant="secondary" onClick={onSend} disabled={sendDisabled}>
        Send
      </AdminButton>
    </div>
  );
}
