# Release verification

## Branch and commits
Branch `claude/project-thread-mfiulx` from `main` @ 8d1acc8 (the commit production was deployed from at takeover).

| Commit | Summary |
|---|---|
| a4791f1 | New brand system, header, footer, homepage rebuild; SEO snapshot tool + baseline |
| 626f1a4 | Inner-page and residential templates; snapshot waits for network idle |
| 3ef6712 | Mission ledger, before/after comparisons |
| c548c9d | Blog article masthead; lab performance probe |
| 8b78b55 | Admin "Enquiry source" panel; brand, photography, SEO, performance docs |
| (latest) | Admin/takeover/results/release/owner docs, CLAUDE.md rules |

## Checks run locally (Windows, production build)
- `npx tsc --noEmit` — clean.
- `npx eslint` — 0 errors (11 pre-existing warnings in admin/calculator files).
- `npm test` — 300/300 pass.
- `npm run build` — passes, all 75 sitemap routes prerender.
- SEO snapshot diff vs `main` — no regressions (see `docs/seo/seo-preservation-diff.md`).
- 390 px overflow check on 17 key routes — none.
- Lab performance probe — see `docs/performance/benchmark-comparison.md`.

## Deployments
| Target | Status |
|---|---|
| Vercel preview (branch) | Built successfully for 626f1a4 ("Deployment has completed" commit status). Protected by Vercel authentication, so not browsed from this environment. Later commits deploy the same way on push. |
| Production | **Not deployed.** No merge to `main`; production still serves 8d1acc8. |

## Rollback
Nothing to roll back in production. To abandon the redesign, close the PR / delete the branch; `main` is untouched.

## Unresolved before release
1. Owner visual review of the preview.
2. Authenticated admin click-through (blocked on test access).
3. Lighthouse runs on the preview (not installed here).
4. 768 px / 1366 px screenshot sweep and keyboard/focus pass on the new header.
