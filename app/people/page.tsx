import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PeopleExplorer } from "@/components/people-explorer";
import { SearchedPeople } from "@/components/searched-people";
import { readPeopleIndex } from "@/lib/people-index";

export const revalidate = 10;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; year?: string }>;
}): Promise<Metadata> {
  const user = (await searchParams).user?.trim().replace(/^@/, "") ?? "";
  // File-convention opengraph-image.tsx would win over this, so the route
  // handler is the single generator for both the generic and per-person cards.
  // Prefer the PNG stored when this profile was searched: a static CDN file
  // beats making a crawler wait while the card is drawn. ?v is bumped by hand
  // when the design changes, since crawlers cache the image per URL.
  const saved = user
    ? (await readPeopleIndex()).find((entry) => entry.login.toLowerCase() === user.toLowerCase())
    : undefined;
  const image = saved?.cardUrl
    ?? (user ? `/api/og/person?user=${encodeURIComponent(user)}&v=3` : "/api/og/person?v=3");
  const title = user
    ? `How much is @${user} shipping? — Commit Index`
    : "All-time GitHub contribution graph with AI release dates — Commit Index";
  const description = user
    ? `See how @${user}'s public GitHub contributions changed as major AI models and coding tools shipped.`
    : "Compare an all-time public GitHub contribution history with major AI model and coding-tool release dates.";
  const canonical = user ? `/people?user=${encodeURIComponent(user)}` : "/people";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; year?: string }>;
}) {
  const params = await searchParams;
  if (params.year) {
    redirect(params.user
      ? `/people?user=${encodeURIComponent(params.user)}`
      : "/people");
  }

  return (
    <Suspense fallback={null}>
      <PeopleExplorer
        initialUsername={params.user?.trim() || ""}
        leaderboard={<SearchedPeople />}
      />
    </Suspense>
  );
}
