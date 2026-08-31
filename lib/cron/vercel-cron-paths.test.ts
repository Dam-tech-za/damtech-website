import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const ROOT = process.cwd();
const KEEPALIVE_CANONICAL_PATH = "/api/cron/supabase-keepalive/";
const KEEPALIVE_REDIRECT_PATH = "/api/cron/supabase-keepalive";

type VercelCronConfig = {
  crons: Array<{ path: string; schedule: string }>;
};

function readTrailingSlashEnabled(): boolean {
  const nextConfig = readFileSync(join(ROOT, "next.config.ts"), "utf8");
  return /trailingSlash:\s*true/.test(nextConfig);
}

function readVercelCrons(): VercelCronConfig["crons"] {
  const vercelConfig = JSON.parse(
    readFileSync(join(ROOT, "vercel.json"), "utf8"),
  ) as VercelCronConfig;
  return vercelConfig.crons;
}

function canonicalCronPath(path: string, trailingSlash: boolean): string {
  if (!trailingSlash) {
    return path.endsWith("/") ? path.slice(0, -1) : path;
  }
  return path.endsWith("/") ? path : `${path}/`;
}

describe("vercel cron paths", () => {
  it("uses canonical paths for trailingSlash configuration", () => {
    const trailingSlash = readTrailingSlashEnabled();
    assert.equal(trailingSlash, true);

    for (const cron of readVercelCrons()) {
      assert.equal(
        cron.path,
        canonicalCronPath(cron.path, trailingSlash),
        `cron path must be canonical: ${cron.path}`,
      );
    }
  });

  it("registers three canonical keepalive cron paths", () => {
    const keepaliveCrons = readVercelCrons().filter((cron) =>
      cron.path.includes("supabase-keepalive"),
    );

    assert.equal(keepaliveCrons.length, 3);
    assert.deepEqual(
      keepaliveCrons.map((cron) => cron.path),
      [
        KEEPALIVE_CANONICAL_PATH,
        KEEPALIVE_CANONICAL_PATH,
        KEEPALIVE_CANONICAL_PATH,
      ],
    );
    assert.deepEqual(
      keepaliveCrons.map((cron) => cron.schedule),
      ["15 4 * * *", "15 12 * * *", "15 20 * * *"],
    );
  });

  it("does not configure keepalive crons on redirect-only paths", () => {
    for (const cron of readVercelCrons()) {
      if (!cron.path.includes("supabase-keepalive")) continue;

      assert.notEqual(
        cron.path,
        KEEPALIVE_REDIRECT_PATH,
        "keepalive cron must not target the non-canonical path that returns 308",
      );
      assert.equal(
        cron.path,
        KEEPALIVE_CANONICAL_PATH,
        "keepalive cron must target the route handler directly",
      );
    }
  });
});
