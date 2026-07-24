import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationContributors, GitHubRequestError } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 30;

function isAuthorized(request: NextRequest) {
  const secret = process.env.COMMIT_INDEX_INGEST_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !provided) return false;

  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ org: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { org } = await context.params;
  try {
    return NextResponse.json(await getOrganizationContributors(org), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = error instanceof GitHubRequestError ? error.status : 500;
    return NextResponse.json(
      { error: status === 404 ? "GitHub organisation not found" : "Could not ingest contributors" },
      { status: status === 404 ? 404 : status === 403 || status === 429 ? 429 : 500 },
    );
  }
}
