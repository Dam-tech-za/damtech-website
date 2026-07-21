"use client";

import { useRef, useState } from "react";
import { AdminButton, AdminStatusBadge } from "@/components/admin/ui";

export type SelectedFileMeta = {
  name: string;
  sizeBytes: number;
  rows: number;
  columns: number;
  encoding: string;
  templateLabel: string;
  templateConfidence: number;
};

type CsvDropzoneProps = {
  file: SelectedFileMeta | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CsvDropzone({ file, disabled, onSelect, onRemove }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick() {
    inputRef.current?.click();
  }

  if (file) {
    return (
      <div className="imp-file-card">
        <span className="imp-file-card__icon" aria-hidden>
          CSV
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="imp-file-card__name">{file.name}</p>
          <p className="imp-file-card__meta">
            <span>{file.rows} rows</span>
            <span>{file.columns} columns</span>
            <span>{formatBytes(file.sizeBytes)}</span>
            <span>{file.encoding}</span>
          </p>
          <div style={{ marginTop: "0.4rem" }}>
            <AdminStatusBadge
              status="ready_for_validation"
              label={`Template: ${file.templateLabel}${file.templateConfidence ? ` · ${file.templateConfidence}%` : ""}`}
              domain="pricing"
            />
          </div>
        </div>
        <div className="imp-file-card__actions">
          <AdminButton type="button" size="sm" variant="secondary" onClick={pick} disabled={disabled}>
            Replace
          </AdminButton>
          <AdminButton type="button" size="sm" variant="ghost" onClick={onRemove} disabled={disabled}>
            Remove
          </AdminButton>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`imp-dropzone${dragging ? " imp-dropzone--drag" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Upload a CSV file. Drop a file here or press to browse."
      onClick={pick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onSelect(f);
      }}
    >
      <span className="imp-dropzone__icon" aria-hidden>
        ⬆
      </span>
      <p className="imp-dropzone__title">Drop CSV here or browse</p>
      <p className="imp-dropzone__hint">
        Accepts .csv up to 5 MB / 5 000 rows. UTF-8 with BOM recommended for Excel (m² / m³).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
