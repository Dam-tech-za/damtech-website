import { requireAdmin } from "@/lib/auth/require-admin";
import { getQuoteSettings } from "@/lib/quotes/settings";
import { updateQuoteSettingsAction } from "@/app/admin/quotes/actions";
import { SettingsFormClient } from "@/components/admin/SettingsFormClient";

export default async function AdminQuoteSettingsPage() {
  await requireAdmin({ permission: "manageQuoteNumbering" });
  const settings = await getQuoteSettings();

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>Quote settings</h2>
        <p className="admin-empty__hint">
          Numbering prefix and validity defaults. Sequence allocation is always
          server-side.
        </p>
      </header>
      <SettingsFormClient
        action={updateQuoteSettingsAction}
        successMessage="Quote settings saved."
      >
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Number prefix</span>
            <input
              className="form-input"
              name="numberPrefix"
              defaultValue={settings?.number_prefix ?? "DT-Q"}
              required
            />
          </label>
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                name="yearlyReset"
                defaultChecked={settings?.yearly_reset ?? true}
              />{" "}
              Yearly sequence reset
            </span>
          </label>
          <label className="admin-field">
            <span>Default validity (days)</span>
            <input
              className="form-input"
              type="number"
              name="defaultValidityDays"
              defaultValue={settings?.default_validity_days ?? 30}
            />
          </label>
          <label className="admin-field">
            <span>Default VAT %</span>
            <input
              className="form-input"
              type="number"
              step="0.01"
              name="defaultVatRate"
              defaultValue={settings?.default_vat_rate ?? 15}
            />
          </label>
          <label className="admin-field">
            <span>Default deposit %</span>
            <input
              className="form-input"
              type="number"
              step="0.1"
              name="defaultDepositPercent"
              defaultValue={settings?.default_deposit_percent ?? 0}
            />
          </label>
          <label className="admin-field">
            <span>Minimum gross margin warning %</span>
            <input
              className="form-input"
              type="number"
              step="0.1"
              name="minimumGrossMarginPercent"
              defaultValue={settings?.minimum_gross_margin_percent ?? 15}
            />
          </label>
          <label className="admin-field">
            <span>Approval threshold (ZAR total, optional)</span>
            <input
              className="form-input"
              type="number"
              step="0.01"
              name="approvalThresholdTotal"
              defaultValue={settings?.approval_threshold_total ?? ""}
            />
          </label>
          <label className="admin-field">
            <span>Public token TTL (days)</span>
            <input
              className="form-input"
              type="number"
              name="publicTokenTtlDays"
              defaultValue={settings?.public_token_ttl_days ?? 60}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Default payment terms</span>
            <textarea
              className="form-input"
              name="defaultPaymentTerms"
              rows={3}
              defaultValue={settings?.default_payment_terms ?? ""}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Default terms</span>
            <textarea
              className="form-input"
              name="defaultTerms"
              rows={4}
              defaultValue={settings?.default_terms ?? ""}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Default exclusions</span>
            <textarea
              className="form-input"
              name="defaultExclusions"
              rows={3}
              defaultValue={settings?.default_exclusions ?? ""}
            />
          </label>
          <label className="admin-field admin-field--full">
            <span>Default assumptions</span>
            <textarea
              className="form-input"
              name="defaultAssumptions"
              rows={3}
              defaultValue={settings?.default_assumptions ?? ""}
            />
          </label>
        </div>
        <button className="btn btn--md btn--primary" type="submit">
          Save quote settings
        </button>
      </SettingsFormClient>
    </div>
  );
}
