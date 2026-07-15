/**
 * Resolve Supabase connection env vars.
 * Prefer NEXT_PUBLIC_* for browser-safe values; fall back to legacy server-only names
 * used by the public lead form so existing Vercel env keeps working.
 */

export function getSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    undefined
  );
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

export function isSupabasePublicConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

/** True when any server Supabase client can be created (service role or anon). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    getSupabaseUrl() && (getSupabaseServiceRoleKey() || getSupabaseAnonKey()),
  );
}
