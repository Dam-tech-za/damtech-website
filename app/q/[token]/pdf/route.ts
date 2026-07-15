import { NextResponse } from "next/server";
import { getPublicQuotePdf } from "@/lib/quotes/public";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: Context) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit({
    key: `public-quote-pdf:${ip}`,
    ...RATE_LIMITS.publicQuoteView,
  });
  if (!limited.success) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { token } = await context.params;
  const result = await getPublicQuotePdf(token);
  if (!result.ok) {
    return new NextResponse(result.error, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
