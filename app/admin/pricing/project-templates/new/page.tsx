import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { ProjectTemplateEditor } from "@/components/admin/project-templates/ProjectTemplateEditor";
import { AdminPageHeader } from "@/components/admin/ui";

export default async function NewProjectTemplatePage() {
  const admin = await requireAdmin();
  if (!canPerform(admin.profile.role, "managePricing")) {
    redirect("/admin/unauthorised/");
  }
  const showCost = canPerform(admin.profile.role, "viewCostPrices");

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="New project template"
        description="Store reusable estimating and quotation content."
        secondaryAction={{
          href: "/admin/pricing/project-templates/",
          label: "Back to templates",
        }}
      />
      <ProjectTemplateEditor showCost={showCost} />
    </div>
  );
}
