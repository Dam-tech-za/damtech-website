import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Next.js 16 Proxy — session refresh + lightweight admin gate.
 * Full authorisation still runs in Server Components via requireAdmin() and RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-damtech-pathname", pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  // Public site + assets when Supabase is not configured yet.
  if (!url || !anonKey) {
    if (isProtectedAdminPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login/";
      loginUrl.searchParams.set("error", "auth_not_configured");
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session — important for Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedAdminPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login/";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === "/admin/login" || pathname === "/admin/login/")
  ) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return supabaseResponse;
}

function isProtectedAdminPath(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  if (pathname === "/admin/login" || pathname === "/admin/login/") return false;
  if (
    pathname === "/admin/unauthorised" ||
    pathname === "/admin/unauthorised/"
  ) {
    return false;
  }
  return true;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     * Admin auth refresh runs site-wide so cookies stay fresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
