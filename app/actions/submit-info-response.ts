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

  const responses: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("field_")) {
      responses[key.slice(6)] = String(value);
    }
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
      const raw = String(value).trim();
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
