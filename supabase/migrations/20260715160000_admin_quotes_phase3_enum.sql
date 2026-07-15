-- Phase 3a: extend quote_status enum (must commit before values are usable)
alter type public.quote_status add value if not exists 'internal_review';
alter type public.quote_status add value if not exists 'approved';
alter type public.quote_status add value if not exists 'viewed';
alter type public.quote_status add value if not exists 'rejected';
alter type public.quote_status add value if not exists 'superseded';
