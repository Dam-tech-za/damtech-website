import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { attemptDatabaseFallbackAfterPersistenceFailure } from "./after-persistence-failure.ts";
import {
  classifyPersistenceFailure,
  shouldAttemptDatabaseFallback,
} from "./classifier.ts";
import { escapeHtml, buildFallbackEmailSubject } from "./format.ts";
import {
  fallbackResendIdempotencyKey,
  keepaliveFailureResendIdempotencyKey,
  keepaliveRecoveryResendIdempotencyKey,
} from "./idempotency.ts";
import { logFallbackAttempt } from "./log.ts";
import { fallbackSuccessCustomerMessage } from "./messages.ts";
import {
  buildContactFallbackInput,
  buildSimpleQuoteFallbackInput,
} from "./payloads.ts";
import { deliverDatabaseFallback } from "./service.ts";
import { isValidSubmissionId } from "./submission-id.ts";
import {
  notifyKeepaliveFailure,
  resetKeepaliveAlertStateForTests,
} from "../cron/supabase-keepalive-alerts.ts";
import { resetResendClientForTests } from "../email/resend-idempotent.ts";

const ORIGINAL_ENV = { ...process.env };
const SUBMISSION_A = "11111111-1111-4111-8111-111111111111";
const SUBMISSION_B = "22222222-2222-4222-8222-222222222222";
const INCIDENT = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
  resetResendClientForTests();
  resetKeepaliveAlertStateForTests();
}

function mockSendRecorder() {
  const calls: Array<{ idempotencyKey: string; subject: string }> = [];
  const send = async (
    payload: { subject?: string },
    options: { idempotencyKey: string },
  ) => {
    calls.push({
      idempotencyKey: options.idempotencyKey,
      subject: String(payload.subject ?? ""),
    });
    return { data: { id: "email_1" }, error: null };
  };
  return { calls, send };
}

const sampleContactData = {
  name: "Test User",
  company: "",
  phone: "0821234567",
  email: "test@example.com",
  province: "Gauteng",
  serviceRequired: "HDPE dam lining" as const,
  projectSize: "",
  projectLocation: "Pretoria",
  message: "Need a liner quote",
  sourcePage: "/contact",
  website: "",
};

describe("fallback classifier", () => {
  it("allows fallback only for infrastructure failures", () => {
    assert.equal(shouldAttemptDatabaseFallback("DATABASE_UNAVAILABLE"), true);
    assert.equal(shouldAttemptDatabaseFallback("CONFIGURATION_ERROR"), true);
    assert.equal(shouldAttemptDatabaseFallback("DATABASE_CONSTRAINT"), false);
    assert.equal(shouldAttemptDatabaseFallback("UNKNOWN_ERROR"), false);
    assert.equal(shouldAttemptDatabaseFallback("VALIDATION_ERROR"), false);
  });

  it("classifies business and unknown errors safely", () => {
    assert.equal(classifyPersistenceFailure("DATABASE_CONSTRAINT"), "business");
    assert.equal(classifyPersistenceFailure("UNKNOWN_ERROR"), "unknown");
  });
});

describe("submission identity", () => {
  it("validates UUID submission IDs", () => {
    assert.equal(isValidSubmissionId(SUBMISSION_A), true);
    assert.equal(isValidSubmissionId("not-a-uuid"), false);
    assert.equal(isValidSubmissionId(""), false);
  });
});

