"use client";

import { useState, useTransition } from "react";

type Props = {
  kind: "company_logo" | "pdf_logo" | "signature" | "header_image";
  label: string;
  currentPath: string | null;
  previewUrl: string | null;
  recommended: string;
};

export function BrandAssetUploader({
  kind,
  label,
  currentPath,
  previewUrl: initialPreview,
  recommended,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState(initialPreview);
  const [path, setPath] = useState(currentPath);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    setProgress("Uploading…");
    startTransition(async () => {
      const body = new FormData();
      body.set("kind", kind);
      body.set("file", file);
      const response = await fetch("/api/admin/company-assets/", {
        method: "POST",
        body,
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        path?: string;
        previewUrl?: string | null;
      };
      if (!response.ok || !json.ok) {
        setError(json.error || "Upload failed.");
        setProgress(null);
        return;
      }
      setPath(json.path ?? null);
      setPreviewUrl(json.previewUrl ?? null);
      setProgress("Uploaded.");
    });
  }

  function onRemove() {
    if (!confirm(`Remove ${label}?`)) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/company-assets/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error || "Remove failed.");
        return;
      }
      setPath(null);
      setPreviewUrl(null);
      setProgress("Removed.");
    });
  }

  return (
    <div className="admin-panel" style={{ marginTop: "1rem" }}>
      <header className="admin-panel__header">
        <h3>{label}</h3>
        <p className="admin-empty__hint">
          Recommended: {recommended}. Max 2 MB. PNG / JPEG / WEBP (SVG sanitised).
        </p>
      </header>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          width={180}
          height={80}
          style={{ objectFit: "contain", marginBottom: "0.75rem" }}
        />
      ) : (
        <p className="admin-empty__hint">No image uploaded.</p>
      )}
      {path ? (
        <p className="admin-muted">
          Stored path: <code>{path}</code>
        </p>
      ) : null}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        disabled={pending}
        onChange={(e) => onFileChange(e.target.files)}
      />
      <div className="admin-panel__actions" style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--md btn--secondary"
          disabled={pending || !path}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      {progress ? <p className="admin-empty__hint">{progress}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
