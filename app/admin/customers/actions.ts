"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";

type CustomerRecord = {
  id: string;
  customer_type: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  registration_number: string | null;
  billing_address: Record<string, unknown> | null;
  site_address: Record<string, unknown> | null;
  province: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function selectCustomerFields() {
  return "id, customer_type, name, company_name, email, phone, vat_number, registration_number, billing_address, site_address, province, notes, created_at, updated_at";
}

function normaliseText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalisePhone(value: string | null | undefined) {
  return value?.replace(/[^0-9+]/g, "").trim() ?? "";
}

function toCustomerRecord(row: Record<string, unknown>): CustomerRecord {
  return {
    id: String(row.id ?? ""),
    customer_type: String(row.customer_type ?? "individual"),
    name: String(row.name ?? ""),
    company_name: (row.company_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    vat_number: (row.vat_number as string | null) ?? null,
    registration_number: (row.registration_number as string | null) ?? null,
    billing_address: (row.billing_address as Record<string, unknown> | null) ?? null,
    site_address: (row.site_address as Record<string, unknown> | null) ?? null,
    province: (row.province as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function buildAddressPayload(formData: FormData, prefix: "billing" | "site") {
  const line1 = String(formData.get(`${prefix}AddressLine1`) ?? "").trim();
  const line2 = String(formData.get(`${prefix}AddressLine2`) ?? "").trim();
  const city = String(formData.get(`${prefix}City`) ?? "").trim();
  const province = String(formData.get(`${prefix}Province`) ?? "").trim();
  const postalCode = String(formData.get(`${prefix}PostalCode`) ?? "").trim();
  const country = String(formData.get(`${prefix}Country`) ?? "").trim();

  if (!line1 && !line2 && !city && !province && !postalCode && !country) {
    return null;
  }

  return {
    line1: line1 || null,
    line2: line2 || null,
    city: city || null,
    province: province || null,
    postal_code: postalCode || null,
    country: country || null,
  };
}

function customerMatchesCompanyProvince(
  customer: CustomerRecord,
  companyName: string,
  province: string,
) {
  return (
    normaliseText(customer.company_name) === normaliseText(companyName) &&
    normaliseText(customer.province) === normaliseText(province)
  );
}

function duplicateReason(customer: CustomerRecord, payload: CustomerRecord) {
  const reasons: string[] = [];
  if (payload.email && normaliseText(customer.email) === normaliseText(payload.email)) {
    reasons.push("email");
  }
  if (payload.phone && normalisePhone(customer.phone) === normalisePhone(payload.phone)) {
    reasons.push("phone");
  }
  if (payload.vat_number && normaliseText(customer.vat_number) === normaliseText(payload.vat_number)) {
    reasons.push("vat number");
  }
  if (
    payload.company_name &&
    payload.province &&
    customerMatchesCompanyProvince(customer, payload.company_name, payload.province)
  ) {
    reasons.push("company + province");
  }
  return reasons;
}

async function getPotentialDuplicateCustomers(supabase: Awaited<ReturnType<typeof createClient>>, payload: CustomerRecord) {
  const [emailMatch, phoneMatch, vatMatch, companyMatch] = await Promise.all([
    payload.email
      ? supabase
          .from("customers")
          .select(selectCustomerFields())
          .ilike("email", payload.email)
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    payload.phone
      ? supabase
          .from("customers")
          .select(selectCustomerFields())
          .or(
            `phone.eq.${payload.phone},phone.ilike.%${payload.phone}%,phone.ilike.%${normalisePhone(payload.phone)}%`,
          )
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    payload.vat_number
      ? supabase
          .from("customers")
          .select(selectCustomerFields())
          .ilike("vat_number", payload.vat_number)
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    payload.company_name
      ? supabase
          .from("customers")
          .select(selectCustomerFields())
          .ilike("company_name", payload.company_name)
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const errors = [emailMatch.error, phoneMatch.error, vatMatch.error, companyMatch.error].filter(
    Boolean,
  );
  if (errors.length > 0) {
    return { error: (errors[0] as { message?: string }).message ?? "Unable to check duplicates." };
  }

  const rows = new Map<string, CustomerRecord>();
  const duplicateRows = [
    ...(((emailMatch.data ?? []) as unknown) as Array<Record<string, unknown>>),
    ...(((phoneMatch.data ?? []) as unknown) as Array<Record<string, unknown>>),
    ...(((vatMatch.data ?? []) as unknown) as Array<Record<string, unknown>>),
    ...(((companyMatch.data ?? []) as unknown) as Array<Record<string, unknown>>),
  ];

  for (const row of duplicateRows) {
    const customer = toCustomerRecord(row);
    if (customer.id) rows.set(customer.id, customer);
  }

  const duplicates = [...rows.values()]
    .map((customer) => ({
      ...customer,
      reasons: duplicateReason(customer, payload),
    }))
    .filter((customer) => customer.reasons.length > 0)
    .map(({ reasons, ...customer }) => ({
      id: customer.id,
      name: customer.name,
      company_name: customer.company_name,
      email: customer.email,
      phone: customer.phone,
      vat_number: customer.vat_number,
      province: customer.province,
      reasons,
    }));

  return { duplicates };
}

export async function upsertCustomerAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "manageCustomers" });
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "") || null;
  const payload = {
    customer_type: String(formData.get("customer_type") ?? "individual"),
    name: String(formData.get("name") ?? "").trim(),
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    registration_number: String(formData.get("registration_number") ?? "").trim() || null,
    billing_address: buildAddressPayload(formData, "billing"),
    site_address: buildAddressPayload(formData, "site"),
    province: String(formData.get("province") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    vat_number: String(formData.get("vat_number") ?? "").trim() || null,
  };

  if (!payload.name) return;

  if (id) {
    const { error } = await supabase.from("customers").update(payload).eq("id", id);
    if (error) {
      console.error("[customers] update failed:", error.message);
      return;
    }
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "customer_updated",
      entityType: "customer",
      entityId: id,
      afterData: payload,
    });
  } else {
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...payload, created_by: admin.user.id })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[customers] create failed:", error?.message);
      return;
    }
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "customer_created",
      entityType: "customer",
      entityId: data.id,
      afterData: payload,
    });
  }

  revalidatePath("/admin/customers/");
}

