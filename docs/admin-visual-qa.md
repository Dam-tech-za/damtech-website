# Admin visual QA matrix

Automated screenshots: `npm run test:visual` (requires `PLAYWRIGHT_ADMIN_EMAIL` + `PLAYWRIGHT_ADMIN_PASSWORD`, or `PLAYWRIGHT_ALLOW_UNAUTH=1` for unauthenticated smoke captures).

Output directory: `test-results/admin-visual/`

## Breakpoint matrix

| Route | 360 | 390 | 768 | 1024 | 1280 | 1366 | 1440 | 1600 | 1920 | 125% | 150% | 200% | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | Run with credentials |
| `/admin/rfqs` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/rfqs/[id]` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | Requires seeded RFQ id |
| `/admin/quotes` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/quotes/new` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/quotes/[id]` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | Requires seeded quote id |
| `/admin/customers` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/pricing/materials` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/pricing/suppliers` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/settings/company` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |
| `/admin/audit` | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | Not run | |

## Sidebar states

Each route above should also be captured with:

- expanded sidebar (default)
- collapsed sidebar (`localStorage` key `damtech-admin-sidebar-collapsed`)

## Manual zoom checklist

Playwright uses CSS `zoom` on `/admin` at 1280×800 as an approximation. Manually verify in Chrome/Edge:

- [ ] 125% — no clipped dialogs, readable table actions
- [ ] 150% — sidebar expand control visible when collapsed
- [ ] 200% — no horizontal page overflow on list pages

## Accessibility checks

- [ ] Shared form controls expose labels and focus rings
- [ ] Dialogs trap focus and restore on close
- [ ] Dropdown menus keyboard navigable
- [ ] Tables use semantic `thead`/`tbody`
- [ ] Status badges include text (not colour-only)

## Regression workflows

- [ ] Login
- [ ] Sidebar navigation + collapse persistence
- [ ] RFQ list filters + advanced drawer
- [ ] RFQ detail + delete dialog
- [ ] RFQ conversion
- [ ] Quote create / edit / save
- [ ] Quote approval / PDF / send
- [ ] Customer create / edit
- [ ] Pricing / supplier CRUD
- [ ] Settings save
- [ ] Audit log browse
