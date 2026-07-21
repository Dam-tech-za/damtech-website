import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { getProjectTemplate } from "@/lib/project-templates/queries";
import { ProjectTemplateEditor } from "@/components/admin/project-templates/ProjectTemplateEditor";
import { AdminPageHeader } from "@/components/admin/ui";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectTemplatePage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!canPerform(admin.profile.role, "managePricing")) {
    redirect("/admin/unauthorised/");
  }
  const { id } = await params;
  const template = await getProjectTemplate(id);
  if (!template) notFound();

  const showCost = canPerform(admin.profile.role, "viewCostPrices");

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title={`Edit ${template.name}`}
        description={template.code}
        secondaryAction={{
          href: `/admin/pricing/project-templates/${id}/`,
          label: "Preview",
        }}
      />
      <ProjectTemplateEditor template={template} showCost={showCost} />
    </div>
  );
}
