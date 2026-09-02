import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getPersonContributionHistory,
  GitHubPersonError,
  personCacheTag,
} from "@/lib/github-person";
import { recordPerson } from "@/lib/people-index";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  // ?refresh=1 drops this person's cached GitHub reads, for a profile whose
  // contribution settings changed and whose stored history is now wrong. It
  // invalidates rather than bypasses, so the next ordinary request — including
  // the one the page itself makes — also sees the new numbers.
  if (request.nextUrl.searchParams.get("refresh") === "1") {
    revalidateTag(personCacheTag(username), { expire: 0 });
  }

  try {
    const person = await getPersonContributionHistory(username);
    // Indexing is a side effect of someone looking a profile up; never let a
    // storage hiccup turn a successful lookup into an error page.
    await recordPerson(person).catch(() => {});
    return NextResponse.json(person, {
      headers: {
        // The GitHub reads behind this are cached by tag, so the response
        // itself is cheap to rebuild; not caching it at the edge is what makes
        // a refresh visible immediately rather than up to an hour later.
        "Cache-Control": "no-store",
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
