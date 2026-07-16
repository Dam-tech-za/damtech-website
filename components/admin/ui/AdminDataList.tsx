import type { ReactNode } from "react";

type AdminDataListItem = {
  label: string;
  value: ReactNode;
};

type AdminDataListProps = {
  items: AdminDataListItem[];
};

export function AdminDataList({ items }: AdminDataListProps) {
  return (
    <dl className="admin-dl">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
