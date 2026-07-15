import { createHash, randomBytes } from "node:crypto";
import { createServiceRoleClient } from "../supabase/admin";

export const COMPANY_ASSETS_BUCKET = "company-assets";
export const COMPANY_ASSET_MAX_BYTES = 2 * 1024 * 1024;

export const COMPANY_ASSET_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
} as const;

export type CompanyAssetKind =
  | "company_logo"
  | "pdf_logo"
  | "signature"
  | "header_image";

export type CompanyAssetValidation =
  | { ok: true; extension: string; mimeType: keyof typeof COMPANY_ASSET_MIME }
  | { ok: false; error: string };

export function validateCompanyAssetFile(input: {
  mimeType: string;
  fileName: string;
  fileSize: number;
}): CompanyAssetValidation {
  if (input.fileSize <= 0 || input.fileSize > COMPANY_ASSET_MAX_BYTES) {
    return { ok: false, error: "File must be between 1 byte and 2 MB." };
  }

  const mime = input.mimeType.toLowerCase();
  if (!(mime in COMPANY_ASSET_MIME)) {
    return {
      ok: false,
      error: "Only PNG, JPEG, WEBP (and sanitised SVG) are allowed.",
    };
  }

  const extFromName = input.fileName.split(".").pop()?.toLowerCase() || "";
  const expected = COMPANY_ASSET_MIME[mime as keyof typeof COMPANY_ASSET_MIME];
  const allowedExt =
    mime === "image/jpeg"
      ? ["jpg", "jpeg"]
      : mime === "image/svg+xml"
        ? ["svg"]
        : [expected];

  if (extFromName && !allowedExt.includes(extFromName)) {
    return { ok: false, error: "File extension does not match content type." };
  }

  return {
    ok: true,
    extension: expected,
    mimeType: mime as keyof typeof COMPANY_ASSET_MIME,
  };
}

/** Strip script-like content from SVG before persistence. */
export function sanitiseSvgMarkup(raw: string): string | null {
  if (!raw.trim().toLowerCase().includes("<svg")) return null;
  const cleaned = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("|')[\s\S]*?\1/gi, "")
    .replace(/javascript:/gi, "");
  if (/<script/i.test(cleaned)) return null;
  return cleaned;
}

export function buildCompanyAssetPath(
  kind: CompanyAssetKind,
  extension: string,
): string {
  const stamp = randomBytes(8).toString("hex");
  return `${kind}/${stamp}.${extension}`;
}

export async function createCompanyAssetSignedUpload(path: string) {
  const service = createServiceRoleClient();
  return service.storage.from(COMPANY_ASSETS_BUCKET).createSignedUploadUrl(path);
}

export async function createCompanyAssetSignedReadUrl(
  path: string,
  expiresIn = 60 * 30,
) {
  const service = createServiceRoleClient();
  return service.storage
    .from(COMPANY_ASSETS_BUCKET)
    .createSignedUrl(path, expiresIn);
}

export async function removeCompanyAssetObject(path: string) {
  const service = createServiceRoleClient();
  return service.storage.from(COMPANY_ASSETS_BUCKET).remove([path]);
}

export function settingsColumnForKind(
  kind: CompanyAssetKind,
): { table: "company_settings" | "quote_pdf_settings"; column: string } {
  switch (kind) {
    case "company_logo":
      return { table: "company_settings", column: "logo_storage_path" };
    case "pdf_logo":
      return { table: "quote_pdf_settings", column: "logo_storage_path" };
    case "signature":
      return { table: "company_settings", column: "signature_storage_path" };
    case "header_image":
      return {
        table: "quote_pdf_settings",
        column: "header_image_storage_path",
      };
  }
}

export function hashAssetBytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
