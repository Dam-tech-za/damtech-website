import { createClient } from "@/lib/supabase/server";

export type CompanySettings = {
  id: number;
  legal_business_name: string;
  trading_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch_code: string | null;
  bank_swift: string | null;
  logo_storage_path: string | null;
  quote_footer: string | null;
  terms_and_conditions: string | null;
};

export type QuoteSettings = {
  id: number;
  number_prefix: string;
  yearly_reset: boolean;
  default_validity_days: number;
  default_vat_rate: number;
  default_payment_terms: string | null;
  default_deposit_percent: number;
  default_terms: string | null;
  default_exclusions: string | null;
  default_assumptions: string | null;
  minimum_gross_margin_percent: number;
  approval_threshold_total: number | null;
  public_token_ttl_days: number;
};

export type QuotePdfSettings = {
  id: number;
  logo_storage_path: string | null;
  brand_primary_hex: string;
  brand_accent_hex: string;
  header_style: string;
  footer_style: string;
  show_signature_block: boolean;
  show_page_numbers: boolean;
  terms_location: string;
  show_banking_details: boolean;
};

export async function getCompanySettings(): Promise<CompanySettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data as CompanySettings | null;
}

export async function getQuoteSettings(): Promise<QuoteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data as QuoteSettings | null;
}

export async function getQuotePdfSettings(): Promise<QuotePdfSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_pdf_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data as QuotePdfSettings | null;
}

export function buildCompanySnapshot(company: CompanySettings) {
  return {
    legalBusinessName: company.legal_business_name,
    tradingName: company.trading_name,
    registrationNumber: company.registration_number,
    vatNumber: company.vat_number,
    address: [
      company.address_line1,
      company.address_line2,
      company.city,
      company.province,
      company.postal_code,
      company.country,
    ]
      .filter(Boolean)
      .join("\n"),
    phone: company.phone,
    email: company.email,
    website: company.website,
    banking: {
      bankName: company.bank_name,
      accountName: company.bank_account_name,
      accountNumber: company.bank_account_number,
      branchCode: company.bank_branch_code,
      swift: company.bank_swift,
    },
    quoteFooter: company.quote_footer,
    termsAndConditions: company.terms_and_conditions,
  };
}
