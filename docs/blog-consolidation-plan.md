# Blog consolidation plan (manual review)

Do not mass-delete posts. Use this plan to consolidate overlapping leak-repair and dam-lining topics over time.

## Priority canonical post

- **`/blog/dam-lining-cost-south-africa/`** — strengthen as the primary commercial cost guide; add internal links to `/dam-liners/`, `/hdpe-dam-lining/`, `/quote/`, and `/projects/`.

## Overlapping topics to review

| Cluster | Suggested action |
|---------|------------------|
| Farm dam leak repair (multiple titles) | Keep one strongest post; 301 weaker duplicates to the canonical URL after content merge |
| Borehole + farm dam integration | Merge overlapping advice into one guide; redirect secondary post |
| Steel reservoir maintenance vs leak repair | Cross-link; consider merging if >60% duplicate H2s |
| HDPE vs PVC comparison posts | Link to `/dam-liners/` and `/hdpe-dam-lining/`; avoid new duplicate posts |

## Editorial fixes (safe to batch)

- South African / UK spelling: optimise → optimise, labor → labour, center → centre where visible in post bodies
- Ensure each post links to at least one service page and one project where relevant
- Keep `BLOG_AUTHOR` attribution visible; do not invent authors or publication dates

## Redirects

Add 301 redirects in `lib/redirects.ts` only after content is merged and the canonical post is live.

## Manual input required

- Confirm which leak-repair post should be canonical per cluster
- Confirm author name if changing from “Damtech Team” to a named author
- Review AI-style bulk titles for human editing before redirecting duplicates
