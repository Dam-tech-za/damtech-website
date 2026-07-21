/**
 * Shared types for the Damtech inventory CSV import pipeline.
 *
 * Pipeline stages (each implemented in its own module):
 *   parse-csv → normalize-header → detect-template → auto-map-columns
 *   → normalize-value/validate-row → validate-batch → detect-duplicates
 *   → calculate-derived-fields → build-import-preview → commit-import
 */

import type { CanonicalHeader } from "../csv/columns";

export type MatchMethod =
  | "exact"
  | "alias"
  | "normalised_alias"
  | "fuzzy"
  | "unmatched";

export type MatchStatus = "exact" | "alias" | "suggested" | "unmatched" | "conflict";

/** Result of matching one CSV column header against the canonical schema. */
export type ColumnMatch = {
  sourceHeader: string;
  normalised: string;
  target: CanonicalHeader | null;
  confidence: number;
  method: MatchMethod;
  status: MatchStatus;
  /** True when the match is safe to auto-accept without user review. */
  autoAccepted: boolean;
};

export type AutoMapResult = {
  matches: ColumnMatch[];
  /** header → canonical target for every auto-accepted (and best-guess) column. */
  mapping: Record<string, CanonicalHeader | "">;
  matchedCount: number;
  autoAcceptedCount: number;
  totalCanonical: number;
  unmatchedHeaders: string[];
  suggestedHeaders: string[];
  conflicts: Array<{ target: CanonicalHeader; headers: string[] }>;
  /** True when any column needs manual review or a required field is missing. */
  requiresAttention: boolean;
  missingRequired: CanonicalHeader[];
};

export type TemplateType =
  | "unified"
  | "legacy_materials"
  | "labour"
  | "supplier_prices"
  | "travel_vehicles"
  | "generic_supplier"
  | "unknown";

export type TemplateDetection = {
  template: TemplateType;
  label: string;
  confidence: number;
  recognisedFields: number;
  totalFields: number;
  /** When true the UI may skip the manual mapping step by default. */
  skipMapping: boolean;
};
