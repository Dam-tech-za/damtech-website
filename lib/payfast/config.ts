/**
 * PayFast configuration. Credentials are server-only environment variables:
 *
 *   PAYFAST_MODE         "sandbox" (default) or "live"
 *   PAYFAST_MERCHANT_ID  merchant ID from the PayFast dashboard
 *   PAYFAST_MERCHANT_KEY merchant key from the PayFast dashboard
 *   PAYFAST_PASSPHRASE   passphrase set under Settings > Developer settings
 *
 * Never prefix these with NEXT_PUBLIC_. In sandbox mode, when no credentials
 * are set, PayFast's public shared sandbox account is used so the flow can
 * be tested end to end without touching real money.
 */

export type PayfastMode = "sandbox" | "live";

export type PayfastConfig = {
  mode: PayfastMode;
  merchantId: string;
  merchantKey: string;
  passphrase: string | null;
  processUrl: string;
  validateUrl: string;
  usingSharedSandboxAccount: boolean;
};

const HOSTS: Record<PayfastMode, string> = {
  sandbox: "https://sandbox.payfast.co.za",
  live: "https://www.payfast.co.za",
};

/** PayFast's public shared sandbox merchant (not a secret). */
const SHARED_SANDBOX = {
  merchantId: "10000100",
  merchantKey: "46f0cd694581a",
  passphrase: "jt7NOE43FZPn",
};

export type PayfastConfigResult =
  | { ok: true; config: PayfastConfig }
  | { ok: false; reason: string };

export function getPayfastConfig(
  env: Record<string, string | undefined> = process.env,
): PayfastConfigResult {
  const rawMode = (env.PAYFAST_MODE ?? "sandbox").trim().toLowerCase();
  if (rawMode !== "sandbox" && rawMode !== "live") {
    return { ok: false, reason: "PAYFAST_MODE must be sandbox or live." };
  }
  const mode: PayfastMode = rawMode;
  const merchantId = env.PAYFAST_MERCHANT_ID?.trim() ?? "";
  const merchantKey = env.PAYFAST_MERCHANT_KEY?.trim() ?? "";
  const passphrase = env.PAYFAST_PASSPHRASE?.trim() || null;
  const host = HOSTS[mode];
  const urls = {
    processUrl: `${host}/eng/process`,
    validateUrl: `${host}/eng/query/validate`,
  };

  if (!merchantId || !merchantKey) {
    if (mode === "live") {
      return {
        ok: false,
        reason: "PayFast live mode needs PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY.",
      };
    }
    return {
      ok: true,
      config: {
        mode,
        ...SHARED_SANDBOX,
        ...urls,
        usingSharedSandboxAccount: true,
      },
    };
  }
  if (!/^\d{5,12}$/.test(merchantId)) {
    return { ok: false, reason: "PAYFAST_MERCHANT_ID must be numeric." };
  }
  if (mode === "live" && !passphrase) {
    return {
      ok: false,
      reason: "Set PAYFAST_PASSPHRASE for live payments so notifications can be verified.",
    };
  }
  return {
    ok: true,
    config: { mode, merchantId, merchantKey, passphrase, ...urls, usingSharedSandboxAccount: false },
  };
}
