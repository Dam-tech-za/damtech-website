import { NextResponse } from "next/server";
import { createMerchantFeedHttpResult } from "@/lib/catalogue/merchant-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function merchantFeedResponse(method: "GET" | "HEAD"): NextResponse {
  const result = createMerchantFeedHttpResult();
  const headers = {
    "Content-Type": result.contentType,
    "X-Robots-Tag": "noindex",
    "Cache-Control": "private, no-store",
  };
  if (method === "HEAD") {
    return new NextResponse(null, { status: result.status, headers });
  }
  return new NextResponse(result.body, { status: result.status, headers });
}

export function GET(): NextResponse {
  return merchantFeedResponse("GET");
}

export function HEAD(): NextResponse {
  return merchantFeedResponse("HEAD");
}
