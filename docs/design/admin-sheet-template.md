# Admin sheet: the shared table template

Every admin list should look like the projects board: fixed row height, light grid lines, centred cells, and no more than two short lines per cell. The Enquiries list uses this template. The projects board keeps its own sheet (`ops-sheet`) and is not changed by it.

## Use it

```tsx
import { AdminSheet } from "@/components/admin/ui";

<AdminSheet caption="Suppliers">
  <colgroup>
    <col className="admin-sheet__check" />
    <col style={{ width: "30%" }} />
    <col />
    <col className="admin-sheet__actions" />
  </colgroup>
  <thead>
    <tr>
      <th className="admin-sheet__check"><input type="checkbox" aria-label="Select all" /></th>
      <th className="admin-sheet__lead">Name</th>
      <th>Phone / email</th>
      <th className="admin-sheet__actions"><span className="sr-only">Actions</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="admin-sheet__check"><input type="checkbox" aria-label="Select Acme" /></td>
      <td className="admin-sheet__lead">
        <span className="admin-sheet__main">Acme (Pty) Ltd</span>
        <span className="admin-sheet__sub">Pretoria</span>
      </td>
      <td>
        <a className="admin-sheet__phone" href="tel:+27820000000"><CountryFlag country="ZA" />+27 82 000 0000</a>
        <span className="admin-sheet__sub">info@example.com</span>
      </td>
      <td className="admin-sheet__actions">…</td>
    </tr>
  </tbody>
</AdminSheet>
```

An existing `<table>` can use the template by adding `className="admin-sheet"`. That is how the Enquiries table does it.

## Rules

- **Cells:** a main line (`admin-sheet__main`) and at most one muted line (`admin-sheet__sub`). Long text truncates with "…"; put the full text in `title`.
- **Name column:** left-aligned with `admin-sheet__lead`. Every other column is centred.
- **Checkbox column:** the select-all box goes in the header (`admin-sheet__check`). There is no separate "Select page" line.
- **Opening a record:** clicking the row opens it. The table has only a "…" menu (`admin-sheet__actions`), no View button.
- **Phones:** `displayPhone()` for the text and `<CountryFlag>` for the flag (South Africa is drawn as an SVG because Windows shows flag emoji as letters).
- **Empty values:** use `admin-sheet__empty` and a short word ("—" or "Not provided").
- **Column widths:** give them per table in its own CSS, not in the template.
- **Phones (screens below 900 px):** keep a card list for small screens; the template is for the desktop table.

## Toolbar above the table

Use the same one-row toolbar as Projects: the page's main action (blue), then Search, Person, Filter, Sort and "…".

- **Shared pieces:** the icons and the small popover come from `components/admin/ui/AdminToolbar.tsx`, and the styling uses the existing `ops-toolbar` classes.
- **Example:** `components/admin/rfqs/RfqHeaderToolbar.tsx`.
- **State:** keep filters and sort in the URL so links and refreshes keep the view.
- **Status buttons:** where a list has statuses, put the status buttons under the toolbar (as on Enquiries).
