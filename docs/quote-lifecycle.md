# Quote lifecycle

Damtech quotations move through a controlled status model:

```txt
draft → internal_review → approved → sent → viewed → accepted | rejected | expired
```

Additional statuses:

- `cancelled` — stopped without customer outcome; number retained
- `superseded` — previous revision after a new revision is created

## Rules

- Sales/estimator may create and edit `draft` / `internal_review`
- Admin/owner approve (`internal_review` → `approved`)
- Only `approved` quotes may be sent, unless owner explicitly overrides
- Sent/viewed/accepted quotes are locked; changes require a new revision
- Totals are always recalculated on the server before save
- Company/terms snapshots freeze at approval (and refreshed at send)

## Key modules

- `lib/quotes/save.ts` — create/update drafts
- `lib/quotes/lifecycle.ts` — transitions, revise, duplicate
- `lib/quotes/send.ts` — PDF + token + Resend email
- `lib/quotes/public.ts` — tokenised customer view/accept/reject
- `lib/quotes/pdf.tsx` — `@react-pdf/renderer` document

## RFQ conversion

`lib/rfq/convert-to-quote.ts` imports customer + calculator suggestions into a draft. Estimators must confirm suggested quantities; calculator output is never treated as final measured quantity.