describe("idempotency keys", () => {
  it("builds deterministic fallback keys without secrets", () => {
    const key = fallbackResendIdempotencyKey("contact", SUBMISSION_A);
    assert.equal(key, `database-fallback/contact/${SUBMISSION_A}`);
    assert.ok(key.length <= 256);
    assert.equal(key.includes("test@"), false);
  });

  it("uses distinct keepalive failure and recovery keys", () => {
    const env = "production";
    const ts = 1_700_000_000_000;
    const failure = keepaliveFailureResendIdempotencyKey(env, ts);
    const recovery = keepaliveRecoveryResendIdempotencyKey(env, ts);
    assert.notEqual(failure, recovery);
    assert.match(failure, /^keepalive-failure\//);
    assert.match(recovery, /^keepalive-recovery\//);
  });
});

describe("deliverDatabaseFallback", () => {
  afterEach(restoreEnv);

  it("accepts Resend delivery for infrastructure failures", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { calls, send } = mockSendRecorder();
    const input = buildContactFallbackInput({
      incidentId: INCIDENT,
      submissionId: SUBMISSION_A,
      data: sampleContactData,
      sourcePage: "/contact",
    });

    const result = await deliverDatabaseFallback(
      input,
      "DATABASE_UNAVAILABLE",
      { send },
    );

    assert.equal(result.ok, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0]!.subject, /^\[DATABASE FALLBACK\]/);
    assert.equal(
      calls[0]!.idempotencyKey,
      fallbackResendIdempotencyKey("contact", SUBMISSION_A),
    );
  });

  it("rejects fallback for business-rule database errors", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { calls, send } = mockSendRecorder();
    const input = buildContactFallbackInput({
      incidentId: INCIDENT,
      submissionId: SUBMISSION_A,
      data: sampleContactData,
      sourcePage: "/contact",
    });

    const result = await deliverDatabaseFallback(input, "DATABASE_CONSTRAINT", {
      send,
    });

    assert.equal(result.ok, false);
    assert.equal(calls.length, 0);
  });

  it("deduplicates duplicate clicks via the same Resend idempotency key", async () => {
    process.env.RESEND_API_KEY = "re_test";
    let sendCount = 0;
    const seen = new Set<string>();
    const send = async (
      _payload: { subject?: string },
      options: { idempotencyKey: string },
    ) => {
      if (seen.has(options.idempotencyKey)) {
        return {
          data: null,
          error: { name: "invalid_idempotent_request", message: "duplicate" },
        };
      }
      seen.add(options.idempotencyKey);
      sendCount += 1;
      return { data: { id: "email_1" }, error: null };
    };

    const input = buildContactFallbackInput({
      incidentId: INCIDENT,
      submissionId: SUBMISSION_A,
      data: sampleContactData,
      sourcePage: "/contact",
    });

    const first = await deliverDatabaseFallback(input, "DATABASE_UNAVAILABLE", {
      send,
    });
    const second = await deliverDatabaseFallback(input, "DATABASE_UNAVAILABLE", {
      send,
    });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.idempotentReplay, true);
    assert.equal(sendCount, 2);
  });

  it("sends separate emails for different submission IDs", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { calls, send } = mockSendRecorder();

    await deliverDatabaseFallback(
      buildContactFallbackInput({
        incidentId: INCIDENT,
        submissionId: SUBMISSION_A,
        data: sampleContactData,
        sourcePage: "/contact",
      }),
      "DATABASE_UNAVAILABLE",
      { send },
    );
    await deliverDatabaseFallback(
      buildContactFallbackInput({
        incidentId: INCIDENT,
        submissionId: SUBMISSION_B,
        data: sampleContactData,
        sourcePage: "/contact",
      }),
      "DATABASE_UNAVAILABLE",
      { send },
    );

    assert.equal(calls[0]!.idempotencyKey.includes(SUBMISSION_A), true);
    assert.equal(calls[2]!.idempotencyKey.includes(SUBMISSION_B), true);
  });

  it("escapes HTML in email subjects and bodies", () => {
    const input = buildSimpleQuoteFallbackInput({
      incidentId: INCIDENT,
      submissionId: SUBMISSION_A,
      data: {
        ...sampleContactData,
        name: "<script>alert(1)</script>",
        message: "A & B <test>",
        serviceRequired: "HDPE dam lining",
      },
      sourcePage: "/quote",
    });
    const subject = buildFallbackEmailSubject(input);
    assert.equal(subject.includes("<script>"), false);
    assert.equal(escapeHtml("<b>"), "&lt;b&gt;");
  });

  it("does not log customer PII", () => {
    const logs: string[] = [];
    const original = console.info;
    console.info = (...args: unknown[]) => {
      logs.push(JSON.stringify(args));
    };
    try {
      logFallbackAttempt({
        incidentId: INCIDENT,
        formType: "contact",
        submissionId: SUBMISSION_A,
        databaseErrorCategory: "DATABASE_UNAVAILABLE",
        resendAccepted: true,
        idempotentReplay: false,
      });
    } finally {
      console.info = original;
    }
    const joined = logs.join("");
    assert.equal(joined.includes("test@example.com"), false);
    assert.equal(joined.includes("Test User"), false);
    assert.equal(joined.includes("Need a liner"), false);
    assert.match(joined, /submissionSuffix/);
  });
});

