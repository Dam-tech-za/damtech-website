import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Cookie-based Supabase server client for App Router Server Components,
 * Server Actions and Route Handlers. Respects RLS as the signed-in user.
 */
export async function createClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase public env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only —
          // proxy.ts is responsible for refreshing the session cookies.
        }
      },
    },
  });
}

/** Re-exports for lead form compatibility (service-role insert helpers). */
export {
  getSupabaseAdmin,
  insertLead,
  isSupabaseConfigured,
  type LeadRow,
} from "./admin";
