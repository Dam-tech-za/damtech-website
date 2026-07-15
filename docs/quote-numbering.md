# Quote numbering

## Format

```txt
DT-Q-2026-00001
DT-Q-2026-00001 Rev 0
```

Prefix and yearly reset are configurable in `/admin/settings/quotes/`.

## Rules

- Allocated only by `next_quote_number()` (Postgres, concurrency-safe upsert on `quote_number_sequences`)
- Never generated in the browser
- Quote number never changes across revisions
- Revision number increments; display as `Rev N`
- Cancelled numbers are not reused
- Duplicate quote → new quote number, revision 0
- Revision → same quote number, `revision_number + 1`, previous row `superseded`

## Migration note

Phase 2 used `Q-YYYY-#####`. Phase 3 updates `next_quote_number()` to `DT-Q-YYYY-#####` by default. Existing quote numbers remain as stored.
