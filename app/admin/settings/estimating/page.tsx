import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { updateEstimatingSettingAction } from "@/app/admin/pricing/actions";
import {
  grossMarginPercentFromPrices,
  markupPercentFromPrices,
  sellingPriceFromGrossMargin,
  sellingPriceFromMarkup,
} from "@/lib/estimating/margin";
import { formatZar } from "@/lib/estimating/money";

function readSetting(
  rows: Array<{ setting_key: string; setting_value: unknown }> | null,
  key: string,
): string {
  const row = rows?.find((item) => item.setting_key === key);
  if (!row) return "";
  return typeof row.setting_value === "string"
    ? row.setting_value
    : JSON.stringify(row.setting_value);
}

export default async function AdminEstimatingSettingsPage() {
  await requireAdmin({ permission: "manageEstimatingSettings" });
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("estimating_settings")
    .select("*")
    .order("setting_key");

  const markup = Number(readSetting(settings, "default_markup_percent") || 25);
  const margin = Number(readSetting(settings, "default_gross_margin_percent") || 20);
  const sampleCost = 10000;
  const sellMarkup = sellingPriceFromMarkup(sampleCost, markup);
  const sellMargin = sellingPriceFromGrossMargin(sampleCost, margin);

  const keys = [
    ["default_markup_percent", "Default markup %"],
    ["default_gross_margin_percent", "Default gross margin %"],
    ["vat_rate_percent", "VAT rate %"],
    ["liner_waste_percent", "Liner waste %"],
    ["welding_overlap_percent", "Welding overlap %"],
    ["labour_burden_percent", "Labour burden %"],
    ["contingency_percent", "Contingency %"],
    ["minimum_charge", "Minimum charge (ZAR ex VAT)"],
    ["quote_validity_days", "Quote validity days"],
  ] as const;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Estimating inputs"
        description="VAT, markup versus margin, allowances, labour burden and travel."
        secondaryAction={{ href: "/admin/settings/", label: "All settings" }}
      />

      <AdminPanel
        title="Estimating settings"
        description={`Markup and margin are different. On a R${sampleCost.toLocaleString("en-ZA")} cost: ${markup}% markup → ${formatZar(sellMarkup)} (${markupPercentFromPrices(sampleCost, sellMarkup)}% markup / ${grossMarginPercentFromPrices(sampleCost, sellMarkup)}% margin). ${margin}% margin target → ${formatZar(sellMargin)}.`}
      >
        {error ? (
          <div className="admin-empty">
            <p>Unable to load settings.</p>
            <p className="admin-empty__hint">{error.message}</p>
          </div>
        ) : (
          <div className="admin-stack">
            {keys.map(([key, label]) => (
              <form
                key={key}
                action={updateEstimatingSettingAction}
                className="admin-inline-form"
              >
                <input type="hidden" name="setting_key" value={key} />
                <label>
                  {label}
                  <AdminInput
                    name="setting_value"
                    defaultValue={readSetting(settings, key)}
                  />
                </label>
                <AdminButton type="submit" variant="primary">
                  Save
                </AdminButton>
              </form>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
