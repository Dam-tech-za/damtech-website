import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { authorizeCronRequest } from "./authorize-cron.ts";
import {
  isKeepaliveOutageRecorded,
  notifyKeepaliveFailure,
  notifyKeepaliveRecovery,
  resetKeepaliveAlertStateForTests,
  shouldSendFailureAlert,
} from "./supabase-keepalive-alerts.ts";
import {
  DEFAULT_KEEPALIVE_TIMEOUT_MS,
  handleSupabaseKeepalive,
  pingSupabaseDatabase,
} from "./supabase-keepalive.ts";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
}

function requestWithAuth(secret: string): Request {
  return new Request("https://www.dam-tech.co.za/api/cron/supabase-keepalive/", {
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("authorizeCronRequest", () => {
  afterEach(restoreEnv);

  it("accepts a valid bearer secret", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const result = authorizeCronRequest(requestWithAuth("test-cron-secret-value"));
    assert.equal(result.ok, true);
  });

  it("rejects a missing secret in the environment", () => {
    delete process.env.CRON_SECRET;
    const result = authorizeCronRequest(requestWithAuth("anything"));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "missing_secret");
  });

  it("rejects a missing authorization header", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const result = authorizeCronRequest(
      new Request("https://www.dam-tech.co.za/api/cron/supabase-keepalive/"),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_secret");
  });

  it("rejects an invalid bearer token", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const result = authorizeCronRequest(requestWithAuth("wrong-secret"));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_secret");
  });
});

describe("pingSupabaseDatabase", () => {
  afterEach(restoreEnv);

  it("returns configuration_missing when service role env is absent", async () => {
    const result = await pingSupabaseDatabase({
      isConfigured: () => false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.category, "configuration_missing");
  });

  it("returns success for a valid ping payload without exposing details", async () => {
    const result = await pingSupabaseDatabase({
      isConfigured: () => true,
      createClient: () => ({
        rpc: async () => ({
          data: {
            ok: true,
            rfqTable: true,
            checkedAt: "2026-08-31T00:00:00.000Z",
          },
          error: null,
        }),
      }),
    });

    assert.equal(result.ok, true);
    assert.ok(result.latencyMs >= 0);
  });

  it("returns database_unavailable when the RPC errors", async () => {
    const result = await pingSupabaseDatabase({
      isConfigured: () => true,
      createClient: () => ({
        rpc: async () => ({
          data: null,
          error: { message: "connection terminated due to administrator command" },
        }),
      }),
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.category, "database_unavailable");
  });

  it("returns timeout when the RPC exceeds the deadline", async () => {
    const result = await pingSupabaseDatabase({
      isConfigured: () => true,
      timeoutMs: 20,
      createClient: () => ({
        rpc: async () => ({ data: { ok: true }, error: null }),
      }),
      rpc: async () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                data: { ok: true },
                error: null,
              }),
            80,
          );
        }),
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.category, "timeout");
    assert.ok(result.latencyMs >= 20);
    assert.ok(result.latencyMs < DEFAULT_KEEPALIVE_TIMEOUT_MS);
  });

  it("calls only the read-only rfq_infrastructure_ping RPC", async () => {
    let rpcName: string | null = null;
    await pingSupabaseDatabase({
      isConfigured: () => true,
      createClient: () => ({
        rpc: async (fn) => {
          rpcName = fn;
          return { data: { ok: true }, error: null };
        },
      }),
    });

    assert.equal(rpcName, "rfq_infrastructure_ping");
  });
});

describe("handleSupabaseKeepalive", () => {
  afterEach(() => {
    restoreEnv();
    resetKeepaliveAlertStateForTests();
  });

  it("returns 401 when cron authentication fails", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const result = await handleSupabaseKeepalive(requestWithAuth("wrong-secret"));
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { ok: false, error: "Unauthorised" });
  });

  it("returns 200 after a successful database ping", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const result = await handleSupabaseKeepalive(requestWithAuth("expected-secret"), {
      ping: async () => ({ ok: true, latencyMs: 12 }),
      onFailure: async () => ({ alertSent: false, outageRecorded: false }),
      onRecovery: async () => ({ recoverySent: false }),
    });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true });
  });

  it("returns 503 without sensitive provider details when the database is unavailable", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const result = await handleSupabaseKeepalive(requestWithAuth("expected-secret"), {
      ping: async () => ({
        ok: false,
        latencyMs: 40,
        category: "database_unavailable",
      }),
      onFailure: async () => ({ alertSent: true, outageRecorded: true }),
      onRecovery: async () => ({ recoverySent: false }),
    });

    assert.equal(result.status, 503);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.error, "Backend unavailable");
      assert.match(result.body.incidentId ?? "", /^[0-9a-f-]{36}$/i);
      assert.equal(
        JSON.stringify(result.body).includes("connection terminated"),
        false,
      );
      assert.equal(JSON.stringify(result.body).includes("supabase"), false);
    }
  });

  it("invokes failure alerting on ping failure", async () => {
    process.env.CRON_SECRET = "expected-secret";
    let failureCalled = false;
    await handleSupabaseKeepalive(requestWithAuth("expected-secret"), {
      ping: async () => ({
        ok: false,
        latencyMs: 5,
        category: "timeout",
      }),
      onFailure: async () => {
        failureCalled = true;
        return { alertSent: true, outageRecorded: true };
      },
      onRecovery: async () => ({ recoverySent: false }),
    });
    assert.equal(failureCalled, true);
  });

  it("invokes recovery alerting after a successful ping", async () => {
    process.env.CRON_SECRET = "expected-secret";
    let recoveryCalled = false;
    await handleSupabaseKeepalive(requestWithAuth("expected-secret"), {
      ping: async () => ({ ok: true, latencyMs: 3 }),
      onFailure: async () => ({ alertSent: false, outageRecorded: false }),
      onRecovery: async () => {
        recoveryCalled = true;
        return { recoverySent: true };
      },
    });
    assert.equal(recoveryCalled, true);
  });
});

describe("keepalive alert cooldown and recovery", () => {
  afterEach(() => {
    restoreEnv();
    resetKeepaliveAlertStateForTests();
  });

  it("allows only one failure alert per cooldown window in memory mode", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const first = await shouldSendFailureAlert();
    const second = await shouldSendFailureAlert();
    assert.equal(first, true);
    assert.equal(second, false);
  });

  it("records outage on failure and clears it after recovery", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    await notifyKeepaliveFailure({
      incidentId: "11111111-2222-4333-8444-555555555555",
      timestampIso: "2026-08-31T04:15:00.000Z",
    });

    assert.equal(await isKeepaliveOutageRecorded(), true);

    await notifyKeepaliveRecovery({
      timestampIso: "2026-08-31T12:15:00.000Z",
    });

    assert.equal(await isKeepaliveOutageRecorded(), false);
  });

  it("attempts a failure alert when Resend is configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.RESEND_API_KEY = "re_test_key";

    const result = await notifyKeepaliveFailure({
      incidentId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      timestampIso: "2026-08-31T04:15:00.000Z",
    });

    assert.equal(result.outageRecorded, true);
    assert.equal(typeof result.alertSent, "boolean");
  });
});
