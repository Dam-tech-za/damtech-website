import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { createQuoteAction } from "../actions";
import { getQuoteSettings } from "@/lib/quotes/settings";
import {
  addDaysToIsoDate,
  todayIsoDateJohannesburg,
} from "@/lib/quotes/totals";
import { canViewCostMargin } from "@/lib/quotes/workflow";
import { canPerform } from "@/lib/auth/permissions";

export default async function AdminNewQuotePage() {
  const admin = await requireAdmin({ permission: "manageQuotes" });
  const supabase = await createClient();
  const settings = await getQuoteSettings();
  const issueDate = todayIsoDateJohannesburg();
  const validity = settings?.default_validity_days ?? 30;

  const { data: customers } = await supabase
    .from("customers")
    .select(
      "id, customer_type, name, company_name, email, phone, vat_number, registration_number, billing_address, site_address, province, notes, created_at, updated_at",
    )
    .order("company_name")
    .limit(500);

  return (
    <div>
      <QuoteBuilder
        mode="create"
        action={createQuoteAction}
        customers={customers ?? []}
        canCreateCustomer={canPerform(admin.profile.role, "manageCustomers")}
        showCost={canViewCostMargin(admin.profile.role)}
        defaults={{
          title: "",
          customerId: "",
          rfqId: "",
          projectReference: "",
          projectLocation: "",
          serviceRequired: "",
          scopeSummary: "",
          projectDescription: "",
          assumptions: settings?.default_assumptions ?? "",
          exclusions: settings?.default_exclusions ?? "",
          paymentTerms: settings?.default_payment_terms ?? "",
          programmeNotes: "",
          warrantyWording: "",
          customerMessage: "",
          internalNotes: "",
          issueDate,
          validUntil: addDaysToIsoDate(issueDate, validity),
          discountAmount: 0,
          vatRate: Number(settings?.default_vat_rate ?? 15),
          depositPercent: Number(settings?.default_deposit_percent ?? 0),
          contactName: "",
          companyName: "",
          email: "",
          phone: "",
          province: "",
          lines: [],
          estimatorConfirmedSuggestions: false,
        }}
      />
    </div>
  );
}
