"use server";

import { createHash, randomBytes } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 20 * 1024 * 1024;

export async function createRfqUploadUrlAction(input: {
  rfqId: string;
  token: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category?: string;
}): Promise<
  | { ok: true; path: string; token: string; signedUrl: string }
  | { ok: false; error: string }
> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit({
    key: `rfq-upload:${ip}`,
    ...RATE_LIMITS.publicRfqUpload,
  });
  if (!limited.success) {
    return { ok: false, error: "Too many upload attempts." };
  }

  if (!ALLOWED.has(input.mimeType)) {
    return { ok: false, error: "File type not allowed." };
  }
  if (input.fileSize <= 0 || input.fileSize > MAX_BYTES) {
    return { ok: false, error: "File exceeds the 20 MB limit." };
  }

  const hash = createHash("sha256").update(input.token, "utf8").digest("hex");
  const service = createServiceRoleClient();
  const { data: rfq } = await service
    .from("rfqs")
    .select("id, public_upload_token_expires_at")
    .eq("id", input.rfqId)
    .eq("public_upload_token_hash", hash)
    .maybeSingle();

  if (!rfq) return { ok: false, error: "Upload link is invalid." };
  if (
    rfq.public_upload_token_expires_at &&
    new Date(rfq.public_upload_token_expires_at) < new Date()
  ) {
    return { ok: false, error: "Upload link has expired." };
  }

  const ext =
    input.mimeType === "application/pdf"
      ? "pdf"
      : input.mimeType === "image/png"
        ? "png"
        : input.mimeType === "image/webp"
          ? "webp"
          : "jpg";
  const safeName = `${randomBytes(16).toString("hex")}.${ext}`;
  const path = `${input.rfqId}/${safeName}`;

  const { data, error } = await service.storage
    .from("rfq-attachments")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[rfq-upload]", error?.message);
    return { ok: false, error: "Unable to prepare upload." };
  }

  await service.from("rfq_attachments").insert({
    rfq_id: input.rfqId,
    storage_path: path,
    file_name: input.fileName.slice(0, 200),
    mime_type: input.mimeType,
    file_size: input.fileSize,
    category: input.category || "other",
    uploaded_via: "public_token",
  });

  return {
    ok: true,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}