describe("attemptDatabaseFallbackAfterPersistenceFailure", () => {
  afterEach(restoreEnv);

  it("returns fallback success without RFQ numbers", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { send } = mockSendRecorder();
    const result = await attemptDatabaseFallbackAfterPersistenceFailure(
      {
        incidentId: INCIDENT,
        databaseErrorCode: "DATABASE_UNAVAILABLE",
        fallbackInput: buildContactFallbackInput({
          incidentId: INCIDENT,
          submissionId: SUBMISSION_A,
          data: sampleContactData,
          sourcePage: "/contact",
        }),
      },
      { send },
    );

    assert.equal("ok" in result && result.ok, true);
    if ("ok" in result && result.ok) {
      assert.equal(result.incidentId, INCIDENT);
      assert.equal("rfqNumber" in result, false);
    }
  });

  it("returns total failure message when Resend rejects", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await attemptDatabaseFallbackAfterPersistenceFailure({
      incidentId: INCIDENT,
      databaseErrorCode: "DATABASE_UNAVAILABLE",
      fallbackInput: buildContactFallbackInput({
        incidentId: INCIDENT,
        submissionId: SUBMISSION_A,
        data: sampleContactData,
        sourcePage: "/contact",
      }),
    });

    assert.equal("ok" in result && result.ok, false);
    if (!("ok" in result) || result.ok) throw new Error("expected failure");
    assert.match(result.customerMessage, /\+27 82 853 1026/);
    assert.match(result.customerMessage, /info@dam-tech.co.za/);
  });
});

describe("customer messaging", () => {
  it("uses backup-channel copy without RFQ numbers", () => {
    const message = fallbackSuccessCustomerMessage(INCIDENT);
    assert.match(message, /backup channel/i);
    assert.match(message, /formal reference will follow/i);
    assert.equal(message.includes("RFQ-"), false);
  });
});

describe("keepalive alert deduplication without Upstash", () => {
  afterEach(restoreEnv);

  it("reuses the same failure idempotency key within a cooldown window", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.RESEND_API_KEY = "re_test";
    process.env.VERCEL_ENV = "production";

    const keys: string[] = [];
    const send = async (
      _payload: { subject?: string },
      options: { idempotencyKey: string },
    ) => {
      keys.push(options.idempotencyKey);
      if (keys.filter((k) => k === options.idempotencyKey).length > 1) {
        return {
          data: null,
          error: { name: "invalid_idempotent_request", message: "duplicate" },
        };
      }
      return { data: { id: "email_1" }, error: null };
    };

    await notifyKeepaliveFailure(
      {
        incidentId: INCIDENT,
        timestampIso: "2026-08-31T04:15:00.000Z",
      },
      { send },
    );
    await notifyKeepaliveFailure(
      {
        incidentId: "bbbbbbbb-bbbb-4ccc-8ddd-ffffffffffff",
        timestampIso: "2026-08-31T04:20:00.000Z",
      },
      { send },
    );

    assert.equal(keys[0], keys[1]);
  });
});
