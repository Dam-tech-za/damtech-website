import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { getQuotePdfSettings } from "@/lib/quotes/settings";
import { updatePdfSettingsAction } from "@/app/admin/quotes/actions";
import { SettingsFormClient } from "@/components/admin/SettingsFormClient";
import { BrandAssetUploader } from "@/components/admin/settings/BrandAssetUploader";
import { createCompanyAssetSignedReadUrl } from "@/lib/storage/company-assets";

export default async function AdminPdfSettingsPage() {
  const admin = await requireAdmin({ permission: "manageSettings" });
  const settings = await getQuotePdfSettings();
  const canUpload =
    admin.profile.role === "owner" || admin.profile.role === "admin";

  const logoPath = settings?.logo_storage_path ?? null;
  const headerPath =
    (settings as { header_image_storage_path?: string | null } | null)
      ?.header_image_storage_path ?? null;

  const [logoPreview, headerPreview] = await Promise.all([
    logoPath
      ? createCompanyAssetSignedReadUrl(logoPath).then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
    headerPath
      ? createCompanyAssetSignedReadUrl(headerPath).then(
          (r) => r.data?.signedUrl ?? null,
        )
      : Promise.resolve(null),
  ]);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="PDF branding"
        description="Logo, header, footer, colours and banking display."
        secondaryAction={{ href: "/admin/settings/", label: "All settings" }}
      />

      <AdminPanel title="PDF settings">
      <SettingsFormClient
        action={updatePdfSettingsAction}
        successMessage="PDF settings saved."
      >
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Brand primary</span>
            <AdminInput
              name="brandPrimaryHex"
              defaultValue={settings?.brand_primary_hex ?? "#1B4D3E"}
            />
          </label>
          <label className="admin-field">
            <span>Brand accent</span>
            <AdminInput
              name="brandAccentHex"
              defaultValue={settings?.brand_accent_hex ?? "#C4A35A"}
            />
          </label>
          <label className="admin-field">
            <span>Header style</span>
            <AdminInput
              name="headerStyle"
              defaultValue={settings?.header_style ?? "classic"}
            />
          </label>
          <label className="admin-field">
            <span>Footer style</span>
            <AdminInput
              name="footerStyle"
              defaultValue={settings?.footer_style ?? "classic"}
            />
          </label>
          <label className="admin-field">
            <span>Terms location</span>
            <AdminInput
              name="termsLocation"
              defaultValue={settings?.terms_location ?? "end"}
            />
          </label>
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                name="showSignatureBlock"
                defaultChecked={settings?.show_signature_block ?? true}
              />{" "}
              Signature block
            </span>
          </label>
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                name="showPageNumbers"
                defaultChecked={settings?.show_page_numbers ?? true}
              />{" "}
              Page numbers
            </span>
          </label>
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                name="showBankingDetails"
                defaultChecked={settings?.show_banking_details ?? true}
              />{" "}
              Show banking details on PDF
            </span>
          </label>
        </div>
        <AdminButton type="submit" variant="primary">
          Save PDF settings
        </AdminButton>
      </SettingsFormClient>

      {canUpload ? (
        <>
          <BrandAssetUploader
            kind="pdf_logo"
            label="PDF logo"
            currentPath={logoPath}
            previewUrl={logoPreview}
            recommended="400×120 px for quote header"
          />
          <BrandAssetUploader
            kind="header_image"
            label="Quotation header image"
            currentPath={headerPath}
            previewUrl={headerPreview}
            recommended="1200×240 px optional banner"
          />
        </>
      ) : null}
      </AdminPanel>
    </div>
  );
}
