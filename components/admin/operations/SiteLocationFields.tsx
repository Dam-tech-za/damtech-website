"use client";

import { useMemo, useState } from "react";
import { AdminField, AdminSelect } from "@/components/admin/ui";
import { SA_PROVINCES, townsInProvince } from "@/lib/operations/sa-places";

export function SiteLocationFields({ province, town }: { province: string | null; town: string | null }) {
  const [prov, setProv] = useState(province ?? "");
  const towns = useMemo(() => {
    const list = townsInProvince(prov).map((t) => t.name);
    if (town && prov === (province ?? "") && !list.includes(town)) return [town, ...list];
    return list;
  }, [prov, province, town]);

  return (
    <>
      <AdminField label="Province" htmlFor="site_province">
        <AdminSelect
          id="site_province"
          name="site_province"
          value={prov}
          onChange={(event) => setProv(event.target.value)}
        >
          <option value="">Not set</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Town" htmlFor="site_town">
        <AdminSelect
          key={prov}
          id="site_town"
          name="site_town"
          defaultValue={prov === (province ?? "") ? (town ?? "") : ""}
          disabled={!prov}
        >
          <option value="">{prov ? "Choose a town" : "Choose a province first"}</option>
          {towns.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
    </>
  );
}
