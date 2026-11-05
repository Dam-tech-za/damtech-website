import { authorizeCronRequest } from "./authorize-cron.ts";

/** Today's date in South Africa (YYYY-MM-DD). Mirrors `todayInSouthAfrica` in lib/posts.ts. */
export function southAfricaDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
  }).format(now);
}

/** Slugs of posts scheduled for exactly `today` (they become visible on a fresh build today). */
export function postsDueToday(
  posts: ReadonlyArray<{ slug: string; date: string }>,
  today: string,
): string[] {
  return posts
    .filter((post) => post.date.slice(0, 10) === today)
    .map((post) => post.slug);
}

export type PublishScheduledResult = {
  status: number;
  body: { ok: boolean; message: string; due?: string[] };
};

/**
 * Daily check: when a blog post is dated today, trigger a Vercel deploy hook so the
 * statically generated blog picks the post up. Posts dated in the future are filtered
 * out at build time (see lib/posts.ts), so nothing is published early.
 */
export async function handlePublishScheduledPosts(
  request: Request,
  posts: ReadonlyArray<{ slug: string; date: string }>,
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<PublishScheduledResult> {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return { status: 401, body: { ok: false, message: auth.reason } };
  }

  const due = postsDueToday(posts, southAfricaDate(now));
  if (due.length === 0) {
    return { status: 200, body: { ok: true, message: "No posts due today", due } };
  }

  const hook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  if (!hook) {
    return {
      status: 500,
      body: { ok: false, message: "VERCEL_DEPLOY_HOOK_URL is not set", due },
    };
  }

  const response = await fetchImpl(hook, { method: "POST" });
  if (!response.ok) {
    return {
      status: 502,
      body: { ok: false, message: `Deploy hook returned ${response.status}`, due },
    };
  }

  return { status: 200, body: { ok: true, message: "Deploy triggered", due } };
}
