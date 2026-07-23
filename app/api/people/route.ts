import { NextRequest, NextResponse } from "next/server";
import peopleData from "@/data/people.json";
import type { PeopleLeaderboardSnapshot } from "@/lib/types";

const snapshot = peopleData as PeopleLeaderboardSnapshot;

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids")
    ?.split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
  const summary = request.nextUrl.searchParams.get("summary") === "1";
  const entries = ids?.length
    ? snapshot.entries.filter((entry) => ids.includes(entry.id.toLowerCase()))
    : snapshot.entries;

  return NextResponse.json({
    ...snapshot,
    entries: summary
      ? entries.map((entry) => ({ ...entry, weeks: undefined }))
      : entries,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