export async function searchCustomersAction(q: string) {
  await assertAdmin({ permission: "manageQuotes" });
  const supabase = await createClient();
  const term = q.trim();
  const query = supabase.from("customers").select(selectCustomerFields()).limit(20);

  const result = term
    ? await query.or(
        `name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,vat_number.ilike.%${term}%,province.ilike.%${term}%`,
      )
    : await query.order("updated_at", { ascending: false });

  if (result.error) {
    return { ok: false as const, error: result.error.message, customers: [] as CustomerRecord[] };
  }

  return {
    ok: true as const,
    customers: (((result.data ?? []) as unknown) as Array<Record<string, unknown>>).map((row) =>
      toCustomerRecord(row),
    ),
  };
}

export async function createCustomerInlineAction(formData: FormData) {
  const admin = await assertAdmin({ permission: "manageCustomers" });
  const supabase = await createClient();
  const payload: CustomerRecord = {
    id: "",
    customer_type: String(formData.get("customer_type") ?? "individual"),
    name: String(formData.get("name") ?? "").trim(),
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    vat_number: String(formData.get("vat_number") ?? "").trim() || null,
    registration_number: String(formData.get("registration_number") ?? "").trim() || null,
    billing_address: buildAddressPayload(formData, "billing"),
    site_address: buildAddressPayload(formData, "site"),
    province: String(formData.get("province") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const allowConfirmDuplicate = formData.get("allowConfirmDuplicate") === "true";

  if (!payload.name) {
    return { ok: false as const, error: "Customer name is required." };
  }

  const duplicateCheck = await getPotentialDuplicateCustomers(supabase, payload);
  if ("error" in duplicateCheck) {
    return { ok: false as const, error: duplicateCheck.error };
  }

  if (duplicateCheck.duplicates.length > 0 && !allowConfirmDuplicate) {
    return {
      ok: false as const,
      error: "Possible duplicate customer found.",
      duplicates: duplicateCheck.duplicates,
    };
  }

  const insertPayload = {
    customer_type: payload.customer_type,
    name: payload.name,
    company_name: payload.company_name,
    email: payload.email,
    phone: payload.phone,
    vat_number: payload.vat_number,
    registration_number: payload.registration_number,
    billing_address: payload.billing_address,
    site_address: payload.site_address,
    province: payload.province,
    notes: payload.notes,
    created_by: admin.user.id,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(insertPayload)
    .select(selectCustomerFields())
    .single();

  if (error || !data) {
    return {
      ok: false as const,
      error: error?.message ?? "Unable to create customer.",
      duplicates: duplicateCheck.duplicates,
    };
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "customer_created_inline",
    entityType: "customer",
    entityId: String(((data as unknown) as Record<string, unknown>).id ?? ""),
    afterData: insertPayload,
  });

  revalidatePath("/admin/customers/");

  return {
    ok: true as const,
    customer: toCustomerRecord(((data as unknown) as Record<string, unknown>)),
    duplicates: duplicateCheck.duplicates,
  };
}
