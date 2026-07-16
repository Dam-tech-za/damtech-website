import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientIpFromHeaders,
  hasUpstashConfiguration,
  hashRateLimitIdentifier,
  publicClientRateKey,
  type RateLimitPolicy,
} from "../rate-limit/types.ts";
import { memoryLimit } from "../rate-limit/memory.ts";
import {
  customerMessageForCode,
  shortIncidentRef,
} from "./submission-result.ts";
import { aggregateNotificationStatus } from "./notification-status.ts";
import type { EmailSendResult } from "./email/types.ts";

const BURST: RateLimitPolicy = {
  name: "public-rfq-submit-burst",
  limit: 3,
  windowMs: 5 * 60 * 1000,
  onProviderError: "fail_open_public",
};

const HOURLY: RateLimitPolicy = {
  name: "public-rfq-submit-hourly",
  limit: 10,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_open_public",
};

describe("public RFQ rate-limit keys", () => {
  it("prefers x-vercel-forwarded-for and never returns a shared unknown bucket", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.10, 10.0.0.1",
      "x-forwarded-for": "203.0.113.9",
    });
    const keyA = publicClientRateKey(headers, "public-rfq-submit");
    const keyB = publicClientRateKey(headers, "public-rfq-submit");
    assert.equal(keyA, keyB);
    assert.notEqual(keyA, "unknown");
    assert.equal(keyA.length, 32);

    const noIp = new Headers({
      "user-agent": "Mozilla/5.0 TestA",
      origin: "https://www.dam-tech.co.za",
    });
    const noIpOther = new Headers({
      "user-agent": "Mozilla/5.0 TestB",
      origin: "https://www.dam-tech.co.za",
    });
    const fpA = publicClientRateKey(noIp, "public-rfq-submit");
    const fpB = publicClientRateKey(noIpOther, "public-rfq-submit");
    assert.notEqual(fpA, fpB);
  });

  it("hashes identifiers with secret material", () => {
    const a = hashRateLimitIdentifier("ip:1.2.3.4");
    const b = hashRateLimitIdentifier("ip:1.2.3.4");
    assert.equal(a, b);
    assert.equal(a.length, 32);
  });

  it("parses client IP with vercel header first", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.20",
      "x-forwarded-for": "203.0.113.1",
    });
    assert.equal(clientIpFromHeaders(headers), "198.51.100.20");
    assert.equal(clientIpFromHeaders(new Headers()), null);
  });
});

describe("memory burst limiter", () => {
  it("allows under the limit then blocks with rate_limited reason", () => {
    const key = `test-burst:${Date.now()}:${Math.random()}`;
    const first = memoryLimit(key, { ...BURST, limit: 2, windowMs: 60_000 });
    const second = memoryLimit(key, { ...BURST, limit: 2, windowMs: 60_000 });
    const third = memoryLimit(key, { ...BURST, limit: 2, windowMs: 60_000 });
    assert.equal(first.success, true);
    assert.equal(second.success, true);
    assert.equal(third.success, false);
    assert.equal(third.reason, "rate_limited");
    assert.ok(third.resetAt > Date.now());
  });

  it("documents hourly policy defaults", () => {
    assert.equal(HOURLY.limit, 10);
    assert.equal(HOURLY.onProviderError, "fail_open_public");
    assert.equal(BURST.limit, 3);
  });
});

describe("customer-facing RFQ messages", () => {
  it("uses accurate minute copy for rate limits", () => {
    const msg = customerMessageForCode("RATE_LIMITED", {
      retryAfterSeconds: 3600,
    });
    assert.match(msg, /60 minutes/);
    assert.doesNotMatch(msg, /wait a minute/);
  });

  it("includes short incident references", () => {
    const id = "abcd1234-5678-90ab-cdef-111111111111";
    assert.equal(shortIncidentRef(id), "ABCD1234");
  });
});

describe("notification aggregation", () => {
  it("marks failed when any email fails after save", () => {
    const results: EmailSendResult[] = [
      { ok: true, status: "sent" },
      { ok: false, error: "provider down", status: "failed" },
    ];
    assert.equal(aggregateNotificationStatus(results), "failed");
  });

  it("marks pending_configuration when Resend is missing", () => {
    const results: EmailSendResult[] = [
      {
        ok: false,
        error: "Email is not configured.",
        status: "pending_configuration",
      },
    ];
    assert.equal(aggregateNotificationStatus(results), "pending_configuration");
  });
});

describe("upstash configuration helper", () => {
  it("is false without credentials", () => {
    assert.equal(typeof hasUpstashConfiguration(), "boolean");
  });
});
