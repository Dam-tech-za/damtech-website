import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

describe("admin auth source guards", () => {
  it("does not hardcode an approved email allowlist address", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/20260715120000_admin_auth_phase1.sql"),
      "utf8",
    );
    assert.match(migration, /REPLACE_WITH_APPROVED_GOOGLE_EMAIL/);
    assert.doesNotMatch(migration, /@dam-tech\.co\.za/i);
  });

  it("keeps service role module server-oriented", () => {
    const adminClient = readFileSync(
      join(process.cwd(), "lib/supabase/admin.ts"),
      "utf8",
    );
    assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(adminClient, /NEXT_PUBLIC_SUPABASE_SERVICE/);
  });

  it("admin layout sets noindex robots metadata", () => {
    const layout = readFileSync(
      join(process.cwd(), "app/admin/layout.tsx"),
      "utf8",
    );
    assert.match(layout, /index:\s*false/);
    assert.match(layout, /follow:\s*false/);
    assert.match(layout, /nocache:\s*true/);
  });

  it("robots disallow includes /admin/", () => {
    const site = readFileSync(join(process.cwd(), "lib/site.ts"), "utf8");
    assert.match(site, /"\/admin\/"/);
  });
});
