import { NextRequest, NextResponse } from "next/server";
import { getStoredContributors } from "@/lib/snapshots";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ org: string }> },
) {
  const { org } = await context.params;
  const payload = getStoredContributors(org);
  if (!payload) {
    return NextResponse.json({ error: "Company is not indexed" }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
