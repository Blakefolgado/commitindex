import { NextRequest, NextResponse } from "next/server";
import { getOrganizationActivity, GitHubRequestError } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ org: string }> },
) {
  const { org } = await context.params;
  try {
    const payload = await getOrganizationActivity(org);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    const status = error instanceof GitHubRequestError ? error.status : 500;
    const safeStatus = status === 400 || status === 404 ? status : status === 403 || status === 429 ? 429 : 500;
    const message = safeStatus === 400
      ? "Invalid GitHub organisation name"
      : safeStatus === 404
        ? "GitHub organisation not found"
        : safeStatus === 429
          ? "GitHub rate limit reached. Try again shortly."
          : "Could not load this organisation";
    return NextResponse.json({ error: message }, { status: safeStatus });
  }
}
