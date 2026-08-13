import { createClient } from "@/lib/supabase/server";
import { isOrderStatus, type OrderStatus } from "./types.ts";

export type CatalogueOrderListRow = {
  id: string;
  order_reference: string;
  status: OrderStatus;
  sku: string;
  product_name_snapshot: string;
  quantity: number;
  total_price_snapshot: number;
  customer_name: string;
  email: string;
  created_at: string;
  confirmation_email_status: string;
  internal_email_status: string;
};

export type CatalogueOrderDetail = CatalogueOrderListRow & {
  customer_type: string;
  business_name: string | null;
  phone: string;
  vat_number: string | null;
  customer_po_number: string | null;
  billing_line1: string;
  billing_line2: string | null;
  billing_suburb: string;
  billing_city: string;
  billing_province: string;
  billing_postal_code: string;
  fulfilment_method: string;
  notes: string | null;
  unit_price_snapshot: number;
  vat_rate_snapshot: number;
  vat_amount_snapshot: number;
  currency: string;
  terms_accepted_at: string;
  privacy_accepted_at: string;
  exclusions_accepted_at: string;
  updated_at: string;
};

export async function listCatalogueOrders(filters: {
  q?: string;
  status?: string;
  page?: string;
}): Promise<{ rows: CatalogueOrderListRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = 25;
  const page = Math.max(1, Number(filters.page) || 1);
  const supabase = await createClient();
  let query = supabase
    .from("catalogue_orders")
    .select(
      "id, order_reference, status, sku, product_name_snapshot, quantity, total_price_snapshot, customer_name, email, created_at, confirmation_email_status, internal_email_status",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.status && isOrderStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%_,()]/g, "").slice(0, 80);
    if (q) {
      query = query.or(
        `order_reference.ilike.%${q}%,customer_name.ilike.%${q}%,email.ilike.%${q}%,sku.ilike.%${q}%`,
      );
    }
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[orders] list failed:", error.message);
    return { rows: [], total: 0, page, pageSize };
  }
  return {
    rows: (data ?? []) as CatalogueOrderListRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getCatalogueOrder(
  id: string,
): Promise<CatalogueOrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogue_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as CatalogueOrderDetail;
}
