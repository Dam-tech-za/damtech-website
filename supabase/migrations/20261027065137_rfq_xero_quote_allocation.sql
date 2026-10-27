-- =============================================================================
-- RFQ ↔ Xero quote allocation
-- When a quote is sent in Xero, link it to the enquiry and mark it attended.
-- =============================================================================

-- New status: quote issued in Xero (attended). Keep converted for website quotes.
alter type public.rfq_status add value if not exists 'quote_sent';

alter table public.rfqs
  add column if not exists xero_quote_id uuid,
  add column if not exists xero_quote_number text,
  add column if not exists xero_quote_status text,
  add column if not exists xero_quote_allocated_at timestamptz;

comment on column public.rfqs.xero_quote_id is
  'Xero QuoteID allocated to this enquiry when the estimator sent the quote.';
comment on column public.rfqs.xero_quote_number is
  'Xero quote number (e.g. QU0288) shown in the admin inbox.';
comment on column public.rfqs.xero_quote_status is
  'Last known Xero quote status at allocation time (SENT, ACCEPTED, …).';
comment on column public.rfqs.xero_quote_allocated_at is
  'When the Xero quote was linked to this RFQ in admin.';

-- One RFQ per Xero quote (nulls allowed for unallocated enquiries).
create unique index if not exists rfqs_xero_quote_id_uidx
  on public.rfqs (xero_quote_id)
  where xero_quote_id is not null;

create index if not exists rfqs_xero_quote_number_idx
  on public.rfqs (xero_quote_number)
  where xero_quote_number is not null;
