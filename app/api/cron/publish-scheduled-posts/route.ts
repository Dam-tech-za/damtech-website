import { NextResponse } from "next/server";
import postsData from "@/lib/posts-data.json";
import { handlePublishScheduledPosts } from "@/lib/cron/publish-scheduled-posts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Daily scheduled-post publisher. Protected by CRON_SECRET (Vercel sends Authorization).
 * Triggers a redeploy via VERCEL_DEPLOY_HOOK_URL when a blog post is dated today.
 */
export async function GET(request: Request) {
  const result = await handlePublishScheduledPosts(
    request,
    postsData as { slug: string; date: string }[],
  );

  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
