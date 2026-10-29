import { displayPhone } from "@/lib/operations/phone-display";

export function PhoneCell({ name, phone }: { name: string | null; phone: string | null }) {
  const shown = displayPhone(phone);
  if (!name && !shown) return <span className="ops-table__meta">—</span>;
  return (
    <span className="ops-client">
      <span className="ops-client__name">{name || "—"}</span>
      {shown ? (
        <a className="ops-client__phone" href={shown.href}>
          {shown.flag ? (
            <span aria-hidden="true" className="ops-client__flag">
              {shown.flag}
            </span>
          ) : null}
          <span>{shown.text}</span>
        </a>
      ) : null}
    </span>
  );
}
