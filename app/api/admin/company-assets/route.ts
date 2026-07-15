import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  buildCompanyAssetPath,
  createCompanyAssetSignedReadUrl,
  removeCompanyAssetObject,
  sanitiseSvgMarkup,
  settingsColumnForKind,
  validateCompanyAssetFile,
  type CompanyAssetKind,
  COMPANY_ASSETS_BUCKET,
} from "@/lib/storage/company-assets";

const KINDS = new Set<CompanyAssetKind>([
  "company_logo",
  "pdf_logo",
  "signature",
  "header_image",
]);

export async function POST(request: Request) {
  try {
    const admin = await assertAdmin({ roles: ["owner", "admin"] });
    const form = await request.formData();
    const kind = String(form.get("kind") ?? "") as CompanyAssetKind;
    const file = form.get("file");

    if (!KINDS.has(kind) || !(file instanceof File)) {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }

    const validation = validateCompanyAssetFile({
      mimeType: file.type,
      fileName: file.name,
      fileSize: file.size,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let uploadBody: Buffer | Blob = bytes;
    if (validation.mimeType === "image/svg+xml") {
      const sanitised = sanitiseSvgMarkup(bytes.toString("utf8"));
      if (!sanitised) {
        return NextResponse.json(
          { error: "SVG failed safety checks." },
          { status: 400 },
        );
      }
      uploadBody = Buffer.from(sanitised, "utf8");
    }

    const path = buildCompanyAssetPath(kind, validation.extension);
    const service = createServiceRoleClient();
    const { error: uploadError } = await service.storage
      .from(COMPANY_ASSETS_BUCKET)
      .upload(path, uploadBody, {
        contentType: validation.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[company-assets] upload", uploadError.message);
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    const target = settingsColumnForKind(kind);
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from(target.table)
      .select(target.column)
      .eq("id", 1)
      .maybeSingle();

    const previousPath =
      existing && typeof existing === "object"
        ? (existing as Record<string, unknown>)[target.column]
        : null;

    const { error: updateError } = await supabase
      .from(target.table)
      .update({
        [target.column]: path,
        updated_by: admin.user.id,
      })
      .eq("id", 1);

    if (updateError) {
      await removeCompanyAssetObject(path);
      return NextResponse.json({ error: "Unable to save path." }, { status: 500 });
    }

    if (typeof previousPath === "string" && previousPath && previousPath !== path) {
      await removeCompanyAssetObject(previousPath);
    }

    const { data: signed } = await createCompanyAssetSignedReadUrl(path);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "company_asset_uploaded",
      entityType: target.table,
      entityId: "1",
      afterData: { kind, path },
    });

    return NextResponse.json({
      ok: true,
      path,
      previewUrl: signed?.signedUrl ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unauthorised";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await assertAdmin({ roles: ["owner", "admin"] });
    const body = (await request.json()) as { kind?: CompanyAssetKind };
    const kind = body.kind;
    if (!kind || !KINDS.has(kind)) {
      return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    }

    const target = settingsColumnForKind(kind);
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from(target.table)
      .select(target.column)
      .eq("id", 1)
      .maybeSingle();

    const path =
      existing && typeof existing === "object"
        ? (existing as Record<string, unknown>)[target.column]
        : null;

    const { error } = await supabase
      .from(target.table)
      .update({ [target.column]: null, updated_by: admin.user.id })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: "Unable to clear path." }, { status: 500 });
    }

    if (typeof path === "string" && path) {
      await removeCompanyAssetObject(path);
    }

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "company_asset_removed",
      entityType: target.table,
      entityId: "1",
      beforeData: { kind, path },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unauthorised";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
