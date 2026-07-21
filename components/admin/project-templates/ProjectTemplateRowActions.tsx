"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminButton } from "@/components/admin/ui";
import {
  duplicateProjectTemplateAction,
  setProjectTemplateActiveAction,
} from "@/app/admin/pricing/project-templates/actions";

type Props = {
  id: string;
  isActive: boolean;
};

export function ProjectTemplateRowActions({ id, isActive }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateProjectTemplateAction(id);
      if (result.ok) router.push(`/admin/pricing/project-templates/${result.id}/edit/`);
    });
  }
  function toggleActive() {
    startTransition(async () => {
      await setProjectTemplateActiveAction(id, !isActive);
      router.refresh();
    });
  }

  return (
    <div className="admin-table-actions">
      <AdminButton
        href={`/admin/pricing/project-templates/${id}/`}
        size="sm"
        variant="secondary"
        className="admin-btn--table"
      >
        Preview
      </AdminButton>
      <AdminButton
        href={`/admin/pricing/project-templates/${id}/edit/`}
        size="sm"
        variant="secondary"
        className="admin-btn--table"
      >
        Edit
      </AdminButton>
      <AdminButton
        type="button"
        size="sm"
        variant="ghost"
        onClick={duplicate}
        disabled={pending}
      >
        Duplicate
      </AdminButton>
      <AdminButton
        type="button"
        size="sm"
        variant="ghost"
        onClick={toggleActive}
        disabled={pending}
      >
        {isActive ? "Archive" : "Restore"}
      </AdminButton>
    </div>
  );
}
