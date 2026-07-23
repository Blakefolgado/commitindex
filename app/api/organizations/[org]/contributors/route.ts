import { NextRequest, NextResponse } from "next/server";
import { getOrganizationContributors, GitHubRequestError } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ org: string }> },
) {
  const { org } = await context.params;
  try {
    const payload = await getOrganizationContributors(org);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    const status = error instanceof GitHubRequestError ? error.status : 500;
    return NextResponse.json(
      { error: status === 404 ? "GitHub organisation not found" : "Could not load contributors" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}
