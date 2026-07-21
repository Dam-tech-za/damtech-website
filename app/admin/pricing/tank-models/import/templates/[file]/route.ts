import { requireAdmin } from "@/lib/auth/require-admin";
import { buildTankStarterCsv, buildTankTemplateCsv } from "@/lib/pricing/tank-import/starter";

const FILES: Record<string, () => string> = {
  "damtech-tank-models-template.csv": buildTankTemplateCsv,
  "damtech-tank-models-starter.csv": buildTankStarterCsv,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  await requireAdmin({ permission: "viewPricing" });
  const { file } = await params;
  const builder = FILES[file];
  if (!builder) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(builder(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
