# Admin Phase 4 notes

## Quote line drag-and-drop

Drag-and-drop was **deferred**. Move up / move down controls remain the supported, keyboard-accessible ordering path. Adding DnD without risking unsaved line edits or hydration issues was judged lower priority than functional correctness.

## Storage

Apply `supabase/migrations/20260715190000_company_assets_bucket.sql` for the private `company-assets` bucket and signature/header image columns.
