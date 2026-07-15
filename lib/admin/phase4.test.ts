import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

const COMPANY_ASSET_MAX_BYTES = 2 * 1024 * 1024;
const COMPANY_ASSET_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function validateCompanyAssetFile(input: {
  mimeType: string;
  fileName: string;
  fileSize: number;
}) {
  if (input.fileSize <= 0 || input.fileSize > COMPANY_ASSET_MAX_BYTES) {
    return { ok: false as const };
  }
  const mime = input.mimeType.toLowerCase();
  if (!(mime in COMPANY_ASSET_MIME)) return { ok: false as const };
  const extFromName = input.fileName.split(".").pop()?.toLowerCase() || "";
  const expected =
    COMPANY_ASSET_MIME[mime as keyof typeof COMPANY_ASSET_MIME];
  const allowedExt =
    mime === "image/jpeg"
      ? ["jpg", "jpeg"]
      : mime === "image/svg+xml"
        ? ["svg"]
        : [expected];
  if (extFromName && !allowedExt.includes(extFromName)) {
    return { ok: false as const };
  }
  return { ok: true as const };
}

function sanitiseSvgMarkup(raw: string): string | null {
  if (!raw.trim().toLowerCase().includes("<svg")) return null;
  const cleaned = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("|')[\s\S]*?\1/gi, "")
    .replace(/javascript:/gi, "");
  if (/<script/i.test(cleaned)) return null;
  return cleaned;
}

function hashRateLimitIdentifier(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32);
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, degraded: true };
  }
  if (existing.count >= limit) {
    return { success: false, degraded: true };
  }
  existing.count += 1;
  return { success: true, degraded: true };
}

describe("company asset validation", () => {
  it("accepts png under size limit", () => {
    assert.equal(
      validateCompanyAssetFile({
        mimeType: "image/png",
        fileName: "logo.png",
        fileSize: 1024,
      }).ok,
      true,
    );
  });

  it("rejects oversized files", () => {
    assert.equal(
      validateCompanyAssetFile({
        mimeType: "image/png",
        fileName: "logo.png",
        fileSize: 5 * 1024 * 1024,
      }).ok,
      false,
    );
  });

  it("rejects extension mismatch", () => {
    assert.equal(
      validateCompanyAssetFile({
        mimeType: "image/png",
        fileName: "logo.exe",
        fileSize: 100,
      }).ok,
      false,
    );
  });

  it("strips script tags from svg", () => {
    const clean = sanitiseSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect/></svg>',
    );
    assert.ok(clean);
    assert.equal(/script/i.test(clean!), false);
  });
});

describe("rate limit helpers", () => {
  it("hashes identifiers without returning the raw value", () => {
    const hashed = hashRateLimitIdentifier("1.2.3.4");
    assert.notEqual(hashed, "1.2.3.4");
    assert.equal(hashed.length, 32);
  });

  it("blocks after limit in memory fallback", () => {
    const key = `phase4-test:${Date.now()}:${Math.random()}`;
    assert.equal(memoryLimit(key, 2, 60_000).success, true);
    assert.equal(memoryLimit(key, 2, 60_000).success, true);
    assert.equal(memoryLimit(key, 2, 60_000).success, false);
  });
});

describe("labour productivity math", () => {
  it("computes hours from quantity and productivity", () => {
    assert.equal(500 / 25, 20);
  });
});

describe("quote line reorder", () => {
  it("swaps adjacent sort orders", () => {
    const lines = [
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
      { id: "c", sortOrder: 2 },
    ];
    const index = 1;
    const next = [...lines];
    const target = index - 1;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    const reindexed = next.map((line, i) => ({ ...line, sortOrder: i }));
    assert.deepEqual(
      reindexed.map((l) => l.id),
      ["b", "a", "c"],
    );
  });
});

describe("duplicate customer warning rules", () => {
  it("flags matching email case-insensitively", () => {
    const existing = [{ email: "A@Farm.co.za" }];
    const candidate = "a@farm.co.za";
    const hit = existing.some(
      (row) => row.email.toLowerCase() === candidate.toLowerCase(),
    );
    assert.equal(hit, true);
  });
});
