import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  handlePublishScheduledPosts,
  postsDueToday,
  southAfricaDate,
} from "./publish-scheduled-posts.ts";

const posts = [
  { slug: "a", date: "2026-11-05" },
  { slug: "b", date: "2026-11-12" },
];

function request(secret = "s3cret") {
  return new Request("https://example.com/api/cron/publish-scheduled-posts/", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("publish scheduled posts", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "s3cret";
    process.env.VERCEL_DEPLOY_HOOK_URL = "https://hook.example/deploy";
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.VERCEL_DEPLOY_HOOK_URL;
  });

  it("uses the South African calendar date", () => {
    assert.equal(southAfricaDate(new Date("2026-11-11T22:30:00Z")), "2026-11-12");
  });

  it("finds posts due today", () => {
    assert.deepEqual(postsDueToday(posts, "2026-11-12"), ["b"]);
    assert.deepEqual(postsDueToday(posts, "2026-11-13"), []);
  });

  it("rejects a bad secret", async () => {
    const result = await handlePublishScheduledPosts(request("nope"), posts);
    assert.equal(result.status, 401);
  });

  it("does nothing when no post is due", async () => {
    let called = false;
    const result = await handlePublishScheduledPosts(
      request(),
      posts,
      (async () => {
        called = true;
        return new Response("ok");
      }) as typeof fetch,
      new Date("2026-11-08T05:00:00Z"),
    );
    assert.equal(result.status, 200);
    assert.equal(called, false);
  });

  it("triggers the deploy hook when a post is due", async () => {
    let url = "";
    const result = await handlePublishScheduledPosts(
      request(),
      posts,
      (async (input: string) => {
        url = input;
        return new Response("ok");
      }) as unknown as typeof fetch,
      new Date("2026-11-12T04:00:00Z"),
    );
    assert.equal(result.status, 200);
    assert.equal(url, "https://hook.example/deploy");
  });
});
