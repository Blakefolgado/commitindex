import { NextRequest } from "next/server";
import { getPersonContributionHistory } from "@/lib/github-person";
import { readPeopleIndex, summarizePerson } from "@/lib/people-index";
import { cardHeaders, renderGenericCard, renderPersonCard } from "@/lib/person-card";

export const runtime = "nodejs";

/**
 * Fallback card generator. Shared links normally point straight at the PNG
 * saved in blob storage when the profile was searched; this route covers
 * profiles that have never been searched, and the no-user generic card.
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("user")?.trim().replace(/^@/, "");

  const body = await (async () => {
    if (!username) return renderGenericCard();
    try {
      const saved = (await readPeopleIndex()).find((entry) => (
        entry.login.toLowerCase() === username.toLowerCase() && entry.months?.length
      ));
      const person = saved ?? summarizePerson(await getPersonContributionHistory(username));
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
