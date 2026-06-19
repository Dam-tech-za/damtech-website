import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LeadRow = {
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  province: string | null;
  service_required: string;
  project_size: string | null;
  project_location: string | null;
  message: string;
  source_page: string;
};

let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
        process.env.SUPABASE_ANON_KEY?.trim()),
  );
}

/** Server-only Supabase client. Prefers service role key; falls back to anon key. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}

export async function insertLead(row: LeadRow) {
  const client = getSupabaseAdmin();

  if (!client) {
    console.error(
      "[leads] Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY with insert RLS).",
    );
    return {
      ok: false as const,
      error:
        "Lead storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
    };
  }

  const { error } = await client.from("leads").insert(row);

  if (error) {
    console.error("[leads] Supabase insert failed:", error.message);
    return {
      ok: false as const,
      error: `Supabase insert failed: ${error.message}`,
    };
  }

  return { ok: true as const };
}
