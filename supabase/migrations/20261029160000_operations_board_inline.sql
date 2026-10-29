-- Operations board v4: inline editing, free-text lead, payment override, place pin.
-- Additive. Safe to re-run (IF NOT EXISTS).

alter table public.ops_projects
  add column if not exists project_lead_name text,
  add column if not exists payment_label_override text,
  add column if not exists quoted_total_manual boolean not null default false,
  add column if not exists manual_fields jsonb not null default '{}'::jsonb,
  add column if not exists site_place_id text,
  add column if not exists site_lat numeric(10, 7),
  add column if not exists site_lng numeric(10, 7);

alter table public.ops_projects drop constraint if exists ops_projects_payment_label_override_check;
alter table public.ops_projects
  add constraint ops_projects_payment_label_override_check check (
    payment_label_override is null or payment_label_override in (
      'deposit_invoiced',
      'portion_of_deposit_paid',
      'deposit_paid',
      'balance_due',
      'paid_in_full'
    )
  );

comment on column public.ops_projects.project_lead_name is
  'Free-text project lead (Arno, Andre, …). Independent of admin sign-in.';
comment on column public.ops_projects.payment_label_override is
  'Staff-chosen payment picture. When set, Xero sync keeps amounts but does not replace this label.';
comment on column public.ops_projects.quoted_total_manual is
  'True when staff typed the value; Xero must not overwrite quoted_total_incl_vat.';
comment on column public.ops_projects.manual_fields is
  'Keys of fields staff edited (title, lead, payment, client, phone, value, location, xero, company). Xero fill-blanks skips these.';
comment on column public.ops_projects.site_place_id is
  'Optional Google Place id when a Places suggestion was picked.';
comment on column public.ops_projects.site_lat is
  'Site latitude used for km-from-office (haversine).';
comment on column public.ops_projects.site_lng is
  'Site longitude used for km-from-office (haversine).';
