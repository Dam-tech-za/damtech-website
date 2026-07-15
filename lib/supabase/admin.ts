import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "./env";

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

export { isSupabaseConfigured, isSupabaseServiceConfigured };

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS — use only in trusted server code (auth provisioning, lead insert, audit).
 * Never import this module from Client Components.
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !key) {
    throw new Error(
      "Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Preferred service-role client; falls back to anon for legacy lead inserts only. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey() || getSupabaseAnonKey();

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
