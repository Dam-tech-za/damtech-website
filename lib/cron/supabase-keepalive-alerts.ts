import { Redis } from "@upstash/redis";
import type { CreateEmailOptions } from "resend";
import { sendIdempotentResendEmail } from "../email/resend-idempotent.ts";
import { memoryLimit } from "../rate-limit/memory.ts";
import { hasUpstashConfiguration } from "../rate-limit/types.ts";
import { getRfqEmailConfig } from "../rfq/email/config.ts";
import {
  keepaliveCooldownWindowId,
  keepaliveFailureResendIdempotencyKey,
  keepaliveRecoveryResendIdempotencyKey,
} from "../fallback/idempotency.ts";

const FAILURE_ALERT_POLICY = {
  name: "supabase-keepalive-failure-alert",
  limit: 1,
  windowMs: 6 * 60 * 60 * 1000,
  onProviderError: "fail_open_dev_only" as const,
};

const OUTAGE_REDIS_KEY = "damtech:supabase-keepalive:outage";
const OUTAGE_STARTED_REDIS_KEY = "damtech:supabase-keepalive:outage-started-at";

let memoryOutageRecorded = false;
let memoryOutageStartedAtMs: number | null = null;
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!hasUpstashConfiguration()) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

export function resetKeepaliveAlertStateForTests(): void {
  memoryOutageRecorded = false;
  memoryOutageStartedAtMs = null;
}

function deploymentEnvironment(): string {
  return (
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV?.trim() ||
    "unknown"
  );
}

function shortIncidentRef(incidentId: string): string {
  return incidentId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function isKeepaliveOutageRecorded(): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get(OUTAGE_REDIS_KEY);
    return value === "1" || value === 1;
  }
  return memoryOutageRecorded;
}

async function getOutageStartedAtMs(): Promise<number | null> {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get(OUTAGE_STARTED_REDIS_KEY);
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
  return memoryOutageStartedAtMs;
}

async function recordKeepaliveOutage(timestampMs: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(OUTAGE_REDIS_KEY, "1");
    const existing = await redis.get(OUTAGE_STARTED_REDIS_KEY);
    if (!existing) {
      await redis.set(OUTAGE_STARTED_REDIS_KEY, String(timestampMs));
    }
    return;
  }
  memoryOutageRecorded = true;
  if (memoryOutageStartedAtMs == null) {
    memoryOutageStartedAtMs = timestampMs;
  }
}

async function clearKeepaliveOutage(): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(OUTAGE_REDIS_KEY);
    await redis.del(OUTAGE_STARTED_REDIS_KEY);
    return;
  }
  memoryOutageRecorded = false;
  memoryOutageStartedAtMs = null;
}

/** Optional Upstash cooldown — Resend idempotency is the primary cross-instance guard. */
export async function shouldSendFailureAlert(): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const windowId = keepaliveCooldownWindowId();
    const result = await redis.set(
      `damtech:supabase-keepalive:failure-alert:${windowId}`,
      "1",
      {
        nx: true,
        ex: Math.ceil(FAILURE_ALERT_POLICY.windowMs / 1000),
      },
    );
    return result === "OK";
  }

  const decision = memoryLimit(
    `supabase-keepalive-failure-alert-${keepaliveCooldownWindowId()}`,
    FAILURE_ALERT_POLICY,
  );
  return decision.success;
}

type KeepaliveSendDeps = {
  send?: (
    payload: CreateEmailOptions,
    options: { idempotencyKey: string },
  ) => Promise<{ data: unknown; error: { name?: string; message?: string } | null }>;
};

async function sendOperationalEmail(
  input: {
    subject: string;
    body: string;
    idempotencyKey: string;
  },
  deps?: KeepaliveSendDeps,
): Promise<{ ok: true; idempotentReplay: boolean } | { ok: false }> {
  const config = getRfqEmailConfig();
  if (!config.configured || !config.apiKey) {
    console.error("supabase_keepalive_alert_skipped", {
      reason: "resend_not_configured",
    });
    return { ok: false };
  }

  const result = await sendIdempotentResendEmail(
    {
      from: `Damtech Operations <${config.fromEmail}>`,
      to: [config.internalNotificationEmail],
      subject: input.subject,
      text: input.body,
    },
    input.idempotencyKey,
    deps,
  );

  if (!result.ok) {
    console.error("supabase_keepalive_alert_failed", {
      reason: "resend_send_failed",
    });
    return { ok: false };
  }

  return { ok: true, idempotentReplay: result.idempotentReplay };
}

export async function notifyKeepaliveFailure(
  input: {
    incidentId: string;
    timestampIso: string;
  },
  deps?: KeepaliveSendDeps,
): Promise<{ alertSent: boolean; outageRecorded: boolean }> {
  const env = deploymentEnvironment();
  const timestampMs = Date.parse(input.timestampIso) || Date.now();
  await recordKeepaliveOutage(timestampMs);

  const ref = shortIncidentRef(input.incidentId);
  const windowId = keepaliveCooldownWindowId(timestampMs);
  const idempotencyKey = keepaliveFailureResendIdempotencyKey(env, timestampMs);

  const result = await sendOperationalEmail(
    {
      subject: `Damtech alert: Supabase keepalive failed (${ref})`,
      body: [
        "Damtech Supabase keepalive check failed.",
        "",
        "Supabase may be unavailable. RFQ persistence and the admin panel require checking.",
        "",
        `Timestamp (UTC): ${input.timestampIso}`,
        `Environment: ${env}`,
        `Cooldown window: ${windowId}`,
        `Incident ID: ${ref}`,
        "",
        "If the Supabase project is paused, resume it in the Supabase dashboard before expecting RFQs to save.",
      ].join("\n"),
      idempotencyKey,
    },
    deps,
  );

  const upstashAllowed = await shouldSendFailureAlert();
  const alertSent = result.ok && (upstashAllowed || result.idempotentReplay);

  return { alertSent, outageRecorded: true };
}

export async function notifyKeepaliveRecovery(
  input: {
    timestampIso: string;
  },
  deps?: KeepaliveSendDeps,
): Promise<{ recoverySent: boolean }> {
  const wasOutage = await isKeepaliveOutageRecorded();
  if (!wasOutage) {
    return { recoverySent: false };
  }

  const env = deploymentEnvironment();
  const outageStartedAt =
    (await getOutageStartedAtMs()) ?? keepaliveCooldownWindowId() * FAILURE_ALERT_POLICY.windowMs;

  const result = await sendOperationalEmail(
    {
      subject: "Damtech alert: Supabase keepalive recovered",
      body: [
        "Damtech Supabase keepalive check succeeded after a previous failure.",
        "",
        "Database connectivity appears restored. Continue monitoring RFQ submissions.",
        "",
        `Timestamp (UTC): ${input.timestampIso}`,
        `Environment: ${env}`,
      ].join("\n"),
      idempotencyKey: keepaliveRecoveryResendIdempotencyKey(env, outageStartedAt),
    },
    deps,
  );

  await clearKeepaliveOutage();
  return { recoverySent: result.ok };
}

export function usesUpstashForKeepaliveAlerts(): boolean {
  return hasUpstashConfiguration();
}
