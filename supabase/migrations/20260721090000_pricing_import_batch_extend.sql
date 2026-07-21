-- Extend import batch/row tables with template + auditable snapshot fields.
-- Additive and idempotent so it is safe to re-run.

alter table public.pricing_import_batches
  add column if not exists template_type text,
  add column if not exists created_count integer not null default 0,
  add column if not exists updated_count integer not null default 0,
  add column if not exists mapping_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists validation_summary jsonb not null default '{}'::jsonb,
  add column if not exists completed_at timestamptz;

alter table public.pricing_import_rows
  add column if not exists source_data jsonb not null default '{}'::jsonb,
  add column if not exists normalised_data jsonb not null default '{}'::jsonb,
  add column if not exists created_price_id uuid references public.pricing_item_prices (id);
