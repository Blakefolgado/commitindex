import { NextRequest, NextResponse } from "next/server";
import {
  getPersonContributionHistory,
  GitHubPersonError,
} from "@/lib/github-person";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;

  try {
    return NextResponse.json(await getPersonContributionHistory(username), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const status = error instanceof GitHubPersonError ? error.status : 500;
    const message = error instanceof GitHubPersonError
      ? error.message
      : "Could not load this GitHub contribution graph";
    return NextResponse.json(
      { error: message },
      { status: status === 400 || status === 404 ? status : status === 403 || status === 429 ? 429 : 502 },
    );
  }
}
