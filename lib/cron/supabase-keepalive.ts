import { randomUUID } from "node:crypto";
import { authorizeCronRequest } from "./authorize-cron.ts";
import {
  notifyKeepaliveFailure,
  notifyKeepaliveRecovery,
} from "./supabase-keepalive-alerts.ts";
import { isSupabaseServiceConfigured } from "../supabase/env.ts";

export const DEFAULT_KEEPALIVE_TIMEOUT_MS = 15_000;

export type KeepaliveErrorCategory =
  | "configuration_missing"
  | "database_unavailable"
  | "timeout"
  | "invalid_response"
  | "unknown";

export type KeepalivePingResult =
  | { ok: true; latencyMs: number }
  | { ok: false; latencyMs: number; category: KeepaliveErrorCategory };

export type KeepaliveResponseBody =
  | { ok: true }
  | { ok: false; error: string; incidentId?: string };

export type KeepaliveHandlerResult = {
  status: 200 | 401 | 503;
  body: KeepaliveResponseBody;
};

export type KeepaliveRpcClient = {
  rpc: (
    fn: "rfq_infrastructure_ping",
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

export type PingSupabaseDatabaseInput = {
  timeoutMs?: number;
  isConfigured?: () => boolean;
  createClient?: () => KeepaliveRpcClient;
  rpc?: (
    client: KeepaliveRpcClient,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

function categorizeProviderError(error: unknown): KeepaliveErrorCategory {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("timeout") || message.includes("timed out")) {
      return "timeout";
    }
    if (
      message.includes("not configured") ||
      message.includes("missing") ||
      message.includes("invalid api key")
    ) {
      return "configuration_missing";
    }
    if (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("econnrefused") ||
      message.includes("terminated")
    ) {
      return "database_unavailable";
    }
  }
  return "unknown";
}

function categorizeRpcError(error: { message?: string } | null): KeepaliveErrorCategory {
  if (!error?.message) return "database_unavailable";
  return categorizeProviderError(new Error(error.message));
}

function isValidPingPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const payload = data as { ok?: unknown };
  return payload.ok === true;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("keepalive_timeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function resolveKeepaliveClient(
  input?: PingSupabaseDatabaseInput,
): Promise<KeepaliveRpcClient | Awaited<ReturnType<typeof import("../supabase/admin.ts").createServiceRoleClient>>> {
  if (input?.createClient) {
    return input.createClient();
  }

  const { createServiceRoleClient } = await import("../supabase/admin.ts");
  return createServiceRoleClient();
}

async function runInfrastructurePing(
  client: KeepaliveRpcClient | Awaited<ReturnType<typeof import("../supabase/admin.ts").createServiceRoleClient>>,
  input?: PingSupabaseDatabaseInput,
): Promise<{ data: unknown; error: { message?: string } | null }> {
  if (input?.rpc) {
    return input.rpc(client as KeepaliveRpcClient);
  }

  const { data, error } = await client.rpc("rfq_infrastructure_ping");
  return { data, error };
}

export async function pingSupabaseDatabase(
  input?: PingSupabaseDatabaseInput,
): Promise<KeepalivePingResult> {
  const started = Date.now();
  const timeoutMs = input?.timeoutMs ?? DEFAULT_KEEPALIVE_TIMEOUT_MS;
  const isConfigured = input?.isConfigured ?? isSupabaseServiceConfigured;

  if (!isConfigured()) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      category: "configuration_missing",
    };
  }

  try {
    const client = await resolveKeepaliveClient(input);
    const { data, error } = await withTimeout(
      runInfrastructurePing(client, input),
      timeoutMs,
    );

    if (error) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        category: categorizeRpcError(error),
      };
    }

    if (!isValidPingPayload(data)) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        category: "invalid_response",
      };
    }

    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      category: categorizeProviderError(error),
    };
  }
}

function logKeepaliveResult(input: {
  ok: boolean;
  latencyMs: number;
  category?: KeepaliveErrorCategory;
  incidentId?: string;
}) {
  const payload = {
    timestamp: new Date().toISOString(),
    ok: input.ok,
    latencyMs: input.latencyMs,
    category: input.category ?? null,
    incidentId: input.incidentId ?? null,
  };

  if (input.ok) {
    console.info("supabase_keepalive", payload);
    return;
  }

  console.error("supabase_keepalive_failed", payload);
}

export async function handleSupabaseKeepalive(
  request: Request,
  deps?: {
    ping?: typeof pingSupabaseDatabase;
    authorize?: typeof authorizeCronRequest;
    onFailure?: typeof notifyKeepaliveFailure;
    onRecovery?: typeof notifyKeepaliveRecovery;
  },
): Promise<KeepaliveHandlerResult> {
  const authorize = deps?.authorize ?? authorizeCronRequest;
  const ping = deps?.ping ?? pingSupabaseDatabase;
  const onFailure = deps?.onFailure ?? notifyKeepaliveFailure;
  const onRecovery = deps?.onRecovery ?? notifyKeepaliveRecovery;

  const auth = authorize(request);
  if (!auth.ok) {
    console.error("supabase_keepalive_auth_failed", {
      timestamp: new Date().toISOString(),
      reason: auth.reason,
    });
    return {
      status: 401,
      body: { ok: false, error: "Unauthorised" },
    };
  }

  const result = await ping();

  if (result.ok) {
    logKeepaliveResult({ ok: true, latencyMs: result.latencyMs });
    await onRecovery({ timestampIso: new Date().toISOString() });
    return { status: 200, body: { ok: true } };
  }

  const incidentId = randomUUID();
  logKeepaliveResult({
    ok: false,
    latencyMs: result.latencyMs,
    category: result.category,
    incidentId,
  });

  await onFailure({
    incidentId,
    timestampIso: new Date().toISOString(),
  });

  return {
    status: 503,
    body: {
      ok: false,
      error: "Backend unavailable",
      incidentId,
    },
  };
}
