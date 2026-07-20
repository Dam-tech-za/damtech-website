import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { getCompanySettings } from "@/lib/quotes/settings";
import { updateCompanySettingsAction } from "@/app/admin/quotes/actions";
import { SettingsFormClient } from "@/components/admin/SettingsFormClient";
import { BrandAssetUploader } from "@/components/admin/settings/BrandAssetUploader";
import { createCompanyAssetSignedReadUrl } from "@/lib/storage/company-assets";

export default async function AdminCompanySettingsPage() {
  const admin = await requireAdmin({ permission: "manageSettings" });
  const settings = await getCompanySettings();
  const canBank =
    admin.profile.role === "owner" || admin.profile.role === "admin";

  const logoPath = settings?.logo_storage_path ?? null;
  const signaturePath =
    (settings as { signature_storage_path?: string | null } | null)
      ?.signature_storage_path ?? null;

  const [logoPreview, signaturePreview] = await Promise.all([
    logoPath
      ? createCompanyAssetSignedReadUrl(logoPath).then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
    signaturePath
      ? createCompanyAssetSignedReadUrl(signaturePath).then(
          (r) => r.data?.signedUrl ?? null,
        )
      : Promise.resolve(null),
  ]);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Company details"
        description="Legal name, trading details, addresses, banking and branding."
        secondaryAction={{ href: "/admin/settings/", label: "All settings" }}
      />

      <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>Company settings</h2>
        <p className="admin-empty__hint">
          Snapshotted into quotes at approval/send so historical PDFs stay stable.
        </p>
      </header>
      <SettingsFormClient
        action={updateCompanySettingsAction}
        successMessage="Company settings saved."
      >
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Legal business name</span>
            <input
              className="form-input"
              name="legalBusinessName"
              required
              defaultValue={settings?.legal_business_name ?? "Damtech"}
            />
          </label>
          <label className="admin-field">
            <span>Trading name</span>
            <input
              className="form-input"
              name="tradingName"
              defaultValue={settings?.trading_name ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>Registration number</span>
            <input
              className="form-input"
              name="registrationNumber"
              defaultValue={settings?.registration_number ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>VAT number</span>
            <input
              className="form-input"
              name="vatNumber"
              defaultValue={settings?.vat_number ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>Address line 1</span>
            <input
              className="form-input"
              name="addressLine1"
              defaultValue={settings?.address_line1 ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>Address line 2</span>
            <input
              className="form-input"
              name="addressLine2"
              defaultValue={settings?.address_line2 ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>City</span>
            <input className="form-input" name="city" defaultValue={settings?.city ?? ""} />
          </label>
          <label className="admin-field">
            <span>Province</span>
            <input
              className="form-input"
              name="province"
              defaultValue={settings?.province ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>Postal code</span>
            <input
              className="form-input"
              name="postalCode"
              defaultValue={settings?.postal_code ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>Phone</span>
            <input className="form-input" name="phone" defaultValue={settings?.phone ?? ""} />
          </label>
          <label className="admin-field">
            <span>Email</span>
            <input className="form-input" name="email" defaultValue={settings?.email ?? ""} />
          </label>
          <label className="admin-field">
            <span>Website</span>
            <input
              className="form-input"
              name="website"
              defaultValue={settings?.website ?? ""}
            />
          </label>
          {canBank ? (
            <>
              <label className="admin-field">
                <span>Bank name</span>
                <input
                  className="form-input"
                  name="bankName"
                  defaultValue={settings?.bank_name ?? ""}
                />
              </label>
              <label className="admin-field">
                <span>Account name</span>
                <input
                  className="form-input"
                  name="bankAccountName"
                  defaultValue={settings?.bank_account_name ?? ""}
                />
              </label>
              <label className="admin-field">
                <span>Account number</span>
                <input
                  className="form-input"
                  name="bankAccountNumber"
                  defaultValue={settings?.bank_account_number ?? ""}
                />
              </label>
              <label className="admin-field">
                <span>Branch code</span>
                <input
                  className="form-input"
                  name="bankBranchCode"
                  defaultValue={settings?.bank_branch_code ?? ""}
                />
              </label>
              <label className="admin-field">
                <span>SWIFT</span>
                <input
                  className="form-input"
                  name="bankSwift"
                  defaultValue={settings?.bank_swift ?? ""}
                />
              </label>
            </>
          ) : (
            <p className="admin-empty__hint">Banking details restricted to owner/admin.</p>
          )}
          <label className="admin-field admin-field--full">
            <span>Quote footer</span>
            <textarea
              className="form-input"
              name="quoteFooter"
              rows={3}
              defaultValue={settings?.quote_footer ?? ""}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Terms and conditions</span>
            <textarea
              className="form-input"
              name="termsAndConditions"
              rows={6}
              defaultValue={settings?.terms_and_conditions ?? ""}
            />
          </label>
        </div>
        <button className="btn btn--md btn--primary" type="submit">
          Save company settings
        </button>
      </SettingsFormClient>

      {canBank ? (
        <>
          <BrandAssetUploader
            kind="company_logo"
            label="Company logo"
            currentPath={logoPath}
            previewUrl={logoPreview}
            recommended="400×120 px landscape"
          />
          <BrandAssetUploader
            kind="signature"
            label="Signature image"
            currentPath={signaturePath}
            previewUrl={signaturePreview}
            recommended="400×120 px"
          />
        </>
      ) : null}
      </div>
    </div>
  );
}
