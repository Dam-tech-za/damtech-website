"use server";

import { redirect } from "next/navigation";
import { submitPublicInfoResponse } from "@/lib/rfq/info-request";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

export async function submitInfoResponseAction(
  formData: FormData,
): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const otherNotes = String(formData.get("otherNotes") ?? "");

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit({
    key: `rfq-info:${ip}`,
    ...RATE_LIMITS.publicRfqSubmission,
  });
  if (!limited.success) {
    redirect(`/quote/info/${token}/?error=${encodeURIComponent("Too many attempts.")}`);
  }

  // Bound customer-supplied answers: at most 40 fields, short keys, 2 000 chars each.
  const MAX_FIELDS = 40;
  const MAX_VALUE_LENGTH = 2000;
  const responses: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    const field = key.slice(6);
    if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(field)) continue;
    if (Object.keys(responses).length >= MAX_FIELDS) break;
    responses[field] = String(value).slice(0, MAX_VALUE_LENGTH);
  }

  const assetUpdates: Array<{
    assetId: string;
    rawInputPatches: Record<string, unknown>;
  }> = [];

  const assetIds = formData.getAll("assetId").map(String).filter(Boolean);
  for (const assetId of assetIds) {
    const patches: Record<string, unknown> = {};
    const prefix = `asset_${assetId}_`;
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith(prefix)) continue;
      const field = key.slice(prefix.length);
      if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(field)) continue;
      const raw = String(value).trim().slice(0, 2000);
      if (!raw) continue;
      const asNum = Number(raw);
      patches[field] = Number.isFinite(asNum) && raw !== "" ? asNum : raw;
    }
    if (Object.keys(patches).length) {
      assetUpdates.push({ assetId, rawInputPatches: patches });
    }
  }

  const result = await submitPublicInfoResponse({
    token,
    responses,
    assetUpdates,
    otherNotes: otherNotes || undefined,
  });

  if (!result.ok) {
    redirect(`/quote/info/${token}/?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/quote/info/${token}/success/`);
}
