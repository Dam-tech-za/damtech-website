-- =============================================================================
-- Damtech RFQ — status enum extensions (commit BEFORE using new values)
-- Apply AFTER: 20260715170000_public_rfq_assets_phase1.sql
-- =============================================================================

alter type public.rfq_status add value if not exists 'site_measurement_required';
alter type public.rfq_status add value if not exists 'archived';
