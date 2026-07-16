import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
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
      <header className="admin-page-header">
        <div className="admin-page-header__copy">
          <h1 className="admin-page-header__title">PDF branding</h1>
          <p className="admin-page-header__description">
            Logo, header, footer, colours and banking display.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Link href="/admin/settings/" className="btn btn--md btn--secondary">All settings</Link>
        </div>
      </header>

      <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>PDF settings</h2>
      </header>
      <SettingsFormClient
        action={updatePdfSettingsAction}
        successMessage="PDF settings saved."
      >
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Brand primary</span>
            <input
              className="form-input"
              name="brandPrimaryHex"
              defaultValue={settings?.brand_primary_hex ?? "#1B4D3E"}
            />
          </label>
          <label className="admin-field">
            <span>Brand accent</span>
            <input
              className="form-input"
              name="brandAccentHex"
              defaultValue={settings?.brand_accent_hex ?? "#C4A35A"}
            />
          </label>
          <label className="admin-field">
            <span>Header style</span>
            <input
              className="form-input"
              name="headerStyle"
              defaultValue={settings?.header_style ?? "classic"}
            />
          </label>
          <label className="admin-field">
            <span>Footer style</span>
            <input
              className="form-input"
              name="footerStyle"
              defaultValue={settings?.footer_style ?? "classic"}
            />
          </label>
          <label className="admin-field">
            <span>Terms location</span>
            <input
              className="form-input"
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
        <button className="btn btn--md btn--primary" type="submit">
          Save PDF settings
        </button>
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
      </div>
    </div>
  );
}
