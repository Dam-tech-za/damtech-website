import { NextResponse } from "next/server";
import { provisionAdminFromAllowlist } from "@/lib/auth/provision-admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/admin") ? nextParam : "/admin/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/login/?error=${encodeURIComponent("missing_code")}`,
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchange failed:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/admin/login/?error=${encodeURIComponent("auth_exchange_failed")}`,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/admin/unauthorised/?reason=no_email`,
    );
  }

  const provision = await provisionAdminFromAllowlist({
    userId: user.id,
    email: user.email,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : typeof user.user_metadata?.picture === "string"
          ? user.user_metadata.picture
          : null,
  });

  if (!provision.ok) {
    await supabase.auth.signOut();
    const reason =
      provision.reason === "inactive" ? "inactive" : "not_allowlisted";
    return NextResponse.redirect(
      `${origin}/admin/unauthorised/?reason=${reason}`,
    );
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/admin/"}`);
}
