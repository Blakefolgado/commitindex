import { NextRequest } from "next/server";
import { getPersonContributionHistory } from "@/lib/github-person";
import { cardHeaders, renderGenericCard, renderPersonCard } from "@/lib/person-card";
import { summarizePerson } from "@/lib/person-summary";

export const runtime = "nodejs";

/**
 * Share card generator for a profile, with a generic no-user fallback.
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("user")?.trim().replace(/^@/, "");

  const body = await (async () => {
    if (!username) return renderGenericCard();
    try {
      const person = summarizePerson(await getPersonContributionHistory(username));
      if (!person.months.length) throw new Error("no contribution months");
      return renderPersonCard(person);
    } catch {
      return renderGenericCard();
    }
  })();

  return new Response(body, {
    headers: { ...cardHeaders, "Content-Length": String(body.byteLength) },
  });
}
