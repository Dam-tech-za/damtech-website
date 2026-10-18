# Next session — deterministic restart

Last updated 18 Oct 2026 (production audit). Branch `claude/project-thread-7zqlsd` (from `main` @ `4ce56eb`).

## State
- Audit complete for everything reachable without owner credentials. Plan: `docs/development/production-seo-qa-execution-plan.md`. Verification record: `docs/development/production-final-verification.md`.
- Implemented + tested locally, **not yet deployed**: GSC 404 redirects, quote-wizard submit validation fix, tap-target CSS, blog external link repairs, analytics-safe QA scripts, new test suites.

## Restart commands
```
git checkout claude/project-thread-7zqlsd
npx tsc --noEmit && npm run lint && npm test && npm run build
npx next start -p 3200        # 3000 may be the owner's dev server; 3100 may hold a stale server
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 npx playwright test -c playwright.public.config.ts
node scripts/seo-snapshot.mjs http://127.0.0.1:3200 docs/seo/snapshots/after.json
node scripts/seo-snapshot.mjs --diff docs/seo/snapshots/live-2026-10-18.json docs/seo/snapshots/after.json docs/seo/snapshots/diff-latest.md
node scripts/audit-crawl.mjs https://www.dam-tech.co.za docs/audit   # read-only live crawl, ~10 min
```
Wayback retry (was offline on 18 Oct):
`curl "https://web.archive.org/cdx/search/cdx?url=dam-tech.co.za&matchType=domain&fl=original,timestamp,statuscode&collapse=urlkey&filter=statuscode:200"`

## Next actions, in order
1. After the owner approves deploy: merge, then verify on production with the two read-only commands above and update `production-final-verification.md`.
2. When a Supabase branch + test admin exist: run the BLOCKED rows in `docs/qa/01-user-journey-matrix.md`; draft and branch-test the advisor migration (plan P1-6).
3. Owner decision on calculator freeboard wording (plan P2-4).
4. 28 days after 18 Oct: compare GSC 28-day windows (same weekdays, South Africa) and update `docs/seo/02-gsc-baseline-and-ranking-analysis.md`.
